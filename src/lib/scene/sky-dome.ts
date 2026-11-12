/**
 * Equirect skydome — textures only, no IBL / scene.environment.
 * Placeholders load first; full-res cross-fades in. Adjacent variants
 * blend across the 0–24 hour used by sky-theme. Placeholders are also
 * analysed once per image so the scene can light clouds, models and fog
 * from the sky actually on screen.
 */
import * as THREE from 'three'
import { sceneLog, sceneWarn } from './scene-debug'
import {
  blendForHour,
  blendSkyLighting,
  equirectUvToDirection,
  worldDirFromTexDir,
  type SkyDomeBlend,
  type SkyDomeVariant,
  type SkyLightingSample,
} from './sky-dome-blend'

export { blendForHour, wrapHour } from './sky-dome-blend'
export type { SkyDomeBlend, SkyDomeVariant, SkyLightingSample } from './sky-dome-blend'

export const SKY_DOME_MANIFEST_URL = '/images/skyscapes/manifest.json'
const FULL_FADE_SECONDS = 0.4
const SUN_PIXEL_RATIO = 0.82

/** Default photo-vs-colour balance: 0 = your Sky colour only, 1 = photo only. */
export const DEFAULT_SKY_MIX = 0.55

export interface SkyDomeLibraryItem {
  id: string
  label: string
  source?: string
  placeholder: string
  medium?: string
  full: string
}

export interface SkyDomeManifest {
  variants: SkyDomeVariant[]
  library?: SkyDomeLibraryItem[]
}

export interface SkyDomeSettings {
  enabled: boolean
  yawDeg: number
  mix: number
  pinId: string
  slotSources: Record<string, string>
  /** 0 = keep the mirrored lower hemisphere, 1 = full cloud-sea floor. */
  floor: number
  /** Blend scene sun direction / colors from the sky photo. */
  sunFromSky: boolean
}

export interface SkyDomeLighting {
  sunDir: [number, number, number]
  sunColor: [number, number, number]
  zenith: [number, number, number]
  horizon: [number, number, number]
  sunStrength: number
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function configureSkyTexture(texture: THREE.Texture): void {
  // No mipmaps: equirect atan() coordinates break mip selection at the u
  // seam, and the panorama is magnified on screen anyway.
  texture.colorSpace = THREE.NoColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
}

export interface SkyDomeController {
  applySettings: (partial: Partial<SkyDomeSettings>) => void
  getSettings: () => SkyDomeSettings
  getManifest: () => SkyDomeManifest | null
  /** Blended lighting facts for the current A/B sky pair, world-space sun. */
  getLighting: () => SkyDomeLighting | null
  tick: (hour: number, dt: number) => void
  dispose: () => void
}

/**
 * Analyse a loaded placeholder (128x64 equirect JPG) on a canvas:
 * sun direction from the brightest sky region, zenith / horizon /
 * sun colors, and a 0–1 sun contrast strength.
 *
 * Canvas row 0 is the TOP of the image, while the shader's equirect v = 1 is
 * the top (textures are flipY'd). Sun v is converted with `1 - row / h` so a
 * sun high in the photo maps to a direction ABOVE the horizon.
 */
function analyzeSkyImage(image: unknown): SkyLightingSample | null {
  if (typeof document === 'undefined') return null
  const img = image as { width?: number; height?: number } | null
  if (!img || !(img.width! > 0) || !(img.height! > 0)) return null

  const w = 128
  const h = 64
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  try {
    ctx.drawImage(image as CanvasImageSource, 0, 0, w, h)
  } catch {
    return null
  }
  let data: Uint8ClampedArray
  try {
    data = ctx.getImageData(0, 0, w, h).data
  } catch {
    return null
  }

  const lumAt = (x: number, y: number): number => {
    const i = (y * w + x) * 4
    return (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255
  }
  const rgbAt = (x: number, y: number): [number, number, number] => {
    const i = (y * w + x) * 4
    return [data[i] / 255, data[i + 1] / 255, data[i + 2] / 255]
  }

  let maxLum = 0
  let lumSum = 0
  let lumCount = 0
  for (let y = 0; y < h / 2; y++) {
    for (let x = 0; x < w; x++) {
      const l = lumAt(x, y)
      lumSum += l
      lumCount++
      if (l > maxLum) maxLum = l
    }
  }
  const meanLum = lumCount ? lumSum / lumCount : 0

  // Centroid of the bright (sun / moon) region above the horizon.
  const bright = maxLum * SUN_PIXEL_RATIO
  let sx = 0
  let sy = 0
  let sw = 0
  for (let y = 0; y < h / 2; y++) {
    for (let x = 0; x < w; x++) {
      const l = lumAt(x, y)
      if (l < bright) continue
      sx += x * l
      sy += y * l
      sw += l
    }
  }
  let sunU: number
  let sunV: number
  if (sw > 0) {
    sunU = sx / sw / w
    sunV = 1 - sy / sw / h
  } else {
    sunU = 0.5
    sunV = 0.75
  }

  // Sun color: average of the bright region.
  let sr = 0
  let sg = 0
  let sb = 0
  let sc = 0
  for (let y = 0; y < h / 2; y++) {
    for (let x = 0; x < w; x++) {
      if (lumAt(x, y) < bright) continue
      const [r, g, b] = rgbAt(x, y)
      sr += r
      sg += g
      sb += b
      sc++
    }
  }
  const sunColor: [number, number, number] = sc ? [sr / sc, sg / sc, sb / sc] : [1, 1, 1]

  // Zenith: top fifth of the image.
  let zr = 0
  let zg = 0
  let zb = 0
  let zc = 0
  const zLimit = Math.floor(h * 0.2)
  for (let y = 0; y < zLimit; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = rgbAt(x, y)
      zr += r
      zg += g
      zb += b
      zc++
    }
  }
  const zenith: [number, number, number] = zc ? [zr / zc, zg / zc, zb / zc] : [0.5, 0.7, 1]

  // Horizon: band just above the mirror line (v ~ 0.42–0.5).
  let hr = 0
  let hg = 0
  let hb = 0
  let hc = 0
  for (let y = Math.floor(h * 0.42); y < h / 2; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = rgbAt(x, y)
      hr += r
      hg += g
      hb += b
      hc++
    }
  }
  const horizon: [number, number, number] = hc ? [hr / hc, hg / hc, hb / hc] : zenith

