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
  isDebugSkyLocked,
  registerCloudscapeThemeCallback,
  type SkyThemeUpdate,
} from './sky-theme'
import { applyTheme } from '../theme'
import type { CameraPose, CloudSettings, LightingSettings, SceneConfig } from './types'
import {
  cloudQualityForTier,
  resolveDeviceTier,
  shouldSkipCloudscape,
  type CloudQualityPreset,
} from './device-tier'

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
  getCurrentClouds: () => CloudSettings
  getCurrentLighting: () => LightingSettings
  /** When locked, scroll evaluation does not overwrite camera/clouds/lighting (playground). */
  setPlaygroundLock: (locked: boolean) => void
  isPlaygroundLocked: () => boolean
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
  const raw = document.body.getAttribute('data-scene-config')
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as SceneConfig
      ;(window as Window & { __BASEET_SCENE_CONFIG__?: SceneConfig }).__BASEET_SCENE_CONFIG__ =
        parsed
      return parsed
    } catch {
      /* fall through */
    }
  }
  const win = window as Window & { __BASEET_SCENE_CONFIG__?: SceneConfig }
  return win.__BASEET_SCENE_CONFIG__ ?? null
}

function waitAnimationFrames(count: number): Promise<void> {
  return new Promise((resolve) => {
    let remaining = count
    function step(): void {
      remaining -= 1
      if (remaining <= 0) resolve()
      else requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })
}

export function initCloudscape(opts: {
  canvas: HTMLCanvasElement
  sceneConfig: SceneConfig
}): CloudscapeRuntime {
  if (globalRuntime) return globalRuntime

  const config = opts.sceneConfig
  const cameraController = createCameraController(config)

  let quality = cloudQualityForTier(resolveDeviceTier())
  let renderScaleSteps = quality.renderScaleSteps
  let targetFps = quality.targetFps
  let frameInterval = 1000 / quality.targetFps
  let lastDrawTime = 0
  let skipObjects = quality.skipObjects

  sceneLog(
    'boot',
    `init page=${config.pageId} mode=toolcraft-clouds+glb tier=${quality.tier} scale=${quality.renderScale} fps=${quality.targetFps}`,
  )

  const renderer = new THREE.WebGLRenderer({
    canvas: opts.canvas,
    antialias: quality.antialias,
    alpha: true,
    powerPreference: quality.tier === 'high' ? 'high-performance' : 'low-power',
  })
  renderer.setPixelRatio(1)
  renderer.setClearColor(0x0b1b2b, 1)
  renderer.autoClear = false

  let baseRenderScale = quality.tier === 'high'
    ? Math.min(1, Math.max(0.75, readNumber(config.renderScale, 1)))
    : quality.renderScale
  let currentRenderScale = baseRenderScale

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
      uQuality: { value: quality.shaderQuality },
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
  if (!skipObjects) {
    objectRegistry.queuePreload(config.objects)
  }

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
    lowFpsSince: 0,
    highFpsSince: 0,
  }

  const composeScratch = {
    skyColor: new THREE.Color('#6fa8dc'),
    cloudColor: new THREE.Color('#ffffff'),
    lightColor: new THREE.Color('#ffffff'),
    sunDir: new THREE.Vector3(),
    cameraPos: new THREE.Vector3(),
    cameraTarget: new THREE.Vector3(),
  }

  let themeIntervalId: ReturnType<typeof setInterval> | null = null
  let colorSchemeMq: MediaQueryList | null = null
  let onColorSchemeChange: ((event: MediaQueryListEvent) => void) | null = null

  function applyQualityPreset(next: CloudQualityPreset): void {
    quality = next
    renderScaleSteps = next.renderScaleSteps
    targetFps = next.targetFps
    frameInterval = 1000 / next.targetFps
    skipObjects = next.skipObjects
    backgroundMaterial.uniforms.uQuality.value = next.shaderQuality
    if (next.tier === 'high') {
      baseRenderScale = Math.min(1, Math.max(0.75, readNumber(state.config.renderScale, 1)))
    } else {
      baseRenderScale = next.renderScale
    }
    const floor = renderScaleSteps[0]
    const ceil = Math.min(baseRenderScale, renderScaleSteps[renderScaleSteps.length - 1])
    currentRenderScale = Math.min(ceil, Math.max(floor, currentRenderScale))
    if (skipObjects) {
      objectRegistry.unloadWhere(() => true)
    } else {
      objectRegistry.registerAll(state.config.objects)
      objectRegistry.queuePreload(state.config.objects)
    }
  }

  function nearestScaleIndex(scale: number): number {
    let best = 0
    let bestDist = Infinity
    for (let i = 0; i < renderScaleSteps.length; i++) {
      const dist = Math.abs(renderScaleSteps[i] - scale)
      if (dist < bestDist) {
        best = i
        bestDist = dist
      }
    }
    return best
  }

  function stepDownRenderScale(): void {
    const idx = nearestScaleIndex(currentRenderScale)
    if (idx > 0) {
      currentRenderScale = renderScaleSteps[idx - 1]
      resize()
      sceneLog('perf', `renderScale stepped down to ${currentRenderScale}`)
    }
  }

  function stepUpRenderScale(): void {
    const idx = nearestScaleIndex(currentRenderScale)
    if (idx < renderScaleSteps.length - 1) {
      const next = Math.min(renderScaleSteps[idx + 1], baseRenderScale)
      if (next > currentRenderScale + 0.001) {
        currentRenderScale = next
        resize()
        sceneLog('perf', `renderScale stepped up to ${currentRenderScale}`)
      }
    }
  }

  function updateAdaptiveRenderScale(): void {
    const fps = state.fps
    if (fps <= 0) return
    const now = performance.now()
    const lowThreshold = Math.max(16, targetFps - 4)
    const highThreshold = Math.max(lowThreshold + 2, targetFps - 2)

    if (fps < lowThreshold) {
      if (state.lowFpsSince === 0) state.lowFpsSince = now
      if (now - state.lowFpsSince >= quality.lowFpsMs) {
        stepDownRenderScale()
        state.lowFpsSince = 0
        state.highFpsSince = 0
      }
    } else {
      state.lowFpsSince = 0
    }

    if (fps > highThreshold) {
      if (state.highFpsSince === 0) state.highFpsSince = now
      if (now - state.highFpsSince >= quality.highFpsMs) {
        stepUpRenderScale()
        state.highFpsSince = 0
        state.lowFpsSince = 0
      }
    } else {
      state.highFpsSince = 0
    }
  }

  function resize(): void {
    const next = cloudQualityForTier(resolveDeviceTier())
    if (next.tier !== quality.tier) {
      applyQualityPreset(next)
    }
    const displayW = opts.canvas.clientWidth || window.innerWidth
    const displayH = opts.canvas.clientHeight || window.innerHeight
    const pixelW = Math.max(1, Math.round(displayW * currentRenderScale))
    const pixelH = Math.max(1, Math.round(displayH * currentRenderScale))
    renderer.setPixelRatio(1)
    renderer.setSize(pixelW, pixelH, false)
    mainCamera.aspect = displayW / Math.max(1, displayH)
    mainCamera.updateProjectionMatrix()
    backgroundMaterial.uniforms.iResolution.value.set(pixelW, pixelH)
    if (!skipObjects) {
      const targets = ensureCloudRenderTargets(pixelW, pixelH, behindTarget, middleTarget)
      behindTarget = targets.behind
      middleTarget = targets.middle
    }
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
    state.clouds = { ...state.clouds, ...clouds }
    // Keep pageClouds in sync when playground locks/unlocks theme override
    if (typeof clouds.syncTheme === 'boolean') {
      state.pageClouds = { ...state.pageClouds, ...clouds, syncTheme: clouds.syncTheme }
    }
  }

  function applyLighting(lighting: LightingSettings): void {
    state.lighting = { ...state.lighting, ...lighting }
    if (state.pageClouds.syncTheme === false) {
      state.pageLighting = { ...state.pageLighting, ...lighting }
    }
  }

  let playgroundLocked = false

  function applySkyThemeUpdate(update: SkyThemeUpdate): void {
    if (playgroundLocked) return
    if (state.pageClouds.syncTheme === false) return
    cameraController.setBaseTheme(
      { ...state.pageClouds, ...update.clouds },
      { ...state.pageLighting, ...update.lighting },
    )
    applyTheme(update.uiTheme)
    const progress = scrollDriver.getProgress()
    const evaluated = cameraController.evaluateAtProgress(progress)
    sceneRuntime.applyClouds(evaluated.clouds)
    sceneRuntime.applyLighting(evaluated.lighting)
  }

  function syncSkyTheme(): void {
    if (isDebugSkyLocked()) return
    applyResolvedSkyToRuntime(state.pageClouds, state.pageLighting)
  }

  function composeFrame(): void {
    const clouds = state.clouds
    const lighting = state.lighting
    const cam = state.currentCamera
    const scratch = composeScratch

    scratch.cameraPos.set(cam.position[0], cam.position[1], cam.position[2])
    scratch.cameraTarget.set(cam.target[0], cam.target[1], cam.target[2])

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

    const depthGroups = skipObjects
      ? { behind: [], middle: [], in_front: [] }
      : objectRegistry.getGroupsByDepth()
    const behindCount = depthGroups.behind.length
    const middleCount = depthGroups.middle.length
    const inFrontCount = depthGroups.in_front.length

    renderer.setClearColor(scratch.skyColor, 1)
    renderer.setRenderTarget(null)
    renderer.clear(true, true, true)

    backgroundMaterial.uniforms.iTime.value = clock.getElapsedTime()
    backgroundMaterial.uniforms.uSpeed.value = readNumber(clouds.speed, 1)
    backgroundMaterial.uniforms.uDensity.value = readNumber(clouds.density, 1)
    backgroundMaterial.uniforms.uNoise.value = readNumber(clouds.noise, 0.5)
    backgroundMaterial.uniforms.uVerticalSpread.value = readNumber(clouds.verticalSpread, 0.78)
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
      updateAdaptiveRenderScale()
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
    getCurrentClouds: () => ({ ...state.clouds }),
    getCurrentLighting: () => ({ ...state.lighting }),
    setPlaygroundLock: (locked: boolean) => {
      playgroundLocked = locked
    },
    isPlaygroundLocked: () => playgroundLocked,
    setPageConfig(next) {
      state.config = next
      state.pageClouds = { ...(next.clouds || {}) }
      state.pageLighting = { ...(next.lighting || {}) }
      state.clouds = { ...state.pageClouds }
      state.lighting = { ...state.pageLighting }
      state.lowFpsSince = 0
      state.highFpsSince = 0
      cameraController.setConfig(next)
      objectRegistry.setAnchorIndex(next.scrollAnchors)
      objectRegistry.registerAll(next.objects)
      applyQualityPreset(cloudQualityForTier(resolveDeviceTier()))
      syncSkyTheme()
      resize()
    },
    renderFrame,
  }

  let bridge: ReturnType<typeof createPageTransitionBridge>

  function onScrollProgress(progress: number): void {
    if (bridge.getIsTransitioning()) return
    const evaluated = cameraController.evaluateAtProgress(progress)
    if (!playgroundLocked) {
      sceneRuntime.applyCamera(evaluated.camera)
      sceneRuntime.applyClouds(evaluated.clouds)
      sceneRuntime.applyLighting(evaluated.lighting)
    }
    objectRegistry.onScrollProgress(progress)
    objectRegistry.applyVisibility(evaluated.objectCommands)
    if (Math.abs(progress - state.lastProgress) > 0.01) {
      if (isSceneDebugEnabled()) {
        sceneLog(
          'scroll',
          `progress=${(progress * 100).toFixed(1)}% anchor=${evaluated.activeAnchorId} pos=${evaluated.camera.position.map((n) => n.toFixed(1)).join(',')} look=${evaluated.camera.target.map((n) => n.toFixed(1)).join(',')} fov=${evaluated.camera.fov.toFixed(1)}`,
        )
      }
      state.lastProgress = progress
    }
    pushDebugSnapshot(
      progress,
      evaluated.activeAnchorId,
      playgroundLocked ? state.currentCamera : evaluated.camera,
      playgroundLocked ? state.clouds : evaluated.clouds,
      objectRegistry,
      state.frame,
      state.fps,
    )
  }

  const scrollDriver = createScrollDriver({
    onProgress: onScrollProgress,
    externalTick: true,
  })

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
      void (async () => {
        const next = readSceneConfigFromWindow()
        if (!next) return
        await bridge.onAfterSwap(next)
        await waitAnimationFrames(2)
        scrollDriver.tick({ force: true, source: 'after-swap-settle' })
      })()
    })

    document.addEventListener('astro:page-load', () => {
      bridge.onPageLoad()
      // Backstop for a genuinely stuck transition. Must exceed the entry
      // lerp duration (~1200ms) so we never cut a legitimate handoff — the
      // old 100ms timeout snapped the camera to the new page's start pose
      // mid-lerp, which read as "rendering from the beginning".
      window.setTimeout(() => {
        if (bridge.getIsTransitioning()) {
          sceneWarn('nav', 'stuck isTransitioning after page-load — force clearing')
          bridge.forceEndTransition()
          scrollDriver.tick({ force: true, source: 'page-load-recovery' })
        }
      }, 3000)
    })

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        paused = true
        stopLoop()
      } else {
        paused = false
        startLoop()
        scrollDriver.tick({ force: true, source: 'visible' })
      }
    })

    window.addEventListener('resize', resize)
    scrollDriver.attach()

    themeIntervalId = setInterval(syncSkyTheme, 60_000)

    colorSchemeMq = window.matchMedia('(prefers-color-scheme: dark)')
    onColorSchemeChange = () => syncSkyTheme()
    colorSchemeMq.addEventListener('change', onColorSchemeChange)
  }

  function startLoop(): void {
    if (rafId !== null) return
    const tick = (now: number): void => {
      rafId = requestAnimationFrame(tick)
      if (paused) return
      scrollDriver.tick({ source: 'render-loop' })
      if (now - lastDrawTime < frameInterval) return
      lastDrawTime = now
      sceneRuntime.renderFrame()
    }
    rafId = requestAnimationFrame(tick)
  }

  function stopLoop(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  resize()
  syncSkyTheme()
  applyCamera(config.entryCamera)
  renderFrame()
  sceneLog('boot', `entry camera z=${config.entryCamera.position[2]}`)
  scrollDriver.tick({ force: true, source: 'init' })
  attachLifecycle()
  startLoop()

  function destroy(): void {
    stopLoop()
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
  if (shouldSkipCloudscape()) return false
  return document.body.dataset.sceneRenderer === 'cloudscape'
}

export function bootCloudscapeFromDom(): void {
  if (!shouldBootCloudscape()) {
    sceneLog('boot', 'skipped — reduced-motion, no WebGL, or already booted')
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
