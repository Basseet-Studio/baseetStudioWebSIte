// Shared day/night theme resolution — used by sky-theme.ts and theme-boot.js.
//
// TIME-OF-DAY ANCHORS (local clock, 0–24):
//   ANCHOR_HOUR_NIGHT    0   — deep night
//   ANCHOR_HOUR_DAWN     4.5 — pre-sunrise / dawn
//   ANCHOR_HOUR_MORNING  8   — morning sun
//   ANCHOR_HOUR_DAY      14  — midday
//   ANCHOR_HOUR_EVENING  19  — golden hour / sunset
//   ANCHOR_HOUR_DUSK     21  — civil twilight
//
// Manual theme toggle uses ANCHOR_HOUR_NIGHT_UI (dusk) so dark mode stays
// night-like but clouds remain visible. Edit RGB anchors below to tune.

export const THEME_STORAGE_KEY = 'baseet-theme'

export type SiteTheme = 'day' | 'night'

/** Deep night (midnight). */
export const ANCHOR_HOUR_NIGHT = 0
/** Pre-sunrise / dawn. */
export const ANCHOR_HOUR_DAWN = 4.5
/** Morning — sun climbing. */
export const ANCHOR_HOUR_MORNING = 8
/** Midday — brightest sky. */
export const ANCHOR_HOUR_DAY = 14
/** Evening — golden hour / sunset warmth. */
export const ANCHOR_HOUR_EVENING = 19
/** Civil twilight before full night. */
export const ANCHOR_HOUR_DUSK = 21

/** Back-compat aliases (older imports). */
export const ANCHOR_HOUR_BRIGHT_SHIFT = ANCHOR_HOUR_DAWN
export const ANCHOR_HOUR_DARK_SHIFT = ANCHOR_HOUR_DUSK

/** Hour used when the user toggles dark mode — lighter than midnight for visible clouds. */
export const ANCHOR_HOUR_NIGHT_UI = ANCHOR_HOUR_DUSK

/** Named sky periods for debug preview + documentation. */
export const SKY_PERIOD_PRESETS = [
  { id: 'auto', label: 'Live', hour: null as number | null },
  { id: 'night', label: 'Night', hour: ANCHOR_HOUR_NIGHT },
  { id: 'dawn', label: 'Dawn', hour: ANCHOR_HOUR_DAWN },
  { id: 'morning', label: 'Morning', hour: ANCHOR_HOUR_MORNING },
  { id: 'day', label: 'Day', hour: ANCHOR_HOUR_DAY },
  { id: 'evening', label: 'Evening', hour: ANCHOR_HOUR_EVENING },
  { id: 'dusk', label: 'Dusk', hour: ANCHOR_HOUR_DUSK },
] as const

export type SkyPeriodId = (typeof SKY_PERIOD_PRESETS)[number]['id']

/** Sky luminance below this → night UI tokens. */
const SKY_LUMINANCE_NIGHT_THRESHOLD = 0.38

type RGB = { r: number; g: number; b: number }

/** Night sky — lifted from near-black so volumetric clouds read clearly. */
const nightTheme: RGB = { r: 38, g: 58, b: 102 }
const dawnTheme: RGB = { r: 243, g: 164, b: 111 }
const morningTheme: RGB = { r: 168, g: 205, b: 238 }
const dayTheme: RGB = { r: 135, g: 206, b: 235 }
const eveningTheme: RGB = { r: 105, g: 95, b: 168 }
const duskTheme: RGB = { r: 72, g: 88, b: 142 }

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

  if (clamped < ANCHOR_HOUR_DAWN) {
    return lerpRGB(nightTheme, dawnTheme, mapRange(clamped, ANCHOR_HOUR_NIGHT, ANCHOR_HOUR_DAWN))
  }
  if (clamped < ANCHOR_HOUR_MORNING) {
    return lerpRGB(dawnTheme, morningTheme, mapRange(clamped, ANCHOR_HOUR_DAWN, ANCHOR_HOUR_MORNING))
  }
  if (clamped < ANCHOR_HOUR_DAY) {
    return lerpRGB(morningTheme, dayTheme, mapRange(clamped, ANCHOR_HOUR_MORNING, ANCHOR_HOUR_DAY))
  }
  if (clamped < ANCHOR_HOUR_EVENING) {
    return lerpRGB(dayTheme, eveningTheme, mapRange(clamped, ANCHOR_HOUR_DAY, ANCHOR_HOUR_EVENING))
  }
  if (clamped < ANCHOR_HOUR_DUSK) {
    return lerpRGB(eveningTheme, duskTheme, mapRange(clamped, ANCHOR_HOUR_EVENING, ANCHOR_HOUR_DUSK))
  }
  return lerpRGB(duskTheme, nightTheme, mapRange(clamped, ANCHOR_HOUR_DUSK, 24))
}

