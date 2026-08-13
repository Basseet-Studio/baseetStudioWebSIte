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
  forceEndTransition: () => void
}

export function createPageTransitionBridge(deps: {
  sceneRuntime: SceneRuntimeApi
  cameraController: CameraController
  scrollDriver: ScrollDriver
  objectRegistry: Pick<ObjectRegistry, 'unloadWhere' | 'queuePreload'>
}): PageTransitionBridge {
  let isTransitioning = false
  let navGeneration = 0
  let activeLerpCancel: (() => void) | null = null
  // True while the entry lerp for the current navigation is already running.
  // Guards against the page-load re-call restarting the lerp from the exit
  // camera (which would visibly snap "from the beginning").
  let transitionStarted = false

  function cancelActiveLerp(): void {
    if (activeLerpCancel) {
      activeLerpCancel()
      activeLerpCancel = null
    }
  }

  async function onAfterSwap(nextConfig: SceneConfig): Promise<void> {
    const generation = navGeneration
    // If the entry lerp for this navigation is already running (started by
    // the astro:after-swap path), let it finish — do not cancel and restart
    // from the exit camera. The page-load re-call becomes a safe no-op.
    if (transitionStarted) return
    transitionStarted = true

    cancelActiveLerp()

    try {
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
        const lerp = runCameraLerp(
          deps.sceneRuntime,
          fromCam,
          toCam,
          duration,
          easing,
          () => generation === navGeneration,
        )
        activeLerpCancel = lerp.cancel
        await lerp.promise
        activeLerpCancel = null
      }

      if (generation !== navGeneration) return

      deps.objectRegistry.queuePreload(nextConfig.objects)
      deps.scrollDriver.tick({ force: true, source: 'after-swap' })
    } finally {
      if (generation === navGeneration) {
        isTransitioning = false
        transitionStarted = false
      }
    }
  }

  return {
    onBeforeSwap(ctx) {
      navGeneration += 1
      cancelActiveLerp()
      isTransitioning = true
      transitionStarted = false
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
    forceEndTransition() {
      navGeneration += 1
      cancelActiveLerp()
      isTransitioning = false
      transitionStarted = false
    },
  }
}

function runCameraLerp(
  sceneRuntime: SceneRuntimeApi,
  fromCam: CameraPose,
  toCam: CameraPose,
  durationMs: number,
  easeFn: (t: number) => number,
  isActive: () => boolean,
): { promise: Promise<void>; cancel: () => void } {
  const t0 = performance.now()
  let rafId: number | null = null
  let settled = false

  let resolvePromise: (() => void) | null = null

  function finish(): void {
    if (settled) return
    settled = true
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    resolvePromise?.()
    resolvePromise = null
  }

  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve

    function frame(now: number): void {
      if (!isActive()) {
        finish()
        return
      }

      const t = easeFn(Math.min((now - t0) / durationMs, 1))
      sceneRuntime.applyCamera(lerpCamera(fromCam, toCam, t))
      sceneRuntime.renderFrame()

      if (t < 1) {
        rafId = requestAnimationFrame(frame)
      } else {
        finish()
      }
    }

    rafId = requestAnimationFrame(frame)
  })

  return {
    promise,
    cancel: () => {
      finish()
    },
  }
}
