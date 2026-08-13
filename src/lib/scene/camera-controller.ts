import type {
  CameraPose,
  CloudSettings,
  EasingName,
  EvaluatedSceneState,
  LightingSettings,
  ObjectCommands,
  SceneConfig,
  ScrollAnchor,
  Vec3,
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

/**
 * Catmull-Rom spline sample for a scalar (used for fov).
 * p1/p2 are the segment endpoints; p0/p3 are the neighbouring control
 * points (clamped to the endpoints at the array bounds).
 */
function catmullRom1D(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t
  const t3 = t2 * t
  return 0.5 * (
    2 * p1 +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  )
}

function catmullRomVec3(
  p0: Vec3,
  p1: Vec3,
  p2: Vec3,
  p3: Vec3,
  t: number,
): Vec3 {
  return [
    catmullRom1D(p0[0], p1[0], p2[0], p3[0], t),
    catmullRom1D(p0[1], p1[1], p2[1], p3[1], t),
    catmullRom1D(p0[2], p1[2], p2[2], p3[2], t),
  ]
}

/**
 * Sample a Catmull-Rom spline through a list of camera poses.
 * `i` is the index of the next anchor (segment between anchors[i-1] and
 * anchors[i]); `t` is the eased position within that segment [0,1].
 * Endpoints are duplicated so the curve passes through the first/last anchor.
 */
function catmullRomPose(poses: CameraPose[], i: number, t: number): CameraPose {
  const p0 = poses[i - 2] ?? poses[i - 1] ?? poses[0]
  const p1 = poses[i - 1] ?? poses[0]
  const p2 = poses[i] ?? poses[poses.length - 1]
  const p3 = poses[i + 1] ?? poses[poses.length - 1]
  return {
    position: catmullRomVec3(p0.position, p1.position, p2.position, p3.position, t),
    target: catmullRomVec3(p0.target, p1.target, p2.target, p3.target, t),
    fov: catmullRom1D(p0.fov, p1.fov, p2.fov, p3.fov, t),
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
  let poses = anchors.map((a) => a.camera)

  const defaults = {
    clouds: config.clouds || {},
    lighting: config.lighting || {},
  }

  function setConfig(next: SceneConfig): void {
    config = next
    anchors = sortAnchors(next.scrollAnchors || [])
    poses = anchors.map((a) => a.camera)
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

  function buildStateBetweenSpline(
    i: number,
    t: number,
    activeId: string,
  ): EvaluatedSceneState {
    const camera = catmullRomPose(poses, i, t)
    const fromAnchor = anchors[i - 1]
    const toAnchor = anchors[i]
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
        // Smooth curves across 3+ anchors: Catmull-Rom through the poses.
        // Falls back to linear lerp when there are fewer than 3 anchors.
        return poses.length >= 3
          ? buildStateBetweenSpline(i, t, next.id)
          : buildStateBetween(prev, next, t, next.id)
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
