// Shared day/night theme resolution — kept in sync with vanta-init.ts sky anchors.

export const THEME_STORAGE_KEY = 'baseet-theme'

export type SiteTheme = 'day' | 'night'

/** Matches vanta-init.ts anchor hours. */
export const ANCHOR_HOUR_NIGHT = 0
export const ANCHOR_HOUR_BRIGHT_SHIFT = 4.5
export const ANCHOR_HOUR_DAY = 14
export const ANCHOR_HOUR_DARK_SHIFT = 20

/** Sky luminance below this → night UI tokens. Tuned to track dusk/dawn clouds. */
const SKY_LUMINANCE_NIGHT_THRESHOLD = 0.42

type RGB = { r: number; g: number; b: number }

const nightTheme: RGB = { r: 10, g: 18, b: 39 }
const dawnTheme: RGB = { r: 243, g: 164, b: 111 }
const dayTheme: RGB = { r: 135, g: 206, b: 235 }
const duskTheme: RGB = { r: 89, g: 105, b: 176 }

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return {
    r: Math.round(lerp(a.r, b.r, t)),
    g: Math.round(lerp(a.g, b.g, t)),
    b: Math.round(lerp(a.b, b.b, t)),
  }
}

function mapRange(value: number, inMin: number, inMax: number): number {
  if (inMax === inMin) return 0
  return (value - inMin) / (inMax - inMin)
}

function getLegacyThemeForHour(hour: number): RGB {
  const clamped = Math.max(0, Math.min(24, hour))

  if (clamped < 6) {
    const t = mapRange(clamped, 0, 6)
    return lerpRGB(nightTheme, dawnTheme, t)
  }
  if (clamped < 12) {
    const t = mapRange(clamped, 6, 12)
    return lerpRGB(dawnTheme, dayTheme, t)
  }
  if (clamped < 18) {
    const t = mapRange(clamped, 12, 18)
    return lerpRGB(dayTheme, duskTheme, t)
  }
  const t = mapRange(clamped, 18, 24)
  return lerpRGB(duskTheme, nightTheme, t)
}

const lockedAnchors = {
  night: getLegacyThemeForHour(ANCHOR_HOUR_NIGHT),
  brightShift: getLegacyThemeForHour(ANCHOR_HOUR_BRIGHT_SHIFT),
  day: getLegacyThemeForHour(ANCHOR_HOUR_DAY),
  darkShift: getLegacyThemeForHour(ANCHOR_HOUR_DARK_SHIFT),
}

export function getSkyColorsForHour(hour: number): { sky: RGB; cloud: RGB; cloudShadow: RGB } {
  const clamped = Math.max(0, Math.min(24, hour))

  if (clamped < ANCHOR_HOUR_BRIGHT_SHIFT) {
    const t = mapRange(clamped, ANCHOR_HOUR_NIGHT, ANCHOR_HOUR_BRIGHT_SHIFT)
    return {
      sky: lerpRGB(lockedAnchors.night, lockedAnchors.brightShift, t),
      cloud: lerpRGB(
        { r: 86, g: 104, b: 135 },
        { r: 255, g: 215, b: 191 },
        t,
      ),
      cloudShadow: lerpRGB(
        { r: 6, g: 12, b: 28 },
        { r: 171, g: 118, b: 135 },
        t,
      ),
    }
  }

  if (clamped < ANCHOR_HOUR_DAY) {
    const t = mapRange(clamped, ANCHOR_HOUR_BRIGHT_SHIFT, ANCHOR_HOUR_DAY)
    return {
      sky: lerpRGB(lockedAnchors.brightShift, lockedAnchors.day, t),
      cloud: lerpRGB({ r: 255, g: 215, b: 191 }, { r: 255, g: 255, b: 255 }, t),
      cloudShadow: lerpRGB({ r: 171, g: 118, b: 135 }, { r: 73, g: 107, b: 193 }, t),
    }
  }

  if (clamped < ANCHOR_HOUR_DARK_SHIFT) {
    const t = mapRange(clamped, ANCHOR_HOUR_DAY, ANCHOR_HOUR_DARK_SHIFT)
    return {
      sky: lerpRGB(lockedAnchors.day, lockedAnchors.darkShift, t),
      cloud: lerpRGB({ r: 255, g: 255, b: 255 }, { r: 213, g: 178, b: 194 }, t),
      cloudShadow: lerpRGB({ r: 73, g: 107, b: 193 }, { r: 78, g: 73, b: 138 }, t),
    }
  }

  const t = mapRange(clamped, ANCHOR_HOUR_DARK_SHIFT, 24)
  return {
    sky: lerpRGB(lockedAnchors.darkShift, lockedAnchors.night, t),
    cloud: lerpRGB({ r: 213, g: 178, b: 194 }, { r: 86, g: 104, b: 135 }, t),
    cloudShadow: lerpRGB({ r: 78, g: 73, b: 138 }, { r: 6, g: 12, b: 28 }, t),
  }
}

function skyLuminance(rgb: RGB): number {
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
}

/** UI theme derived from interpolated sky brightness — tracks cloud appearance. */
export function getUiThemeForHour(hour: number): SiteTheme {
  const { sky } = getSkyColorsForHour(hour)
  return skyLuminance(sky) < SKY_LUMINANCE_NIGHT_THRESHOLD ? 'night' : 'day'
}

export function getHourFromDate(date = new Date()): number {
  return date.getHours() + date.getMinutes() / 60
}

export function readSavedTheme(): SiteTheme | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'day' || saved === 'night') return saved
  } catch {
    /* ignore */
  }
  return null
}

export function resolveInitialTheme(date = new Date()): SiteTheme {
  const saved = readSavedTheme()
  if (saved) return saved
  return getUiThemeForHour(getHourFromDate(date))
}

export function applyTheme(theme: SiteTheme): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}
