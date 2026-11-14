import { EASING, lerpCamera } from './camera-controller'
import type { CameraController } from './camera-controller'
import type { CameraPose, SceneConfig } from './types'
import type { ObjectRegistry } from './object-registry'
import type { ScrollDriver } from './scroll-driver'
import { ORBIT_CENTER } from '../../content/data/scenes/world'
import { applyViewportFraming, resetScrollMomentum } from './camera-motion'

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
      resetScrollMomentum()

      const transition = nextConfig.transition?.entry
      const exitState = readExitState()

      if (transition) {
        const fromCam =
          transition.from === 'exit-camera' && exitState?.camera
            ? exitState.camera
            : exitState?.camera || deps.cameraController.getEntryCamera()
        const toCam = applyViewportFraming(
          transition.camera || deps.cameraController.getEntryCamera(),
        )
        const duration = flightDuration(fromCam, toCam, transition.durationMs || 1000)
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

/**
 * Page-to-page flight — a "swoop" around the landmark:
 *  - orbits AROUND it (polar interpolation, shortest way round)
 *  - pulls back and climbs mid-flight (long trips rise above the top carpet)
 *  - the look target swings onto the landmark mid-flight so it's centred
 *    while you travel, then settles back to the page's side framing
 *  - small FOV breath for a sense of speed
 */
const FLIGHT_ARC_MIN = 3
const FLIGHT_ARC_MAX = 16
/** Peak altitude for long flights (above the high carpet ~12.5..17.5). */
const FLIGHT_CEILING = 21
/** Extra distance at mid-flight, as a fraction of the radius. */
const FLIGHT_PULLBACK = 0.22
/** 0..1 how much the look target swings onto the landmark mid-flight. */
const FLIGHT_RECENTRE = 0.75
/** Extra FOV at mid-flight (deg). */
const FLIGHT_FOV = 7

function polarOf(p: [number, number, number]): { a: number; r: number } {
  const dx = p[0] - ORBIT_CENTER[0]
  const dz = p[2] - ORBIT_CENTER[2]
  return { a: Math.atan2(dx, dz), r: Math.hypot(dx, dz) }
}

function angleDelta(a: CameraPose, b: CameraPose): number {
  let d = polarOf(b.position).a - polarOf(a.position).a
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return d
}

/** Longer trips around the circle take longer (2.2s – 4.4s). */
function flightDuration(a: CameraPose, b: CameraPose, base: number): number {
  const deg = Math.abs(angleDelta(a, b)) * (180 / Math.PI)
  return Math.min(4400, Math.max(2200, base, 1800 + deg * 13))
}

function flightCamera(a: CameraPose, b: CameraPose, t: number): CameraPose {
  const pa = polarOf(a.position)
  const pb = polarOf(b.position)
  const da = angleDelta(a, b)
  const ang = pa.a + da * t
  const bump = Math.sin(Math.PI * t)
  const arcLen = Math.abs(da) * ((pa.r + pb.r) / 2)
  // 0 for a short hop, 1 for a long trip around the circle.
  const reach = Math.min(1, arcLen / 90)
  const r = (pa.r + (pb.r - pa.r) * t) * (1 + FLIGHT_PULLBACK * reach * bump)
  const lerp = (x: number, y: number) => x + (y - x) * t

  const baseY = lerp(a.position[1], b.position[1])
  const lift = Math.min(FLIGHT_ARC_MAX, Math.max(FLIGHT_ARC_MIN, arcLen * 0.12))
  // Long trips aim for the ceiling; short hops just arc a little.
  const peak = Math.max(baseY + lift, FLIGHT_CEILING * reach + baseY * (1 - reach))
  const y = baseY + (peak - baseY) * bump

  const tyBase = lerp(a.target[1], b.target[1])
  const recentre = FLIGHT_RECENTRE * bump
  const tx = lerp(a.target[0], b.target[0])
  const tz = lerp(a.target[2], b.target[2])
  return {
    position: [ORBIT_CENTER[0] + Math.sin(ang) * r, y, ORBIT_CENTER[2] + Math.cos(ang) * r],
    target: [
      tx + (ORBIT_CENTER[0] - tx) * recentre,
      tyBase + (y - baseY) * 0.45,
      tz + (ORBIT_CENTER[2] - tz) * recentre,
    ],
    fov: lerp(a.fov, b.fov) + FLIGHT_FOV * bump,
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
      sceneRuntime.applyCamera(flightCamera(fromCam, toCam, t))
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
