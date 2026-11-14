/**
 * Picks the site-wide landmark from the visitor's country:
 *   MY -> Petronas, SA -> Riyadh, everything else (incl. unknown) -> Dubai.
 * The Cloud Playground can override it (localStorage + event).
 */
import { getVisitorCountry, onVisitorCountry } from '../../scripts/visitor-country'
import { LANDMARK_IDS, LANDMARK_OBJECTS } from '../../content/data/scenes/world'
import type { ObjectRegistry } from './object-registry'
import { sceneLog } from './scene-debug'

export const LANDMARK_OVERRIDE_KEY = 'baseet:landmark-country'
export const LANDMARK_EVENT = 'baseet:landmark-country'
const DEFAULT_COUNTRY = 'AE'

const MAP: Record<string, string> = { ...LANDMARK_IDS }
const ALL_IDS = Object.values(MAP)

let registry: ObjectRegistry | null = null
let detectedCode: string | null = null
let detectionDone = false
let wired = false
let lastApplied = ''

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
  const code = (detectedCode || '').toUpperCase()
  return MAP[code] ? code : DEFAULT_COUNTRY
}

function apply(force = false): void {
  if (!registry) return
  // Wait for detection unless an override is set (avoids Dubai -> Petronas flash).
  if (!readOverride() && !detectionDone) return
  const country = landmarkCountry()
  const active = MAP[country]
  // Entries can be re-created (quality tier change) — make sure all exist.
  registry.registerAll(LANDMARK_OBJECTS)
  for (const id of ALL_IDS) registry.setForceVisible(id, id === active)
  if (force || lastApplied !== active) sceneLog('landmark', `${country} -> ${active}`)
  lastApplied = active
}

export function initLandmark(objectRegistry: ObjectRegistry): void {
  registry = objectRegistry

  const known = getVisitorCountry()
  if (known) {
    detectedCode = known.code
    detectionDone = true
  }

  if (!wired) {
    wired = true
    onVisitorCountry(({ code }) => {
      detectedCode = code
      detectionDone = true
      apply()
    })
    // Playground switch (detail = code or null for auto).
    document.addEventListener(LANDMARK_EVENT, () => apply(true))
    // Re-assert after navigations (registry entries survive, this is cheap).
    document.addEventListener('astro:page-load', () => apply())
  }

  apply(true)
}
