import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { cloudFragmentShader, cloudVertexShader } from './cloud-shader'
import { skyCompositeFragmentShader, skyCompositeVertexShader } from './sky-composite-shader'
import { createCameraController } from './camera-controller'
import { createObjectRegistry, WORLD_SCALE } from './object-registry'
import { createPageTransitionBridge } from './page-transition-bridge'
import { createScrollDriver } from './scroll-driver'
import { applyCameraMotion, noteScrollProgress } from './camera-motion'
import { initLandmark } from './landmark'
import {
  isSceneDebugEnabled,
  sceneLog,
  sceneWarn,
  updateSceneDebugPanel,
} from './scene-debug'
import {
  applyResolvedSkyToRuntime,
  getDebugPreviewHour,
  hexToVec3,
  isDebugSkyLocked,
  registerCloudscapeThemeCallback,
  type SkyThemeUpdate,
} from './sky-theme'
import { applyTheme, getEffectiveSkyHour } from '../theme'
import type { CameraPose, CloudSettings, LightingSettings, SceneConfig } from './types'
import { createSkyDomeController, type SkyDomeManifest, type SkyDomeSettings } from './sky-dome'
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
  applySkydome: (settings: Partial<SkyDomeSettings>) => void
  getCurrentCamera: () => CameraPose
  getCurrentClouds: () => CloudSettings
  getCurrentLighting: () => LightingSettings
  getSkydome: () => SkyDomeSettings
  getSkyDomeManifest: () => SkyDomeManifest | null
  /** When locked, scroll evaluation does not overwrite camera/clouds/lighting (playground). */
  setPlaygroundLock: (locked: boolean) => void
  isPlaygroundLocked: () => boolean
  /** Playground: freeze only the camera (scroll still drives clouds/lighting unless look-locked). */
  setCameraLock: (locked: boolean) => void
  setPageConfig: (config: SceneConfig) => void
  renderFrame: () => void
}

let globalRuntime: CloudscapeRuntime | null = null
let listenersAttached = false
let paused = false
let rafId: number | null = null

/** Max device-pixel-ratio for the full-res sky / model pass, per tier. */
const SKY_DPR_CAP: Record<string, number> = { high: 2, medium: 1.5, low: 1 }
/** How far the cloud field streams past over a full page scroll. */
const SCROLL_WIND = 30

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

