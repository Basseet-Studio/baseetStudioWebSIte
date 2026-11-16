/**
 * Living camera, layered on top of the scroll-evaluated pose. Purely
 * additive — anchors stay the source of truth.
 *
 *  1. Idle drift            slow float so the frame is never dead still
 *  2. Pointer parallax      desktop only (off on touch)
 *  3. Scroll momentum       scrolling fast pushes the FOV out a little and
 *                           dips the nose in the scroll direction, then it
 *                           eases back when you stop — feels like flying
 *  5. Floor                 the camera never drops below CAMERA_FLOOR
 *                           (stays above the mid cloud deck)
 *  4. Portrait framing      on phones the landmark is pulled back toward
 *                           the centre (the desktop "landmark right of the
 *                           text" offset pushes it off-screen on portrait)
 *
 * Disabled for prefers-reduced-motion (portrait framing still applies).
 */
import type { CameraPose } from './types'
import { CAMERA_FLOOR, ORBIT_CENTER } from '../../content/data/scenes/world'
import { landmarkCountry } from './landmark'

/** Tune here. Units are world units (camera positions in scene configs). */
export const CAMERA_MOTION = {
  /** Idle drift amplitude (side, up). */
  driftX: 0.45,
  driftY: 0.25,
  /** Lower = slower drift. */
  driftSpeed: 0.22,
  /** How far the camera slides at the screen edge. */
  parallax: 1.1,
  /** Pointer follow rate (per second). */
  follow: 3,
  /** 0 = target fixed (camera orbits slightly), 1 = target moves with camera. */
  targetFollow: 0.3,
  /** Max extra FOV (deg) while scrolling fast. */
  speedFov: 5,
  /** Max nose dip / lift (world units on the look target) while scrolling. */
  speedPitch: 2.2,
  /** Scroll speed (progress per second) that counts as "full speed". */
  speedRef: 0.35,
  /** How fast the momentum effect builds / releases (per second). */
  speedFollow: 2.5,
  /** Portrait: 0 = keep desktop framing, 1 = landmark dead centre. */
  portraitRecentre: 1,
}

let pointerX = 0
let pointerY = 0
let smoothX = 0
let smoothY = 0
let lastT = 0
let listening = false
let reduced = false
let coarse = false

let lastProgress = -1
let lastProgressT = 0
let rawVelocity = 0
let smoothVelocity = 0

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

/** Runtime calls this every scroll tick (smoothed progress 0..1). */
export function noteScrollProgress(progress: number): void {
  const now = performance.now() / 1000
  if (lastProgress >= 0) {
    const dt = Math.max(1 / 240, Math.min(0.1, now - lastProgressT))
    rawVelocity = (progress - lastProgress) / dt
  }
  lastProgress = progress
  lastProgressT = now
}

/** Page swaps jump progress — forget the old velocity. */
export function resetScrollMomentum(): void {
  lastProgress = -1
  rawVelocity = 0
  smoothVelocity = 0
}

function portraitAmount(): number {
  if (typeof window === 'undefined') return 0
  const aspect = window.innerWidth / Math.max(1, window.innerHeight)
  // 1.0 (square) -> 0, 0.55 (phone) -> 1
  const x = Math.min(1, Math.max(0, (1 - aspect) / 0.45))
  return x * CAMERA_MOTION.portraitRecentre
}

/** Hard floor: never below the mid cloud deck. */
export function clampCameraFloor(cam: CameraPose): CameraPose {
  if (cam.position[1] >= CAMERA_FLOOR) return cam
  const lift = CAMERA_FLOOR - cam.position[1]
  return {
    ...cam,
    position: [cam.position[0], CAMERA_FLOOR, cam.position[2]],
    target: [cam.target[0], cam.target[1] + lift, cam.target[2]],
  }
}

/** Portrait recentre + floor — also used during page flights. */
export function applyViewportFraming(input: CameraPose): CameraPose {
  const cam = clampCameraFloor(input)
  if (typeof window === 'undefined') return cam
  const mobile = window.innerWidth <= 768
  const malaysia = landmarkCountry() === 'MY'
  const factor = malaysia ? 0.78 : 1
  const position: CameraPose['position'] = [
    ORBIT_CENTER[0] + (cam.position[0] - ORBIT_CENTER[0]) * factor,
    cam.position[1],
    ORBIT_CENTER[2] + (cam.position[2] - ORBIT_CENTER[2]) * factor,
  ]
  return {
    ...cam,
    position,
    target: [mobile ? ORBIT_CENTER[0] : cam.target[0],
      malaysia ? 18 : cam.target[1],
      mobile ? ORBIT_CENTER[2] : cam.target[2]],
    fov: mobile ? Math.min(66, cam.fov + 4) : cam.fov,
  }
}

export function applyCameraMotion(input: CameraPose): CameraPose {
  if (typeof window === 'undefined') return input
  ensureListeners()
  const cam = applyViewportFraming(input)
  if (reduced) return cam

  const now = performance.now() / 1000
  const dt = lastT ? Math.min(0.1, now - lastT) : 1 / 60
  lastT = now

  const k = 1 - Math.exp(-CAMERA_MOTION.follow * dt)
  const px = coarse ? 0 : pointerX
  const py = coarse ? 0 : pointerY
  smoothX += (px - smoothX) * k
  smoothY += (py - smoothY) * k

  // Momentum: velocity eases in/out so it never twitches.
  if (now - lastProgressT > 0.15) rawVelocity = 0
  const kv = 1 - Math.exp(-CAMERA_MOTION.speedFollow * dt)
  smoothVelocity += (rawVelocity - smoothVelocity) * kv
  const v = Math.max(-1, Math.min(1, smoothVelocity / CAMERA_MOTION.speedRef))
  const speed = Math.abs(v)
  const ease = speed * speed * (3 - 2 * speed)

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

  // Scrolling down (v > 0) dips the nose, scrolling up lifts it.
  const pitch = -Math.sign(v) * ease * CAMERA_MOTION.speedPitch * (coarse ? 0.25 : 1)

  const tf = CAMERA_MOTION.targetFollow
  return clampCameraFloor({
    ...cam,
    position: [ox + rx * side, oy + up, oz + rz * side],
    target: [tx + rx * side * tf, ty + up * tf + pitch, tz + rz * side * tf],
    fov: cam.fov + ease * CAMERA_MOTION.speedFov,
  })
}
