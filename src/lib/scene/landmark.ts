/**
 * Picks the site-wide landmark from the visitor's country:
 *   MY -> Petronas, everything else (incl. unknown) -> Dubai.
 * The Cloud Playground can override it (localStorage + event).
 */
import { getVisitorCountry, onVisitorCountry } from '../../scripts/visitor-country'
import { LANDMARK_IDS } from '../../content/data/scenes/world'
import type { ObjectRegistry } from './object-registry'
import { sceneLog } from './scene-debug'

export const LANDMARK_OVERRIDE_KEY = 'baseet:landmark-country'
export const LANDMARK_EVENT = 'baseet:landmark-country'
const DEFAULT_COUNTRY = 'AE'
const MAP = LANDMARK_IDS as Record<string, string>

let registryRef: Pick<ObjectRegistry, 'setForceVisible'> | null = null
let detected: string | null | undefined
let bound = false

function readOverride(): string | null {
  try {
    const v = localStorage.getItem(LANDMARK_OVERRIDE_KEY)
    return v && MAP[v] ? v : null
  } catch {
    return null
  }
}

export function landmarkCountry(): string {
  const override = readOverride()
  if (override) return override
  const code = (detected ?? '').toUpperCase()
  return MAP[code] ? code : DEFAULT_COUNTRY
}

function apply(): void {
  if (!registryRef) return
  // Wait for detection unless an override is set (avoids Dubai -> Petronas flash).
  if (detected === undefined && !readOverride()) return
  const country = landmarkCountry()
  const active = MAP[country]
  for (const id of Object.values(MAP)) registryRef.setForceVisible(id, id === active)
  sceneLog('landmark', `${country} -> ${active}`)
}

export function initLandmark(registry: Pick<ObjectRegistry, 'setForceVisible'>): void {
  registryRef = registry
  if (bound) {
    apply()
    return
  }
  bound = true
  const known = getVisitorCountry()
  if (known) detected = known.code
  onVisitorCountry(({ code }) => {
    detected = code
    apply()
  })
  document.addEventListener(LANDMARK_EVENT, () => apply())
  // Detection gave up / blocked: fall back to the default.
  window.setTimeout(() => {
    if (detected === undefined) {
      detected = null
      apply()
    }
  }, 4500)
  apply()
}
