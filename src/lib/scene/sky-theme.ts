import {
  ANCHOR_HOUR_BRIGHT_SHIFT,
  ANCHOR_HOUR_DARK_SHIFT,
  ANCHOR_HOUR_DAY,
  ANCHOR_HOUR_NIGHT,
  getHourFromDate,
  getSkyColorsForHour,
  readSavedTheme,
  type SiteTheme,
} from '../theme'
import type { CloudSettings, LightingSettings } from './types'

const SKY_LUMINANCE_NIGHT_THRESHOLD = 0.42
const OS_DARK_NUDGE = 0.05

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function hexToVec3(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}

export function skyColorsToCloudSettings(
  sky: { r: number; g: number; b: number },
  cloud: { r: number; g: number; b: number },
): Pick<CloudSettings, 'skyColor' | 'cloudColor' | 'cloudShadowColor'> {
  return {
    skyColor: rgbToHex(sky.r, sky.g, sky.b),
    cloudColor: rgbToHex(cloud.r, cloud.g, cloud.b),
    cloudShadowColor: rgbToHex(
      Math.max(0, cloud.r - 40),
      Math.max(0, cloud.g - 40),
      Math.max(0, cloud.b - 40),
    ),
  }
}

function skyLuminance(rgb: { r: number; g: number; b: number }): number {
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
}

function uiThemeForSky(
  sky: { r: number; g: number; b: number },
  prefersDarkOS: boolean,
): SiteTheme {
  const threshold = prefersDarkOS
    ? SKY_LUMINANCE_NIGHT_THRESHOLD + OS_DARK_NUDGE
    : SKY_LUMINANCE_NIGHT_THRESHOLD - OS_DARK_NUDGE
  return skyLuminance(sky) < threshold ? 'night' : 'day'
}

/** Warm orange near dawn/dusk, cool white midday, cool blue-white at night. */
export function deriveLightColorForHour(hour: number): string {
  const h = Math.max(0, Math.min(24, hour))

  if (h < ANCHOR_HOUR_BRIGHT_SHIFT || h >= ANCHOR_HOUR_DARK_SHIFT) {
    return '#FFB87A'
  }
  if (h < ANCHOR_HOUR_DAY) {
    const t = (h - ANCHOR_HOUR_BRIGHT_SHIFT) / (ANCHOR_HOUR_DAY - ANCHOR_HOUR_BRIGHT_SHIFT)
    const r = Math.round(255 * (1 - t * 0.15))
    const g = Math.round(184 + 71 * t)
    const b = Math.round(122 + 133 * t)
    return rgbToHex(r, g, b)
  }
  if (h < ANCHOR_HOUR_DARK_SHIFT) {
    const t = (h - ANCHOR_HOUR_DAY) / (ANCHOR_HOUR_DARK_SHIFT - ANCHOR_HOUR_DAY)
    const r = Math.round(255 - 43 * t)
    const g = Math.round(255 - 77 * t)
    const b = Math.round(255 - 61 * t)
    return rgbToHex(r, g, b)
  }
  return '#A8C8FF'
}

export interface SkyState {
  clouds: CloudSettings
  lighting: Pick<LightingSettings, 'intensity' | 'color'>
  uiTheme: SiteTheme
}

export interface ResolveSkyStateInput {
  hour?: number
  prefersDarkOS?: boolean
  manualTheme?: SiteTheme | null
  pageClouds?: CloudSettings
  pageLighting?: LightingSettings
}

export function resolveSkyState(input: ResolveSkyStateInput = {}): SkyState {
  const hour = input.hour ?? getHourFromDate()
  const prefersDarkOS = input.prefersDarkOS ?? false
  const manualTheme = input.manualTheme ?? readSavedTheme()
  const pageClouds = input.pageClouds ?? {}
  const pageLighting = input.pageLighting ?? {}

  if (pageClouds.syncTheme === false) {
    return {
      clouds: { ...pageClouds },
      lighting: {
        intensity: pageLighting.intensity,
        color: pageLighting.color ?? deriveLightColorForHour(hour),
      },
      uiTheme: manualTheme ?? uiThemeForSky(getSkyColorsForHour(hour).sky, prefersDarkOS),
    }
  }

  const skyHour =
    manualTheme === 'night'
      ? ANCHOR_HOUR_NIGHT
      : manualTheme === 'day'
        ? ANCHOR_HOUR_DAY
        : hour

  const { sky, cloud } = getSkyColorsForHour(skyHour)
  const themedColors = skyColorsToCloudSettings(sky, cloud)

  return {
    clouds: {
      ...pageClouds,
      ...themedColors,
    },
    lighting: {
      intensity: pageLighting.intensity,
      color: pageLighting.color ?? deriveLightColorForHour(skyHour),
    },
    uiTheme: manualTheme ?? uiThemeForSky(sky, prefersDarkOS),
  }
}

export interface SkyThemeUpdate {
  clouds: CloudSettings
  lighting: LightingSettings
  uiTheme: SiteTheme
}

let themeCallback: ((update: SkyThemeUpdate) => void) | null = null

export function registerCloudscapeThemeCallback(
  cb: (update: SkyThemeUpdate) => void,
): void {
  themeCallback = cb
}

export function applyResolvedSkyToRuntime(
  pageClouds: CloudSettings,
  pageLighting: LightingSettings,
  manualTheme?: SiteTheme | null,
): SkyThemeUpdate {
  const prefersDarkOS =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches

  const resolved = resolveSkyState({
    prefersDarkOS,
    manualTheme: manualTheme ?? readSavedTheme(),
    pageClouds,
    pageLighting,
  })

  const update: SkyThemeUpdate = {
    clouds: resolved.clouds,
    lighting: {
      ...pageLighting,
      color: resolved.lighting.color,
    },
    uiTheme: resolved.uiTheme,
  }

  themeCallback?.(update)
  return update
}

export function setCloudscapeTheme(theme: SiteTheme, base: CloudSettings): void {
  const win = window as Window & {
    __BASEET_SCENE_CONFIG__?: { clouds?: CloudSettings; lighting?: LightingSettings }
  }
  const pageLighting = win.__BASEET_SCENE_CONFIG__?.lighting ?? {}
  applyResolvedSkyToRuntime(base, pageLighting, theme)
}