  // Sun contrast: how much brighter the sun region is than the mean sky.
  const sunStrength = Math.max(
    0,
    Math.min(1, (maxLum - meanLum) / Math.max(0.15, 1 - meanLum)),
  )

  return {
    sunDir: equirectUvToDirection(sunU, sunV),
    sunColor,
    zenith,
    horizon,
    sunStrength,
  }
}

export function createSkyDomeController(
  uniforms: {
    tSkyALo: { value: THREE.Texture | null }
    tSkyAHi: { value: THREE.Texture | null }
    tSkyBLo: { value: THREE.Texture | null }
    tSkyBHi: { value: THREE.Texture | null }
    uSkyFullMixA: { value: number }
    uSkyFullMixB: { value: number }
    uSkyBlend: { value: number }
    uSkyYaw: { value: number }
    uSkyMix: { value: number }
    uSkyFloor: { value: number }
  },
  opts?: { tier?: 'low' | 'medium' | 'high' },
): SkyDomeController {
  const tier = opts?.tier ?? 'high'
  const loader = new THREE.TextureLoader()
  const cache = new Map<string, THREE.Texture>()
  const loading = new Set<string>()
  const fullReady = new Set<string>()
  const analysis = new Map<string, SkyLightingSample>()

  const empty = new THREE.DataTexture(new Uint8Array([110, 168, 220, 255]), 1, 1)
  empty.needsUpdate = true
  configureSkyTexture(empty)

  uniforms.tSkyALo.value = empty
  uniforms.tSkyAHi.value = empty
  uniforms.tSkyBLo.value = empty
  uniforms.tSkyBHi.value = empty

  let manifest: SkyDomeManifest | null = null
  const settings: SkyDomeSettings = {
    enabled: true,
    yawDeg: 0,
    mix: DEFAULT_SKY_MIX,
    pinId: '',
    slotSources: {},
    floor: 1,
    sunFromSky: true,
  }

  let mixA = 0
  let mixB = 0
  let lastAFull = ''
  let lastBFull = ''
  let lastBlend: SkyDomeBlend | null = null

  function loadTexture(url: string, isPlaceholder: boolean): THREE.Texture {
    const hit = cache.get(url)
    if (hit) return hit
    if (loading.has(url)) return empty
    loading.add(url)
    const texture = loader.load(
      url,
      (tex) => {
        configureSkyTexture(tex)
        if (isPlaceholder) {
          const sample = analyzeSkyImage(tex.image)
          if (sample) {
            analysis.set(url, sample)
            sceneLog('skydome', `analysed ${url}`)
          } else {
            sceneWarn('skydome', `analysis skipped ${url}`)
          }
        } else {
          fullReady.add(url)
        }
        sceneLog('skydome', `loaded ${isPlaceholder ? 'lo' : 'hi'} ${url}`)
      },
      undefined,
      () => {
        sceneWarn('skydome', `failed ${url}`)
        loading.delete(url)
      },
    )
    configureSkyTexture(texture)
    cache.set(url, texture)
    return texture
  }

  function resolveVariants(): SkyDomeVariant[] {
    if (!manifest) return []
    const library = manifest.library ?? []
    return manifest.variants.map((variant) => {
      const libId = settings.slotSources[variant.id]
      if (!libId) return variant
      const lib = library.find((item) => item.id === libId)
      if (!lib) return variant
      return {
        ...variant,
        placeholder: lib.placeholder,
        // Library items may ship one asset — use it for both resolutions.
        medium: lib.medium ?? lib.full,
        full: lib.full,
        source: lib.source,
      }
    })
  }

  function hiUrlFor(variant: SkyDomeVariant): string {
    if (tier === 'high') return variant.full
    return variant.medium ?? variant.full
  }

  function bindSlot(
    variant: SkyDomeVariant,
    loUniform: { value: THREE.Texture | null },
    hiUniform: { value: THREE.Texture | null },
  ): boolean {
    loUniform.value = loadTexture(variant.placeholder, true)
    const url = hiUrlFor(variant)
    const hi = loadTexture(url, false)
    hiUniform.value = fullReady.has(url) ? hi : empty
    return fullReady.has(url)
  }

  function tick(hour: number, dt: number): void {
    const mix = settings.enabled ? Math.max(0, Math.min(1, settings.mix)) : 0
    uniforms.uSkyMix.value = mix
    uniforms.uSkyYaw.value = (settings.yawDeg * Math.PI) / 180
    uniforms.uSkyFloor.value = Math.max(0, Math.min(1, settings.floor))

    const variants = resolveVariants()
    if (!variants.length || mix <= 0) {
      lastBlend = null
      uniforms.uSkyBlend.value = 0
      uniforms.uSkyFullMixA.value = 0
      uniforms.uSkyFullMixB.value = 0
      return
    }

    const pinned = settings.pinId
      ? variants.find((v) => v.id === settings.pinId)
      : undefined
    const blend = pinned ? { a: pinned, b: pinned, t: 0 } : blendForHour(variants, hour)
    if (!blend) return
    lastBlend = blend

    const aReady = bindSlot(blend.a, uniforms.tSkyALo, uniforms.tSkyAHi)
    const bReady = bindSlot(blend.b, uniforms.tSkyBLo, uniforms.tSkyBHi)
    uniforms.uSkyBlend.value = blend.t

    const aFull = hiUrlFor(blend.a)
    const bFull = hiUrlFor(blend.b)
    if (aFull !== lastAFull) {
      mixA = aReady && prefersReducedMotion() ? 1 : 0
      lastAFull = aFull
    }
    if (bFull !== lastBFull) {
      mixB = bReady && prefersReducedMotion() ? 1 : 0
      lastBFull = bFull
    }

    const snap = prefersReducedMotion()
    const dtClamped = Math.min(0.1, Math.max(0, dt))
    const step = snap ? 1 : dtClamped / FULL_FADE_SECONDS
    mixA = aReady ? Math.min(1, mixA + step) : 0
    mixB = bReady ? Math.min(1, mixB + step) : 0
    uniforms.uSkyFullMixA.value = mixA
    uniforms.uSkyFullMixB.value = mixB
  }

  function getLighting(): SkyDomeLighting | null {
    const blend = lastBlend
    if (!blend) return null
    const a = analysis.get(blend.a.placeholder)
    if (!a) return null
    const b = analysis.get(blend.b.placeholder) ?? a
    const sample = blendSkyLighting(a, b, blend.t)
    const yaw = (settings.yawDeg * Math.PI) / 180
    return {
      sunDir: worldDirFromTexDir(sample.sunDir, yaw),
      sunColor: sample.sunColor,
      zenith: sample.zenith,
      horizon: sample.horizon,
      sunStrength: sample.sunStrength,
    }
  }

  void fetch(SKY_DOME_MANIFEST_URL)
    .then((res) => {
      if (!res.ok) throw new Error(String(res.status))
      return res.json() as Promise<SkyDomeManifest>
    })
    .then((data) => {
      if (!Array.isArray(data.variants) || !data.variants.length) {
        throw new Error('empty variants')
      }
      manifest = data
      for (const variant of data.variants) {
        loadTexture(variant.placeholder, true)
      }
      sceneLog('skydome', `manifest ${data.variants.length} variants`)
    })
    .catch((err) => {
      sceneWarn('skydome', `manifest failed: ${String(err)}`)
      settings.enabled = false
    })

  return {
    applySettings(partial) {
      if (typeof partial.enabled === 'boolean') settings.enabled = partial.enabled
      if (typeof partial.yawDeg === 'number') settings.yawDeg = partial.yawDeg
      if (typeof partial.mix === 'number') settings.mix = partial.mix
      if (typeof partial.pinId === 'string') settings.pinId = partial.pinId
      if (typeof partial.floor === 'number') settings.floor = partial.floor
      if (typeof partial.sunFromSky === 'boolean') settings.sunFromSky = partial.sunFromSky
      if (partial.slotSources) {
        settings.slotSources = { ...settings.slotSources, ...partial.slotSources }
      }
    },
    getSettings() {
      return {
        ...settings,
        slotSources: { ...settings.slotSources },
      }
    },
    getManifest() {
      return manifest
    },
    getLighting,
    tick,
    dispose() {
      for (const tex of cache.values()) tex.dispose()
      cache.clear()
      empty.dispose()
      uniforms.tSkyALo.value = null
      uniforms.tSkyAHi.value = null
      uniforms.tSkyBLo.value = null
      uniforms.tSkyBHi.value = null
    },
  }
}
