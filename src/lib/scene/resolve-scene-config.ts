import { defaultSceneConfig } from '../../content/data/scenes/default'
import { homeSceneConfig } from '../../content/data/scenes/home'
import { getPlaygroundPointsForPage } from './playground-points'
import type { PlaygroundPoint, SceneConfig, ScrollAnchor } from './types'

const routeMap: Record<string, SceneConfig> = {
  '/': homeSceneConfig,
  '/ar': homeSceneConfig,
  '/ur': homeSceneConfig,
  '/hi': homeSceneConfig,
  '/fil': homeSceneConfig,
}

function cloneConfig(config: SceneConfig): SceneConfig {
  return structuredClone(config)
}

/**
 * Merge saved playground snapshots into a scene config so they visibly
 * re-apply on the chosen page/section after reload.
 *
 * - Points with sectionId matching an existing scrollAnchor update that anchor.
 * - Points without sectionId (or unknown section) override page-level clouds/
 *   lighting and/or entryCamera, and update the progress-0 anchor when present.
 */
function mergePlaygroundPoints(config: SceneConfig): SceneConfig {
  const points = getPlaygroundPointsForPage(config.pageId)
  if (!points.length) return config

  const next = cloneConfig(config)
  const anchors = next.scrollAnchors.map((a) => ({ ...a }))

  for (const point of points) {
    applyPoint(next, anchors, point)
  }

  next.scrollAnchors = anchors.sort((a, b) => a.atScrollProgress - b.atScrollProgress)
  return next
}

function applyPoint(config: SceneConfig, anchors: ScrollAnchor[], point: PlaygroundPoint): void {
  const sectionId = point.sectionId?.trim()
  let target = sectionId ? anchors.find((a) => a.id === sectionId) : undefined

  if (!target && !sectionId) {
    // Page-root snapshot: update entry + progress-0 anchor
    if (point.includeCamera && point.camera) {
      config.entryCamera = { ...point.camera, source: `playground:${point.id}` }
    }
    if (point.includeColors) {
      if (point.clouds) {
        config.clouds = { ...config.clouds, ...point.clouds, syncTheme: false }
      }
      if (point.lighting) {
        config.lighting = { ...config.lighting, ...point.lighting }
      }
    }
    target = anchors.find((a) => a.atScrollProgress === 0) || anchors[0]
  }

  if (!target && sectionId) {
    // Unknown section — append a free anchor at mid-scroll (or end)
    const lastProgress = anchors.length
      ? Math.max(...anchors.map((a) => a.atScrollProgress))
      : 0
    target = {
      id: sectionId,
      label: point.name,
      atScrollProgress: Math.min(1, lastProgress + 0.05),
      camera: point.camera || config.entryCamera,
    }
    anchors.push(target)
  }

  if (!target) return

  if (point.includeCamera && point.camera) {
    target.camera = { ...point.camera, source: `playground:${point.id}` }
    if (target.atScrollProgress === 0) {
      config.entryCamera = { ...target.camera }
    }
  }

  if (point.includeColors) {
    if (point.clouds) {
      target.clouds = { ...target.clouds, ...point.clouds, syncTheme: false }
      if (target.atScrollProgress === 0) {
        config.clouds = { ...config.clouds, ...point.clouds, syncTheme: false }
      }
    }
    if (point.lighting) {
      target.lighting = { ...target.lighting, ...point.lighting }
      if (target.atScrollProgress === 0) {
        config.lighting = { ...config.lighting, ...point.lighting }
      }
    }
  }
}

/** Resolve scene config for a pathname (strips trailing slash). */
export function resolveSceneConfig(pathname: string): SceneConfig {
  const stripped = pathname.replace(/\/$/, '') || '/'
  const base = routeMap[stripped] ?? defaultSceneConfig
  return mergePlaygroundPoints(base)
}
