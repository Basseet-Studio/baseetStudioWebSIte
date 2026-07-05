import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { cloudFragmentShader, cloudVertexShader } from './cloud-shader'
import { createCameraController } from './camera-controller'
import { createObjectRegistry, WORLD_SCALE } from './object-registry'
import { createPageTransitionBridge } from './page-transition-bridge'
import { createScrollDriver } from './scroll-driver'
import {
  isSceneDebugEnabled,
  sceneLog,
  sceneWarn,
  updateSceneDebugPanel,
} from './scene-debug'
import {
  applyResolvedSkyToRuntime,
  hexToVec3,
  registerCloudscapeThemeCallback,
  type SkyThemeUpdate,
} from './sky-theme'
import { applyTheme, readSavedTheme } from '../theme'
import type { CameraPose, CloudSettings, LightingSettings, SceneConfig } from './types'

export interface CloudscapeRuntime {
  sceneRuntime: SceneRuntime
  scrollDriver: ReturnType<typeof createScrollDriver>
  bridge: ReturnType<typeof createPageTransitionBridge>
  cameraController: ReturnType<typeof createCameraController>
  objectRegistry: ReturnType<typeof createObjectRegistry> | null
  destroy: () => void
}

export interface SceneRuntime {
  applyCamera: (cam: CameraPose) => void
  applyClouds: (clouds: CloudSettings) => void
  applyLighting: (lighting: LightingSettings) => void
  getCurrentCamera: () => CameraPose
  setPageConfig: (config: SceneConfig) => void
  renderFrame: () => void
}

let globalRuntime: CloudscapeRuntime | null = null
let listenersAttached = false
let paused = false
let rafId: number | null = null

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function sunDirectionFromAngles(
  azimuthDeg: number,
  elevationDeg: number,
  target = new THREE.Vector3(),
): THREE.Vector3 {
  const azimuth = (azimuthDeg * Math.PI) / 180
  const elevation = (elevationDeg * Math.PI) / 180
  const horizontal = Math.cos(elevation)
  return target
    .set(Math.sin(azimuth) * horizontal, Math.sin(elevation), Math.cos(azimuth) * horizontal)
    .normalize()
}

function copyHexToThreeColor(hex: string | undefined, fallback: string, target: THREE.Color): THREE.Color {
  const value = hex && hex.startsWith('#') ? hex : fallback
  try {
    return target.set(value)
  } catch {
    return target.set(fallback)
  }
}

function ensureCloudRenderTargets(
  width: number,
  height: number,
  behindTarget: THREE.WebGLRenderTarget | null,
  middleTarget: THREE.WebGLRenderTarget | null,
): { behind: THREE.WebGLRenderTarget; middle: THREE.WebGLRenderTarget } {
  const pixelWidth = Math.max(1, Math.round(width))
  const pixelHeight = Math.max(1, Math.round(height))

  let behind = behindTarget
  let middle = middleTarget

  if (!behind) {
    behind = new THREE.WebGLRenderTarget(pixelWidth, pixelHeight)
    behind.texture.minFilter = THREE.LinearFilter
    behind.texture.magFilter = THREE.LinearFilter
    behind.texture.generateMipmaps = false
  } else {
    behind.setSize(pixelWidth, pixelHeight)
  }

  if (!middle) {
    middle = new THREE.WebGLRenderTarget(pixelWidth, pixelHeight)
    middle.texture.minFilter = THREE.LinearFilter
    middle.texture.magFilter = THREE.LinearFilter
    middle.texture.generateMipmaps = false
    middle.depthTexture = new THREE.DepthTexture(pixelWidth, pixelHeight)
    middle.depthTexture.format = THREE.DepthFormat
    middle.depthTexture.type = THREE.FloatType
  } else {
    middle.setSize(pixelWidth, pixelHeight)
  }

  return { behind, middle }
}

function pushDebugSnapshot(
  progress: number,
  anchorId: string | null,
  camera: CameraPose,
  clouds: CloudSettings,
  objectRegistry: ReturnType<typeof createObjectRegistry>,
  frame: number,
  fps: number,
): void {
  if (!isSceneDebugEnabled()) return
  updateSceneDebugPanel({
    progress,
    anchorId,
    camera: {
      position: [...camera.position],
      target: [...camera.target],
      fov: camera.fov,
    },
    clouds: { density: clouds.density, skyColor: clouds.skyColor },
    objects: objectRegistry.getDebugEntries(),
    frame,
    fps,
  })
}

