import fs from 'node:fs'
import path from 'node:path'
import type { PlaygroundPoint } from './types'

const modules = import.meta.glob<{ default: PlaygroundPoint } | PlaygroundPoint>(
  '../../content/data/scenes/playground/*.json',
  { eager: true },
)

function unwrap(mod: { default: PlaygroundPoint } | PlaygroundPoint): PlaygroundPoint {
  return 'default' in mod && mod.default ? mod.default : (mod as PlaygroundPoint)
}

function isPoint(value: unknown): value is PlaygroundPoint {
  if (!value || typeof value !== 'object') return false
  const p = value as Partial<PlaygroundPoint>
  return typeof p.id === 'string' && typeof p.name === 'string'
}

/** Live disk read — works in `astro dev` immediately after Save (no Vite restart). */
function loadFromDisk(): PlaygroundPoint[] {
  const dir = path.join(process.cwd(), 'src', 'content', 'data', 'scenes', 'playground')
  if (!fs.existsSync(dir)) return []
  const points: PlaygroundPoint[] = []
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.json')) continue
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')) as unknown
      if (isPoint(raw)) points.push(raw)
    } catch {
      // skip corrupt files
    }
  }
  return points.sort((a, b) => a.id.localeCompare(b.id))
}

function loadFromGlob(): PlaygroundPoint[] {
  return Object.values(modules)
    .map(unwrap)
    .filter(isPoint)
    .sort((a, b) => a.id.localeCompare(b.id))
}

/**
 * All playground snapshots under scenes/playground/*.json.
 * Prefers a live filesystem read on Node (SSR / build / astro dev) so newly
 * saved points appear on the next page request without restarting Vite.
 */
export function getPlaygroundPoints(): PlaygroundPoint[] {
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      return loadFromDisk()
    } catch {
      // fall through to glob
    }
  }
  return loadFromGlob()
}

/** Snapshots targeting a given scene pageId (or unscoped points with no pageId). */
export function getPlaygroundPointsForPage(pageId: string): PlaygroundPoint[] {
  return getPlaygroundPoints().filter((p) => !p.pageId || p.pageId === pageId)
}
