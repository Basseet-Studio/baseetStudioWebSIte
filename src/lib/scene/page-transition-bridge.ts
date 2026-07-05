import { EASING, lerpCamera } from './camera-controller'
import type { CameraController } from './camera-controller'
import type { CameraPose, SceneConfig } from './types'
import type { ObjectRegistry } from './object-registry'
import type { ScrollDriver } from './scroll-driver'

const EXIT_KEY = 'baseet:scene:exit'

export interface ExitState {
  path: string
  camera: CameraPose
  progress?: number
  timestamp: number
}

export function readExitState(): ExitState | null {
  try {
    const raw = sessionStorage.getItem(EXIT_KEY)
    return raw ? (JSON.parse(raw) as ExitState) : null
  } catch {
    return null
  }
}

function writeExitState(payload: ExitState): void {
  try {
    sessionStorage.setItem(EXIT_KEY, JSON.stringify(payload))
  } catch {
    /* quota */
  }
}

export interface SceneRuntimeApi {
  applyCamera: (cam: CameraPose) => void
  setPageConfig: (config: SceneConfig) => void
  getCurrentCamera: () => CameraPose
  renderFrame: () => void
}

export interface PageTransitionBridge {
  onBeforeSwap: (ctx: {
    exitCamera?: CameraPose
    exitProgress?: number
  }) => void
  onAfterSwap: (nextConfig: SceneConfig) => Promise<void>
  onPageLoad: () => void
  getIsTransitioning: () => boolean
}

export function createPageTransitionBridge(deps: {
  sceneRuntime: SceneRuntimeApi
  cameraController: CameraController
  scrollDriver: ScrollDriver
  objectRegistry: Pick<ObjectRegistry, 'unloadWhere' | 'queuePreload'>
}): PageTransitionBridge {
  let isTransitioning = false

  async function onAfterSwap(nextConfig: SceneConfig): Promise<void> {
    deps.sceneRuntime.setPageConfig(nextConfig)
    deps.scrollDriver.reset()

    const transition = nextConfig.transition?.entry
    const exitState = readExitState()

    if (transition) {
      const fromCam =
        transition.from === 'exit-camera' && exitState?.camera
          ? exitState.camera
          : exitState?.camera || deps.cameraController.getEntryCamera()
      const toCam = transition.camera || deps.cameraController.getEntryCamera()
      const duration = transition.durationMs || 1000
      const easing = EASING[transition.easing || 'easeInOutCubic'] || EASING.easeInOutCubic
      await runCameraLerp(deps.sceneRuntime, fromCam, toCam, duration, easing)
    }

    deps.objectRegistry.queuePreload(nextConfig.objects)
    isTransitioning = false
    deps.scrollDriver.tick({ force: true, source: 'after-swap' })
  }

  return {
    onBeforeSwap(ctx) {
      isTransitioning = true
      writeExitState({
        path: location.pathname,
        camera: ctx.exitCamera || deps.sceneRuntime.getCurrentCamera(),
        progress: ctx.exitProgress,
        timestamp: Date.now(),
      })
      deps.objectRegistry.unloadWhere((obj) => obj.scope === 'page')
    },
    onAfterSwap,
    onPageLoad() {
      requestAnimationFrame(() => {
        if (!isTransitioning) {
          deps.scrollDriver.tick({ force: true, source: 'page-load' })
        }
      })
    },
    getIsTransitioning: () => isTransitioning,
  }
}

function runCameraLerp(
  sceneRuntime: SceneRuntimeApi,
  fromCam: CameraPose,
  toCam: CameraPose,
  durationMs: number,
  easeFn: (t: number) => number,
): Promise<void> {
  const t0 = performance.now()
  return new Promise((resolve) => {
    function frame(now: number) {
      const t = easeFn(Math.min((now - t0) / durationMs, 1))
      sceneRuntime.applyCamera(lerpCamera(fromCam, toCam, t))
      sceneRuntime.renderFrame()
      if (t < 1) {
        requestAnimationFrame(frame)
      } else {
        resolve()
      }
    }
    requestAnimationFrame(frame)
  })
}
