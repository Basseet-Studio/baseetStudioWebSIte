import type {
  CameraPose,
  CloudSettings,
  EasingName,
  EvaluatedSceneState,
  LightingSettings,
  ObjectCommands,
  SceneConfig,
  ScrollAnchor,
} from './types'

export const EASING: Record<EasingName, (t: number) => number> = {
  linear: (t) => t,
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutQuad: (t) => 1 - (1 - t) * (1 - t),
  easeInQuad: (t) => t * t,
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpVec3(a: [number, number, number], b: [number, number, number], t: number) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)] as [number, number, number]
}

export function lerpCamera(a: CameraPose, b: CameraPose, t: number): CameraPose {
  return {
    position: lerpVec3(a.position, b.position, t),
    target: lerpVec3(a.target, b.target, t),
    fov: lerp(a.fov, b.fov, t),
  }
}

function mergePartial<T extends Record<string, unknown>>(base: T, patch?: Partial<T>): T {
  if (!patch) return base
  const out = { ...base }
  for (const key of Object.keys(patch) as Array<keyof T>) {
    const patchVal = patch[key]
    const baseVal = base[key]
    if (
      patchVal &&
      typeof patchVal === 'object' &&
      !Array.isArray(patchVal) &&
      baseVal &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal)
    ) {
      out[key] = { ...(baseVal as object), ...(patchVal as object) } as T[keyof T]
    } else if (patchVal !== undefined) {
      out[key] = patchVal as T[keyof T]
    }
  }
  return out
}

function sortAnchors(anchors: ScrollAnchor[]): ScrollAnchor[] {
  return [...anchors].sort((a, b) => a.atScrollProgress - b.atScrollProgress)
}

function emptyCommands(): Required<ObjectCommands> {
  return { show: [], hide: [], animateIn: [], animateOut: [] }
}

export function createCameraController(sceneConfig: SceneConfig) {
  let config = sceneConfig
  let anchors = sortAnchors(sceneConfig.scrollAnchors || [])

  const defaults = {
    clouds: config.clouds || {},
    lighting: config.lighting || {},
  }

  function setConfig(next: SceneConfig): void {
    config = next
    anchors = sortAnchors(next.scrollAnchors || [])
    defaults.clouds = { ...(next.clouds || {}) }
    defaults.lighting = { ...(next.lighting || {}) }
  }

  function setBaseTheme(clouds: CloudSettings, lighting: LightingSettings): void {
    defaults.clouds = { ...clouds }
    defaults.lighting = { ...lighting }
  }

  function buildStateBetween(
    fromAnchor: ScrollAnchor,
    toAnchor: ScrollAnchor,
    t: number,
    activeId: string,
  ): EvaluatedSceneState {
    const camera = lerpCamera(fromAnchor.camera, toAnchor.camera, t)
    let clouds = mergePartial(defaults.clouds, fromAnchor.clouds)
    clouds = mergePartial(clouds, toAnchor.clouds)
    let lighting = mergePartial(defaults.lighting, fromAnchor.lighting)
    lighting = mergePartial(lighting, toAnchor.lighting)
    const objectCommands = accumulateObjectCommands(fromAnchor, toAnchor, t)
    return { camera, clouds, lighting, objectCommands, activeAnchorId: activeId }
  }

  function buildStateAtAnchor(anchor: ScrollAnchor, activeId: string): EvaluatedSceneState {
    return {
      camera: anchor.camera,
      clouds: mergePartial(defaults.clouds, anchor.clouds),
      lighting: mergePartial(defaults.lighting, anchor.lighting),
      objectCommands: {
        show: anchor.objects?.show ?? [],
        hide: anchor.objects?.hide ?? [],
        animateIn: anchor.objects?.animateIn ?? [],
        animateOut: anchor.objects?.animateOut ?? [],
      },
      activeAnchorId: activeId,
    }
  }

  function accumulateObjectCommands(
    fromAnchor: ScrollAnchor,
    toAnchor: ScrollAnchor,
    t: number,
  ): Required<ObjectCommands> {
    const anchor = t >= 0.5 ? toAnchor : fromAnchor
    return {
      show: anchor.objects?.show ?? [],
      hide: anchor.objects?.hide ?? [],
      animateIn: anchor.objects?.animateIn ?? [],
      animateOut: anchor.objects?.animateOut ?? [],
    }
  }

  function evaluateAtProgress(progress: number): EvaluatedSceneState {
    const p = clamp(progress, 0, 1)

    if (anchors.length === 0) {
      return {
        camera: config.entryCamera,
        clouds: defaults.clouds,
        lighting: defaults.lighting,
        objectCommands: emptyCommands(),
        activeAnchorId: null,
      }
    }

    if (p <= anchors[0].atScrollProgress) {
      return buildStateAtAnchor(anchors[0], anchors[0].id)
    }

    const last = anchors[anchors.length - 1]
    if (p >= last.atScrollProgress) {
      return buildStateAtAnchor(last, last.id)
    }

    for (let i = 1; i < anchors.length; i++) {
      const prev = anchors[i - 1]
      const next = anchors[i]
      if (p >= prev.atScrollProgress && p <= next.atScrollProgress) {
        const span = next.atScrollProgress - prev.atScrollProgress
        const tRaw = span <= 0 ? 1 : (p - prev.atScrollProgress) / span
        const easeFn = EASING[next.easing || 'easeInOutCubic'] || EASING.easeInOutCubic
        const t = easeFn(clamp(tRaw, 0, 1))
        return buildStateBetween(prev, next, t, next.id)
      }
    }

    return {
      camera: config.entryCamera,
      clouds: defaults.clouds,
      lighting: defaults.lighting,
      objectCommands: emptyCommands(),
      activeAnchorId: null,
    }
  }

  return {
    evaluateAtProgress,
    setConfig,
    setBaseTheme,
    getEntryCamera: () => config.entryCamera,
    getExitCamera: () =>
      config.exitCamera || anchors[anchors.length - 1]?.camera || config.entryCamera,
  }
}

export type CameraController = ReturnType<typeof createCameraController>