function makeColorTarget(w: number, h: number): THREE.WebGLRenderTarget {
  const rt = new THREE.WebGLRenderTarget(w, h)
  rt.texture.minFilter = THREE.LinearFilter
  rt.texture.magFilter = THREE.LinearFilter
  rt.texture.generateMipmaps = false
  return rt
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
    `init page=${config.pageId} mode=split-sky+clouds tier=${quality.tier} scale=${quality.renderScale} fps=${quality.targetFps}`,
  )

  const renderer = new THREE.WebGLRenderer({
    canvas: opts.canvas,
    antialias: quality.antialias,
    alpha: true,
    powerPreference: quality.tier === 'high' ? 'high-performance' : 'low-power',
  })
  // Canvas buffer size is managed explicitly in resize() (display px x sky DPR).
  renderer.setPixelRatio(1)
  renderer.setClearColor(0x0b1b2b, 1)
  renderer.autoClear = false

  let baseRenderScale = quality.tier === 'high'
    ? Math.min(1, Math.max(0.75, readNumber(config.renderScale, 1)))
    : quality.renderScale
  let currentRenderScale = Math.min(baseRenderScale, renderScaleSteps[renderScaleSteps.length - 1])

  // far 400: the satellite ground under the low cloud carpet sits ~100-300 away.
  const mainCamera = new THREE.PerspectiveCamera(config.entryCamera.fov, 1, 0.1, 400)

  const mainScene = new THREE.Scene()
  mainScene.background = null
  mainScene.fog = new THREE.FogExp2(0x6fa8dc, 0.021)
  // Soft studio reflections so glass/metal towers aren't black.
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()
  mainScene.environment = envTexture
  ;(mainScene as THREE.Scene & { environmentIntensity?: number }).environmentIntensity = 0.35

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  mainScene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  mainScene.add(directionalLight)

  const objectRoot = new THREE.Group()
  objectRoot.scale.setScalar(WORLD_SCALE)
  mainScene.add(objectRoot)

  // ---- Pass 1: clouds (low-res, adaptive) -> cloudTarget (premultiplied rgba)
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
      uCameraFar: { value: 400 },
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
      uSeed: { value: 0 },
      uLowClumpScale: { value: 0.55 },
      uHighClumpScale: { value: 1.15 },
      uApart: { value: 1 },
      tSkyALo: { value: null as THREE.Texture | null },
      tSkyAHi: { value: null as THREE.Texture | null },
      tSkyBLo: { value: null as THREE.Texture | null },
      tSkyBHi: { value: null as THREE.Texture | null },
      uSkyFullMixA: { value: 0 },
      uSkyFullMixB: { value: 0 },
      uSkyBlend: { value: 0 },
      uSkyYaw: { value: 0 },
      uSkyMix: { value: 1 },
      uSkyHorizon: { value: new THREE.Color('#a8c6e8') },
      uSkyZenith: { value: new THREE.Color('#5f9be0') },
      uSkyFloor: { value: 1 },
      uFocal: { value: 1.5 },
      uCloudsOnly: { value: 1 },
    },
    vertexShader: cloudVertexShader,
  })
  const backgroundQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), backgroundMaterial)
  backgroundScene.add(backgroundQuad)
  const backgroundCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const emptyColorTexture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1)
  emptyColorTexture.needsUpdate = true
  backgroundMaterial.uniforms.tBackground.value = emptyColorTexture

  // ---- Pass 2: full-res sky photo + composite. Shares uniform objects with
  // the cloud material so the skydome controller / composeFrame drive both.
  const bu = backgroundMaterial.uniforms
  const compositeScene = new THREE.Scene()
  const compositeMaterial = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    vertexShader: skyCompositeVertexShader,
    fragmentShader: skyCompositeFragmentShader,
    uniforms: {
      uResolution: { value: new THREE.Vector2(1, 1) },
      tClouds: { value: emptyColorTexture as THREE.Texture },
      tMiddle: { value: emptyColorTexture as THREE.Texture },
      uHasMiddle: { value: 0 },
      tBackground: { value: emptyColorTexture as THREE.Texture },
      uHasBackgroundColor: { value: 0 },
      uCameraPos: bu.uCameraPos,
      uCameraTarget: bu.uCameraTarget,
      uWorldScale: bu.uWorldScale,
      uFocal: bu.uFocal,
      uSkyColor: bu.uSkyColor,
      uCloudColor: bu.uCloudColor,
      uSunDir: bu.uSunDir,
      uLightColor: bu.uLightColor,
      uLightIntensity: bu.uLightIntensity,
      tSkyALo: bu.tSkyALo,
      tSkyAHi: bu.tSkyAHi,
      tSkyBLo: bu.tSkyBLo,
      tSkyBHi: bu.tSkyBHi,
      uSkyFullMixA: bu.uSkyFullMixA,
      uSkyFullMixB: bu.uSkyFullMixB,
      uSkyBlend: bu.uSkyBlend,
      uSkyYaw: bu.uSkyYaw,
      uSkyMix: bu.uSkyMix,
      uSkyHorizon: bu.uSkyHorizon,
      uSkyFloor: bu.uSkyFloor,
    },
  })
  const compositeQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), compositeMaterial)
  compositeScene.add(compositeQuad)

  const skyDome = createSkyDomeController(
    {
      tSkyALo: bu.tSkyALo,
      tSkyAHi: bu.tSkyAHi,
      tSkyBLo: bu.tSkyBLo,
      tSkyBHi: bu.tSkyBHi,
      uSkyFullMixA: bu.uSkyFullMixA,
      uSkyFullMixB: bu.uSkyFullMixB,
      uSkyBlend: bu.uSkyBlend,
      uSkyYaw: bu.uSkyYaw,
      uSkyMix: bu.uSkyMix,
      uSkyFloor: bu.uSkyFloor,
    },
    { tier: quality.tier },
  )

  let cloudTarget: THREE.WebGLRenderTarget | null = null
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
  if (!skipObjects) initLandmark(objectRegistry)

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
    domeSunDir: new THREE.Vector3(),
    domeColor: new THREE.Color(),
  }

  let themeIntervalId: ReturnType<typeof setInterval> | null = null
  let colorSchemeMq: MediaQueryList | null = null
  let onColorSchemeChange: ((event: MediaQueryListEvent) => void) | null = null
  let lastSkyElapsed = 0

  function applyQualityPreset(next: CloudQualityPreset): void {
    quality = next
    renderScaleSteps = next.renderScaleSteps
    targetFps = next.targetFps
    frameInterval = 1000 / next.targetFps
    skipObjects = next.skipObjects
    bu.uQuality.value = next.shaderQuality
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
      sceneLog('perf', `cloud renderScale stepped down to ${currentRenderScale}`)
    }
  }

  function stepUpRenderScale(): void {
    const idx = nearestScaleIndex(currentRenderScale)
    if (idx < renderScaleSteps.length - 1) {
      const next = Math.min(renderScaleSteps[idx + 1], baseRenderScale)
      if (next > currentRenderScale + 0.001) {
        currentRenderScale = next
        resize()
        sceneLog('perf', `cloud renderScale stepped up to ${currentRenderScale}`)
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

    // Full-res: sky photo, behind/in-front models. Cheap per pixel.
    const dpr = Math.min(window.devicePixelRatio || 1, SKY_DPR_CAP[quality.tier] ?? 1)
    const fullW = Math.max(1, Math.round(displayW * dpr))
    const fullH = Math.max(1, Math.round(displayH * dpr))
    // Low-res: raymarched clouds + their depth pre-pass. Adaptive.
    const cloudW = Math.max(1, Math.round(displayW * currentRenderScale))
    const cloudH = Math.max(1, Math.round(displayH * currentRenderScale))

    renderer.setPixelRatio(1)
    renderer.setSize(fullW, fullH, false)
    mainCamera.aspect = displayW / Math.max(1, displayH)
    mainCamera.updateProjectionMatrix()

    bu.iResolution.value.set(cloudW, cloudH)
    compositeMaterial.uniforms.uResolution.value.set(fullW, fullH)

    if (!cloudTarget) cloudTarget = makeColorTarget(cloudW, cloudH)
    else cloudTarget.setSize(cloudW, cloudH)

    if (!skipObjects) {
      if (!behindTarget) behindTarget = makeColorTarget(fullW, fullH)
      else behindTarget.setSize(fullW, fullH)

      if (!middleTarget) {
        middleTarget = makeColorTarget(fullW, fullH)
        middleTarget.depthTexture = new THREE.DepthTexture(fullW, fullH)
        middleTarget.depthTexture.format = THREE.DepthFormat
        middleTarget.depthTexture.type = THREE.FloatType
      } else {
        middleTarget.setSize(fullW, fullH)
      }
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

  function applySkydome(partial: Partial<SkyDomeSettings>): void {
    skyDome.applySettings(partial)
  }

  let playgroundLocked = false
  let cameraLocked = false

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

    let lightIntensity = readNumber(lighting.intensity, 1)
    const fogDensity = readNumber(lighting.fogDensity, 0.35)

    copyHexToThreeColor(clouds.skyColor, '#6FA8DC', scratch.skyColor)
    copyHexToThreeColor(clouds.cloudColor, '#FFFFFF', scratch.cloudColor)
    copyHexToThreeColor(lighting.color, '#FFFFFF', scratch.lightColor)

    // Skydome lighting: blend page lighting toward the sky photo's sun/horizon.
    const domeSettings = skyDome.getSettings()
    const domeMix = domeSettings.enabled ? Math.max(0, Math.min(1, domeSettings.mix)) : 0
    const domeLight = domeMix > 0 && domeSettings.sunFromSky ? skyDome.getLighting() : null
    const uSkyHorizon = bu.uSkyHorizon.value as THREE.Color
    const uSkyZenith = bu.uSkyZenith.value as THREE.Color
    if (domeLight) {
      // Light everything from the sky photo on screen (per frame, follows the hour).
      const lumOf = (c: [number, number, number]) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]
      const skyLum = (lumOf(domeLight.zenith) + lumOf(domeLight.horizon)) * 0.5
      const x = Math.min(1, Math.max(0, (skyLum - 0.06) / (0.42 - 0.06)))
      const dayness = x * x * (3 - 2 * x)

      scratch.domeSunDir.set(domeLight.sunDir[0], domeLight.sunDir[1], domeLight.sunDir[2])
      scratch.sunDir.lerp(scratch.domeSunDir, 0.6).normalize()

      scratch.domeColor.setRGB(domeLight.sunColor[0], domeLight.sunColor[1], domeLight.sunColor[2])
      scratch.lightColor.lerp(scratch.domeColor, 0.65)

      // Cloud body colour: white-ish by day, takes the sky's tones at dawn/dusk/night.
      scratch.domeColor.setRGB(
        Math.min(1, (domeLight.zenith[0] + domeLight.horizon[0]) * 0.9),
        Math.min(1, (domeLight.zenith[1] + domeLight.horizon[1]) * 0.9),
        Math.min(1, (domeLight.zenith[2] + domeLight.horizon[2]) * 0.9),
      )
      scratch.cloudColor.lerp(scratch.domeColor, 0.2 + 0.6 * (1 - dayness))

      scratch.domeColor.setRGB(domeLight.horizon[0], domeLight.horizon[1], domeLight.horizon[2])
      scratch.skyColor.lerp(scratch.domeColor, 0.3 * domeMix)

      // Page intensity is the daytime maximum; night drops to ~20%.
      lightIntensity =
        lightIntensity * (0.2 + 0.85 * dayness) + domeLight.sunStrength * 0.4 * dayness

      uSkyHorizon.setRGB(domeLight.horizon[0], domeLight.horizon[1], domeLight.horizon[2])
      uSkyZenith.setRGB(domeLight.zenith[0], domeLight.zenith[1], domeLight.zenith[2])
    } else {
      // Before photo analysis: a sky-blue gradient — NOT white (cloud colour),
      // which used to bleach the cloud haze toward white.
      uSkyHorizon.copy(scratch.skyColor)
      uSkyZenith.copy(scratch.skyColor).multiplyScalar(0.82)
    }

    const sceneFog = mainScene.fog
    if (sceneFog instanceof THREE.FogExp2) {
      // Aerial haze on models: the photo's horizon colour (models render
      // linear, the composite converts to sRGB -> convert the fog colour too).
      sceneFog.color.copy(domeLight ? uSkyHorizon : scratch.skyColor).convertSRGBToLinear()
      sceneFog.density = fogDensity * 0.03
    }

    directionalLight.position.copy(scratch.sunDir).multiplyScalar(20)
    directionalLight.intensity = lightIntensity
    ambientLight.intensity = 0.6 + lightIntensity * 0.3

    const depthGroups = skipObjects
      ? { behind: [], middle: [], in_front: [] }
      : objectRegistry.getGroupsByDepth()
    const behindCount = depthGroups.behind.length
    const middleCount = depthGroups.middle.length
    const inFrontCount = depthGroups.in_front.length

    const elapsed = clock.getElapsedTime()
    bu.iTime.value = elapsed + scrollDriver.getProgress() * SCROLL_WIND
    const skyDt = lastSkyElapsed === 0 ? 1 / 60 : Math.max(0, elapsed - lastSkyElapsed)
    lastSkyElapsed = elapsed
    const skyHour = getDebugPreviewHour() ?? getEffectiveSkyHour()
    skyDome.tick(skyHour, skyDt)
    bu.uSpeed.value = readNumber(clouds.speed, 1)
    bu.uDensity.value = readNumber(clouds.density, 1)
    bu.uNoise.value = readNumber(clouds.noise, 0.5)
    bu.uVerticalSpread.value = readNumber(clouds.verticalSpread, 0.78)
    bu.uSeed.value = readNumber(clouds.seed, 0)
    bu.uLowClumpScale.value = readNumber(clouds.lowClumpScale, 0.55)
    bu.uHighClumpScale.value = readNumber(clouds.highClumpScale, 1.15)
    bu.uApart.value = readNumber(clouds.apart, 1)
    bu.uFogDensity.value = fogDensity
    bu.uSkyColor.value.copy(scratch.skyColor)
    bu.uCloudColor.value.copy(scratch.cloudColor)
    bu.uSunDir.value.copy(scratch.sunDir)
    bu.uLightIntensity.value = lightIntensity
    bu.uLightColor.value.copy(scratch.lightColor)
    bu.uCameraPos.value.copy(scratch.cameraPos)
    bu.uCameraTarget.value.copy(scratch.cameraTarget)
    bu.uCameraNear.value = mainCamera.near
    bu.uCameraFar.value = mainCamera.far
    // One lens for everything: sky, clouds and GLB depth share the real FOV.
    // (The old 1.5x / 55-100 clamp desynced cloud depth tests from the models.)
    // Frame a wider sky by raising the anchor FOV in the scene config instead.
    const camFov = Math.max(1, Math.min(179, readNumber(cam.fov, 50)))
    bu.uFocal.value = 1 / Math.tan((camFov * Math.PI) / 360)
    bu.uViewMatrix.value.copy(mainCamera.matrixWorldInverse)
    bu.uWorldScale.value = WORLD_SCALE

    // Behind models: clear to transparent so their alpha masks the sky.
    if (behindCount > 0 && behindTarget) {
      objectRegistry.setModelsVisibleForDepthPass('behind')
      renderer.setRenderTarget(behindTarget)
      renderer.setClearColor(scratch.skyColor, 0)
      renderer.clear(true, true, true)
      renderer.render(mainScene, mainCamera)
      compositeMaterial.uniforms.tBackground.value = behindTarget.texture
      compositeMaterial.uniforms.uHasBackgroundColor.value = 1
    } else {
      compositeMaterial.uniforms.tBackground.value = emptyColorTexture
      compositeMaterial.uniforms.uHasBackgroundColor.value = 0
    }

    compositeMaterial.uniforms.uHasMiddle.value = 0
    if (middleCount > 0 && middleTarget) {
      objectRegistry.setModelsVisibleForDepthPass('middle')
      renderer.setRenderTarget(middleTarget)
      renderer.setClearColor(0x000000, 0)
      renderer.clear(true, true, true)
      renderer.render(mainScene, mainCamera)
      bu.tDepth.value = middleTarget.depthTexture
      bu.uHasSceneDepth.value = 1
      compositeMaterial.uniforms.tMiddle.value = middleTarget.texture
      compositeMaterial.uniforms.uHasMiddle.value = 1
    } else if (middleTarget?.depthTexture) {
      bu.tDepth.value = middleTarget.depthTexture
      bu.uHasSceneDepth.value = 0
    }

    // Pass 1: clouds only, low res.
    if (cloudTarget) {
      bu.uCloudsOnly.value = 1
      renderer.setRenderTarget(cloudTarget)
      renderer.setClearColor(0x000000, 0)
      renderer.clear(true, true, true)
      renderer.render(backgroundScene, backgroundCamera)
      compositeMaterial.uniforms.tClouds.value = cloudTarget.texture
    }

    // Pass 2: full-res sky photo + cloud composite to the canvas.
    renderer.setRenderTarget(null)
    renderer.setClearColor(scratch.skyColor, 1)
    renderer.clear(true, true, true)
    renderer.render(compositeScene, backgroundCamera)

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
    applySkydome,
    getCurrentCamera: () => ({ ...state.currentCamera }),
    getCurrentClouds: () => ({ ...state.clouds }),
    getCurrentLighting: () => ({ ...state.lighting }),
    getSkydome: () => skyDome.getSettings(),
    getSkyDomeManifest: () => skyDome.getManifest(),
    setPlaygroundLock: (locked: boolean) => {
      playgroundLocked = locked
    },
    isPlaygroundLocked: () => playgroundLocked,
    setCameraLock: (locked: boolean) => {
      cameraLocked = locked
    },
    setPageConfig(next) {
      state.config = next
      cameraLocked = false
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
    noteScrollProgress(progress)
    const evaluated = cameraController.evaluateAtProgress(progress)
    if (!cameraLocked) sceneRuntime.applyCamera(applyCameraMotion(evaluated.camera))
    if (!playgroundLocked) {
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
      cameraLocked ? state.currentCamera : evaluated.camera,
      playgroundLocked ? state.clouds : evaluated.clouds,
      objectRegistry,
      state.frame,
      state.fps,
    )
  }

  const scrollDriver = createScrollDriver({
    onProgress: onScrollProgress,
    externalTick: true,
    // Lower = more glide after you stop scrolling.
    smoothing: 3.5,
    continuous: true,
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
      // Backstop for a genuinely stuck transition (must exceed ~1200ms entry lerp).
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
    cloudTarget?.dispose()
    behindTarget?.dispose()
    middleTarget?.dispose()
    envTexture.dispose()
    emptyColorTexture.dispose()
    skyDome.dispose()
    backgroundMaterial.dispose()
    backgroundQuad.geometry.dispose()
    compositeMaterial.dispose()
    compositeQuad.geometry.dispose()
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