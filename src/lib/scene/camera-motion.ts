/**
 * Living camera: slow idle drift + mouse parallax layered on top of the
 * scroll-evaluated pose. Purely additive — anchors stay the source of truth.
 * Disabled for prefers-reduced-motion; parallax off on touch devices.
 */
import type { CameraPose } from './types'

/** Tune here. Units are world units (camera positions in scene configs). */
export const CAMERA_MOTION = {
  /** Idle drift amplitude (side, up). */
  driftX: 0.35,
  driftY: 0.18,
  /** Seconds per drift cycle-ish (lower = faster). */
  driftSpeed: 0.25,
  /** How far the camera slides at the screen edge. */
  parallax: 1.1,
  /** Pointer follow rate (per second). */
  follow: 3,
  /** 0 = target fixed (camera orbits slightly), 1 = target moves with camera. */
  targetFollow: 0.3,
}

let pointerX = 0
let pointerY = 0
let smoothX = 0
let smoothY = 0
let lastT = 0
let listening = false
let reduced = false
let coarse = false

function ensureListeners(): void {
  if (listening || typeof window === 'undefined') return
  listening = true
  const rm = window.matchMedia('(prefers-reduced-motion: reduce)')
  const cp = window.matchMedia('(pointer: coarse)')
  reduced = rm.matches
  coarse = cp.matches
  rm.addEventListener('change', (e) => (reduced = e.matches))
  cp.addEventListener('change', (e) => (coarse = e.matches))
  window.addEventListener(
    'pointermove',
    (e) => {
      pointerX = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1
      pointerY = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1
    },
    { passive: true },
  )
  document.addEventListener('pointerleave', () => {
    pointerX = 0
    pointerY = 0
  })
}

export function applyCameraMotion(cam: CameraPose): CameraPose {
  if (typeof window === 'undefined') return cam
  ensureListeners()
  if (reduced) return cam

  const now = performance.now() / 1000
  const dt = lastT ? Math.min(0.1, now - lastT) : 1 / 60
  lastT = now

  const k = 1 - Math.exp(-CAMERA_MOTION.follow * dt)
  const px = coarse ? 0 : pointerX
  const py = coarse ? 0 : pointerY
  smoothX += (px - smoothX) * k
  smoothY += (py - smoothY) * k

  const [ox, oy, oz] = cam.position
  const [tx, ty, tz] = cam.target
  let fx = tx - ox
  let fz = tz - oz
  const flen = Math.hypot(fx, fz) || 1
  fx /= flen
  fz /= flen
  // Camera right vector on the ground plane: cross(forward, up).
  const rx = -fz
  const rz = fx

  const s = CAMERA_MOTION.driftSpeed
  const side =
    Math.sin(now * s * 0.9) * CAMERA_MOTION.driftX + smoothX * CAMERA_MOTION.parallax
  const up =
    Math.sin(now * s * 1.3 + 1.3) * CAMERA_MOTION.driftY -
    smoothY * CAMERA_MOTION.parallax * 0.5

  const tf = CAMERA_MOTION.targetFollow
  return {
    ...cam,
    position: [ox + rx * side, oy + up, oz + rz * side],
    target: [tx + rx * side * tf, ty + up * tf, tz + rz * side * tf],
  }
}