const lockedAnchors = {
  night: getLegacyThemeForHour(ANCHOR_HOUR_NIGHT),
  dawn: getLegacyThemeForHour(ANCHOR_HOUR_DAWN),
  morning: getLegacyThemeForHour(ANCHOR_HOUR_MORNING),
  day: getLegacyThemeForHour(ANCHOR_HOUR_DAY),
  evening: getLegacyThemeForHour(ANCHOR_HOUR_EVENING),
  dusk: getLegacyThemeForHour(ANCHOR_HOUR_DUSK),
}

/** Cloud RGB at each named anchor — tune visibility per period here. */
const cloudAtAnchor = {
  night: { r: 145, g: 158, b: 188 } as RGB,
  dawn: { r: 255, g: 215, b: 191 } as RGB,
  morning: { r: 248, g: 248, b: 255 } as RGB,
  day: { r: 255, g: 255, b: 255 } as RGB,
  evening: { r: 255, g: 210, b: 195 } as RGB,
  dusk: { r: 195, g: 185, b: 210 } as RGB,
}

const cloudShadowAtAnchor = {
  night: { r: 32, g: 42, b: 72 } as RGB,
  dawn: { r: 171, g: 118, b: 135 } as RGB,
  morning: { r: 100, g: 120, b: 170 } as RGB,
  day: { r: 73, g: 107, b: 193 } as RGB,
  evening: { r: 95, g: 75, b: 120 } as RGB,
  dusk: { r: 55, g: 60, b: 95 } as RGB,
}

export function getSkyColorsForHour(hour: number): { sky: RGB; cloud: RGB; cloudShadow: RGB } {
  const clamped = Math.max(0, Math.min(24, hour))

  if (clamped < ANCHOR_HOUR_DAWN) {
    const t = mapRange(clamped, ANCHOR_HOUR_NIGHT, ANCHOR_HOUR_DAWN)
    return {
      sky: lerpRGB(lockedAnchors.night, lockedAnchors.dawn, t),
      cloud: lerpRGB(cloudAtAnchor.night, cloudAtAnchor.dawn, t),
      cloudShadow: lerpRGB(cloudShadowAtAnchor.night, cloudShadowAtAnchor.dawn, t),
    }
  }

  if (clamped < ANCHOR_HOUR_MORNING) {
    const t = mapRange(clamped, ANCHOR_HOUR_DAWN, ANCHOR_HOUR_MORNING)
    return {
      sky: lerpRGB(lockedAnchors.dawn, lockedAnchors.morning, t),
      cloud: lerpRGB(cloudAtAnchor.dawn, cloudAtAnchor.morning, t),
      cloudShadow: lerpRGB(cloudShadowAtAnchor.dawn, cloudShadowAtAnchor.morning, t),
    }
  }

  if (clamped < ANCHOR_HOUR_DAY) {
    const t = mapRange(clamped, ANCHOR_HOUR_MORNING, ANCHOR_HOUR_DAY)
    return {
      sky: lerpRGB(lockedAnchors.morning, lockedAnchors.day, t),
      cloud: lerpRGB(cloudAtAnchor.morning, cloudAtAnchor.day, t),
      cloudShadow: lerpRGB(cloudShadowAtAnchor.morning, cloudShadowAtAnchor.day, t),
    }
  }

  if (clamped < ANCHOR_HOUR_EVENING) {
    const t = mapRange(clamped, ANCHOR_HOUR_DAY, ANCHOR_HOUR_EVENING)
    return {
      sky: lerpRGB(lockedAnchors.day, lockedAnchors.evening, t),
      cloud: lerpRGB(cloudAtAnchor.day, cloudAtAnchor.evening, t),
      cloudShadow: lerpRGB(cloudShadowAtAnchor.day, cloudShadowAtAnchor.evening, t),
    }
  }

  if (clamped < ANCHOR_HOUR_DUSK) {
    const t = mapRange(clamped, ANCHOR_HOUR_EVENING, ANCHOR_HOUR_DUSK)
    return {
      sky: lerpRGB(lockedAnchors.evening, lockedAnchors.dusk, t),
      cloud: lerpRGB(cloudAtAnchor.evening, cloudAtAnchor.dusk, t),
      cloudShadow: lerpRGB(cloudShadowAtAnchor.evening, cloudShadowAtAnchor.dusk, t),
    }
  }

  const t = mapRange(clamped, ANCHOR_HOUR_DUSK, 24)
  return {
    sky: lerpRGB(lockedAnchors.dusk, lockedAnchors.night, t),
    cloud: lerpRGB(cloudAtAnchor.dusk, cloudAtAnchor.night, t),
    cloudShadow: lerpRGB(cloudShadowAtAnchor.dusk, cloudShadowAtAnchor.night, t),
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
