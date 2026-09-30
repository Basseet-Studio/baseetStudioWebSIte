/**
 * Hour wrap, adjacent-variant blend, and lighting math for the skydome.
 * No Three.js or DOM dependency — importable from node tests.
 */

export interface SkyDomeVariant {
  id: string
  hour: number
  source?: string
  placeholder: string
  medium?: string
  full: string
}

export interface SkyDomeBlend {
  a: SkyDomeVariant
  b: SkyDomeVariant
  t: number
}

export function wrapHour(hour: number): number {
  if (!Number.isFinite(hour)) return 0
  const h = hour % 24
  return h < 0 ? h + 24 : h
}

export function blendForHour(variants: SkyDomeVariant[], hour: number): SkyDomeBlend | null {
  if (!variants.length) return null
  if (variants.length === 1) {
    return { a: variants[0], b: variants[0], t: 0 }
  }

  const sorted = [...variants].sort((x, y) => x.hour - y.hour)
  const h = wrapHour(hour)

  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i]
    const b = sorted[(i + 1) % sorted.length]
    const start = a.hour
    let end = b.hour
    let x = h
    if (end <= start) {
      end += 24
      if (x < start) x += 24
    }
    if (x >= start && x < end) {
      const span = end - start
      const t = span <= 1e-6 ? 0 : Math.min(1, (x - start) / span)
      return { a, b, t }
    }
  }

  return { a: sorted[sorted.length - 1], b: sorted[0], t: 0 }
}

/** Lighting facts extracted from one equirect sky photo (texture space, yaw 0). */
export interface SkyLightingSample {
  /** Unit direction toward the brightest sky region (sun / moon). */
  sunDir: [number, number, number]
  sunColor: [number, number, number]
  zenith: [number, number, number]
  horizon: [number, number, number]
  /** 0–1 contrast of the sun region against the mean sky — 0 for flat overcast. */
  sunStrength: number
}

/**
 * Inverse of the shader's equirectUv(): u/v (0–1) → unit direction.
 * Matches `atan(d.z, d.x) * 0.15915 + 0.5` / `asin(d.y) * 0.31831 + 0.5`.
 */
export function equirectUvToDirection(u: number, v: number): [number, number, number] {
  const theta = (u - 0.5) * Math.PI * 2
  const phi = (v - 0.5) * Math.PI
  const cosPhi = Math.cos(phi)
  return [cosPhi * Math.cos(theta), Math.sin(phi), cosPhi * Math.sin(theta)]
}

/** Forward mapping — direction → equirect u/v, mirrors the GLSL equirectUv(). */
export function directionToEquirectUv(
  d: readonly [number, number, number],
): { u: number; v: number } {
  const len = Math.hypot(d[0], d[1], d[2]) || 1
  const y = Math.max(-1, Math.min(1, d[1] / len))
  return {
    u: Math.atan2(d[2] / len, d[0] / len) / (Math.PI * 2) + 0.5,
    v: Math.asin(y) / Math.PI + 0.5,
  }
}

/**
 * Rotate a texture-space direction into world space for uSkyYaw (radians).
 * Inverse of the shader's yaw rotation
 * `d = vec3(rd.x*cy - rd.z*sy, rd.y, rd.x*sy + rd.z*cy)`.
 */
export function worldDirFromTexDir(
  d: readonly [number, number, number],
  yawRad: number,
): [number, number, number] {
  const c = Math.cos(yawRad)
  const s = Math.sin(yawRad)
  return [d[0] * c + d[2] * s, d[1], -d[0] * s + d[2] * c]
}

function lerp3(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

/** Blend two lighting samples (used while two sky photos cross-fade at an hour). */
export function blendSkyLighting(a: SkyLightingSample, b: SkyLightingSample, t: number): SkyLightingSample {
  if (a === b) return a
  const k = Math.max(0, Math.min(1, t))
  const sunDir = lerp3(a.sunDir, b.sunDir, k)
  const len = Math.hypot(sunDir[0], sunDir[1], sunDir[2]) || 1
  return {
    sunDir: [sunDir[0] / len, sunDir[1] / len, sunDir[2] / len],
    sunColor: lerp3(a.sunColor, b.sunColor, k),
    zenith: lerp3(a.zenith, b.zenith, k),
    horizon: lerp3(a.horizon, b.horizon, k),
    sunStrength: a.sunStrength + (b.sunStrength - a.sunStrength) * k,
  }
}