export function readSceneConfigFromWindow(): SceneConfig | null {
  const win = window as Window & { __BASEET_SCENE_CONFIG__?: SceneConfig }
  if (win.__BASEET_SCENE_CONFIG__) return win.__BASEET_SCENE_CONFIG__
  const raw = document.body.getAttribute('data-scene-config')
  if (!raw) return null
  try {
    return JSON.parse(raw) as SceneConfig
  } catch {
    return null
  }
}

export function initCloudscape(opts: {
  canvas: HTMLCanvasElement
  sceneConfig: SceneConfig
}): CloudscapeRuntime {
  if (globalRuntime) return globalRuntime

  const config = opts.sceneConfig
  const cameraController = createCameraController(config)

  sceneLog('boot', `init page=${config.pageId} mode=toolcraft-clouds+glb`)

  const renderer = new THREE.WebGLRenderer({
    canvas: opts.canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x0b1b2b, 1)
  renderer.autoClear = false

  const mainCamera = new THREE.PerspectiveCamera(
    config.entryCamera.fov,
    1,
    0.1,
    200,
  )

  const mainScene = new THREE.Scene()
  mainScene.background = null
  mainScene.fog = new THREE.FogExp2(0x6fa8dc, 0.021)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  mainScene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  mainScene.add(directionalLight)

  const objectRoot = new THREE.Group()
  objectRoot.scale.setScalar(WORLD_SCALE)
  mainScene.add(objectRoot)

  const backgroundScene = new THREE.Scene()
  const backgroundMaterial = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    fragmentShader: cloudFragmentShader,
    uniforms: {
      iResolution: { value: new THREE.Vector2(1, 1) },
      iTime: { value: 0 },
      tBackground: { value: null as THREE.Texture | null },
      tDepth: { value: null as THREE.Texture | null },
      uCameraFar: { value: 200 },
      uCameraNear: { value: 0.1 },
      uCameraPos: { value: new THREE.Vector3(0, 2, 10) },
      uCameraTarget: { value: new THREE.Vector3(0, 0, 0) },
      uCloudColor: { value: new THREE.Color('#ffffff') },
      uDensity: { value: 0.6 },
      uDepthBias: { value: -0.02 },
      uFogDensity: { value: 0.35 },
      uHasBackgroundColor: { value: 0 },
      uHasSceneDepth: { value: 0 },
      uLightIntensity: { value: 1 },
      uLightColor: { value: new THREE.Color('#ffffff') },
      uNoise: { value: 0.5 },
      uSkyColor: { value: new THREE.Color('#6fa8dc') },
      uSpeed: { value: 1 },
      uSunDir: { value: new THREE.Vector3(-1, 0.4, -1).normalize() },
      uVerticalSpread: { value: 0.5 },
      uViewMatrix: { value: new THREE.Matrix4() },
      uWorldScale: { value: WORLD_SCALE },
    },
    vertexShader: cloudVertexShader,
  })
  const backgroundQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), backgroundMaterial)
  backgroundScene.add(backgroundQuad)
  const backgroundCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const emptyColorTexture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1)
  emptyColorTexture.needsUpdate = true
  backgroundMaterial.uniforms.tBackground.value = emptyColorTexture

  let behindTarget: THREE.WebGLRenderTarget | null = null
  let middleTarget: THREE.WebGLRenderTarget | null = null

  const clock = new THREE.Clock()

  const objectRegistry = createObjectRegistry({
    THREE,
    GLTFLoader,
    parentGroup: objectRoot,
  })
  objectRegistry.setAnchorIndex(config.scrollAnchors)
  objectRegistry.registerAll(config.objects)
  objectRegistry.queuePreload(config.objects)

  const state = {
    config,
    clouds: { ...(config.clouds || {}) },
    lighting: { ...(config.lighting || {}) },
    currentCamera: { ...config.entryCamera },
    frame: 0,
    lastFpsTime: performance.now(),
    fps: 0,
    lastProgress: 0,
    pageClouds: { ...(config.clouds || {}) },
    pageLighting: { ...(config.lighting || {}) },
  }

  let themeIntervalId: ReturnType<typeof setInterval> | null = null
  let colorSchemeMq: MediaQueryList | null = null
  let onColorSchemeChange: ((event: MediaQueryListEvent) => void) | null = null

  function resize(): void {
    const w = opts.canvas.clientWidth || window.innerWidth
    const h = opts.canvas.clientHeight || window.innerHeight
    renderer.setSize(w, h, false)
    mainCamera.aspect = w / h
    mainCamera.updateProjectionMatrix()
    backgroundMaterial.uniforms.iResolution.value.set(w, h)
    const targets = ensureCloudRenderTargets(w, h, behindTarget, middleTarget)
    behindTarget = targets.behind
    middleTarget = targets.middle
  }

  function applyCamera(cam: CameraPose): void {
    state.currentCamera = { ...cam }
    mainCamera.position.set(cam.position[0], cam.position[1], cam.position[2])
    mainCamera.fov = cam.fov
    mainCamera.lookAt(cam.target[0], cam.target[1], cam.target[2])
    mainCamera.updateProjectionMatrix()
    mainCamera.updateMatrixWorld()
  }

  function applyClouds(clouds: CloudSettings): void {
    state.clouds = { ...clouds }
  }

  function applyLighting(lighting: LightingSettings): void {
    state.lighting = { ...lighting }
  }

  function applySkyThemeUpdate(update: SkyThemeUpdate): void {
    if (state.pageClouds.syncTheme === false) return
    cameraController.setBaseTheme(
      { ...state.pageClouds, ...update.clouds },
      { ...state.pageLighting, ...update.lighting },
    )
    if (!readSavedTheme()) {
      applyTheme(update.uiTheme)
    }
    const progress = scrollDriver.getProgress()
    const evaluated = cameraController.evaluateAtProgress(progress)
    sceneRuntime.applyClouds(evaluated.clouds)
    sceneRuntime.applyLighting(evaluated.lighting)
  }

  function syncSkyTheme(): void {
    applyResolvedSkyToRuntime(state.pageClouds, state.pageLighting, readSavedTheme())
  }

  function composeFrame(): void {
    const clouds = state.clouds
    const lighting = state.lighting
    const cam = state.currentCamera

    const scratch = {
      skyColor: new THREE.Color('#6fa8dc'),
      cloudColor: new THREE.Color('#ffffff'),
      lightColor: new THREE.Color('#ffffff'),
      sunDir: new THREE.Vector3(),
      cameraPos: new THREE.Vector3(cam.position[0], cam.position[1], cam.position[2]),
      cameraTarget: new THREE.Vector3(cam.target[0], cam.target[1], cam.target[2]),
    }

    sunDirectionFromAngles(
      readNumber(lighting.azimuth, 45),
      readNumber(lighting.elevation, 35),
      scratch.sunDir,
    )

    const lightIntensity = readNumber(lighting.intensity, 1)
    const fogDensity = readNumber(lighting.fogDensity, 0.35)

    copyHexToThreeColor(clouds.skyColor, '#6FA8DC', scratch.skyColor)
    copyHexToThreeColor(clouds.cloudColor, '#FFFFFF', scratch.cloudColor)
    copyHexToThreeColor(lighting.color, '#FFFFFF', scratch.lightColor)

    const sceneFog = mainScene.fog
    if (sceneFog instanceof THREE.FogExp2) {
      sceneFog.color.copy(scratch.skyColor)
      sceneFog.density = fogDensity * 0.06
    }

    directionalLight.position.copy(scratch.sunDir).multiplyScalar(20)
    directionalLight.intensity = lightIntensity
    ambientLight.intensity = 0.35 + lightIntensity * 0.2

    const depthGroups = objectRegistry.getGroupsByDepth()
    const behindCount = depthGroups.behind.length
    const middleCount = depthGroups.middle.length
    const inFrontCount = depthGroups.in_front.length

    renderer.setClearColor(scratch.skyColor, 1)
    renderer.setRenderTarget(null)
    renderer.clear(true, true, true)

    backgroundMaterial.uniforms.iTime.value = clock.getElapsedTime()
    backgroundMaterial.uniforms.uSpeed.value = readNumber(clouds.speed, 1)
    backgroundMaterial.uniforms.uDensity.value = readNumber(clouds.density, 0.6)
    backgroundMaterial.uniforms.uNoise.value = readNumber(clouds.noise, 0.5)
    backgroundMaterial.uniforms.uVerticalSpread.value = readNumber(clouds.verticalSpread, 0.5)
    backgroundMaterial.uniforms.uFogDensity.value = fogDensity
    backgroundMaterial.uniforms.uSkyColor.value.copy(scratch.skyColor)
    backgroundMaterial.uniforms.uCloudColor.value.copy(scratch.cloudColor)
    backgroundMaterial.uniforms.uSunDir.value.copy(scratch.sunDir)
    backgroundMaterial.uniforms.uLightIntensity.value = lightIntensity
    backgroundMaterial.uniforms.uLightColor.value.copy(scratch.lightColor)
    backgroundMaterial.uniforms.uCameraPos.value.copy(scratch.cameraPos)
    backgroundMaterial.uniforms.uCameraTarget.value.copy(scratch.cameraTarget)
    backgroundMaterial.uniforms.uCameraNear.value = mainCamera.near
    backgroundMaterial.uniforms.uCameraFar.value = mainCamera.far
    backgroundMaterial.uniforms.uViewMatrix.value.copy(mainCamera.matrixWorldInverse)
    backgroundMaterial.uniforms.uWorldScale.value = WORLD_SCALE

    if (behindCount > 0 && behindTarget) {
      objectRegistry.setModelsVisibleForDepthPass('behind')
      renderer.setRenderTarget(behindTarget)
      renderer.clear(true, true, true)
      renderer.render(mainScene, mainCamera)
      backgroundMaterial.uniforms.tBackground.value = behindTarget.texture
      backgroundMaterial.uniforms.uHasBackgroundColor.value = 1
    } else {
      backgroundMaterial.uniforms.tBackground.value = emptyColorTexture
      backgroundMaterial.uniforms.uHasBackgroundColor.value = 0
    }

    if (middleCount > 0 && middleTarget) {
      objectRegistry.setModelsVisibleForDepthPass('middle')
      renderer.setRenderTarget(middleTarget)
      renderer.clear(true, true, true)
      renderer.render(mainScene, mainCamera)
      backgroundMaterial.uniforms.tDepth.value = middleTarget.depthTexture
      backgroundMaterial.uniforms.uHasSceneDepth.value = 1
    } else if (middleTarget?.depthTexture) {
      backgroundMaterial.uniforms.tDepth.value = middleTarget.depthTexture
      backgroundMaterial.uniforms.uHasSceneDepth.value = 0
    }

    renderer.setRenderTarget(null)
    renderer.clear(true, true, true)
    renderer.render(backgroundScene, backgroundCamera)

    if (inFrontCount > 0) {
      renderer.clearDepth()
      objectRegistry.setModelsVisibleForDepthPass('in_front')
      renderer.render(mainScene, mainCamera)
    }

    objectRegistry.setModelsVisibleForDepthPass('all')
  }

  function renderFrame(): void {
    state.frame += 1
    const now = performance.now()
    if (now - state.lastFpsTime >= 1000) {
      state.fps = state.frame
      state.frame = 0
      state.lastFpsTime = now
    }
    composeFrame()
  }

  const sceneRuntime: SceneRuntime = {
    applyCamera,
    applyClouds,
    applyLighting,
    getCurrentCamera: () => ({ ...state.currentCamera }),
    setPageConfig(next) {
      state.config = next
      state.pageClouds = { ...(next.clouds || {}) }
      state.pageLighting = { ...(next.lighting || {}) }
      state.clouds = { ...state.pageClouds }
      state.lighting = { ...state.pageLighting }
      cameraController.setConfig(next)
      objectRegistry.setAnchorIndex(next.scrollAnchors)
      objectRegistry.registerAll(next.objects)
      objectRegistry.queuePreload(next.objects)
      syncSkyTheme()
    },
    renderFrame,
  }

  let bridge: ReturnType<typeof createPageTransitionBridge>

  function onScrollProgress(progress: number): void {
    if (bridge.getIsTransitioning()) return
    const evaluated = cameraController.evaluateAtProgress(progress)
    sceneRuntime.applyCamera(evaluated.camera)
    sceneRuntime.applyClouds(evaluated.clouds)
    sceneRuntime.applyLighting(evaluated.lighting)
    objectRegistry.onScrollProgress(progress)
    objectRegistry.applyVisibility(evaluated.objectCommands)
    if (Math.abs(progress - state.lastProgress) > 0.01) {
      sceneLog(
        'scroll',
        `progress=${(progress * 100).toFixed(1)}% anchor=${evaluated.activeAnchorId} objects=${JSON.stringify(evaluated.objectCommands.show || [])}`,
      )
      state.lastProgress = progress
    }
    pushDebugSnapshot(
      progress,
      evaluated.activeAnchorId,
      evaluated.camera,
      evaluated.clouds,
      objectRegistry,
      state.frame,
      state.fps,
    )
  }

  const scrollDriver = createScrollDriver({ onProgress: onScrollProgress })

  bridge = createPageTransitionBridge({
    sceneRuntime,
    cameraController,
    scrollDriver,
    objectRegistry,
  })

  registerCloudscapeThemeCallback(applySkyThemeUpdate)

  function attachLifecycle(): void {
    if (listenersAttached) return
    listenersAttached = true

    document.addEventListener('astro:before-swap', () => {
      bridge.onBeforeSwap({
        exitCamera: sceneRuntime.getCurrentCamera(),
        exitProgress: scrollDriver.getProgress(),
      })
    })

    document.addEventListener('astro:after-swap', (event) => {
      const swapEvent = event as Event & { newDocument?: Document }
      const newBody = swapEvent.newDocument?.body
      if (newBody) {
        const raw = newBody.getAttribute('data-scene-config')
        if (raw) {
          try {
            ;(window as Window & { __BASEET_SCENE_CONFIG__?: SceneConfig }).__BASEET_SCENE_CONFIG__ =
              JSON.parse(raw) as SceneConfig
          } catch {
            /* ignore */
          }
        }
      }
      const next = readSceneConfigFromWindow()
      if (next) void bridge.onAfterSwap(next)
    })

    document.addEventListener('astro:page-load', () => {
      bridge.onPageLoad()
    })

    document.addEventListener('visibilitychange', () => {
      paused = document.hidden
    })

    window.addEventListener('resize', resize)
    scrollDriver.attach()

    themeIntervalId = setInterval(syncSkyTheme, 60_000)

    colorSchemeMq = window.matchMedia('(prefers-color-scheme: dark)')
    onColorSchemeChange = () => syncSkyTheme()
    colorSchemeMq.addEventListener('change', onColorSchemeChange)
  }

  function loop(): void {
    if (!paused) sceneRuntime.renderFrame()
    rafId = requestAnimationFrame(loop)
  }

  resize()
  syncSkyTheme()
  applyCamera(config.entryCamera)
  renderFrame()
  sceneLog('boot', `entry camera z=${config.entryCamera.position[2]}`)
  scrollDriver.tick({ force: true, source: 'init' })
  attachLifecycle()
  rafId = requestAnimationFrame(loop)

  function destroy(): void {
    if (rafId) cancelAnimationFrame(rafId)
    scrollDriver.detach()
    window.removeEventListener('resize', resize)
    if (themeIntervalId) clearInterval(themeIntervalId)
    if (colorSchemeMq && onColorSchemeChange) {
      colorSchemeMq.removeEventListener('change', onColorSchemeChange)
    }
    registerCloudscapeThemeCallback(() => {})
    listenersAttached = false
    behindTarget?.dispose()
    middleTarget?.dispose()
    emptyColorTexture.dispose()
    backgroundMaterial.dispose()
    backgroundQuad.geometry.dispose()
    renderer.dispose()
    globalRuntime = null
  }

  globalRuntime = {
    sceneRuntime,
    scrollDriver,
    bridge,
    cameraController,
    objectRegistry,
    destroy,
  }

  return globalRuntime
}

export function getCloudscapeRuntime(): CloudscapeRuntime | null {
  return globalRuntime
}

export function shouldBootCloudscape(): boolean {
  if (document.documentElement.hasAttribute('data-baseet-cloudscape-booted')) {
    return false
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  const mobile =
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    window.innerWidth < 600
  if (mobile) return false
  return document.body.dataset.sceneRenderer === 'cloudscape'
}

export function bootCloudscapeFromDom(): void {
  if (!shouldBootCloudscape()) {
    sceneLog('boot', 'skipped — mobile, reduced-motion, or already booted')
    const fb = document.getElementById('cloudscape-fallback')
    if (fb) fb.style.display = 'block'
    return
  }

  const canvas = document.getElementById('cloudscape-canvas') as HTMLCanvasElement | null
  const config = readSceneConfigFromWindow()
  if (!canvas || !config) {
    sceneWarn('boot', 'missing canvas or scene config')
    const fb = document.getElementById('cloudscape-fallback')
    if (fb) fb.style.display = 'block'
    return
  }

  document.documentElement.setAttribute('data-baseet-cloudscape-booted', '1')
  initCloudscape({ canvas, sceneConfig: config })
}

// Re-export for consumers that need hex → vec3
export { hexToVec3 }
