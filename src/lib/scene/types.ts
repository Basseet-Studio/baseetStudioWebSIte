// Scene config types — matches docs/refrences/camera-3dobjects-ref/templates/scene-config.schema.json

export type Vec3 = [number, number, number]

export type EasingName = 'linear' | 'easeInOutCubic' | 'easeOutQuad' | 'easeInQuad'

export type CloudDepth = 'behind' | 'middle' | 'in_front'

export type ObjectScope = 'persistent' | 'page'

export type SceneRenderer = 'cloudscape' | 'vanta' | 'none'

export type ScrollMode = 'global' | 'section-weighted'

export interface CameraPose {
  position: Vec3
  target: Vec3
  fov: number
  source?: string
}

export interface CloudSettings {
  skyColor?: string
  cloudColor?: string
  cloudShadowColor?: string
  density?: number
  speed?: number
  noise?: number
  verticalSpread?: number
  syncTheme?: boolean
}

export interface LightingSettings {
  azimuth?: number
  elevation?: number
  intensity?: number
  fogDensity?: number
  /** Hex color tinting sunlight in the cloud shader (uLightColor). */
  color?: string
}

export interface ObjectCommands {
  show?: string[]
  hide?: string[]
  animateIn?: string[]
  animateOut?: string[]
}

export interface ScrollAnchor {
  id: string
  label?: string
  atScrollProgress: number
  easing?: EasingName
  camera: CameraPose
  clouds?: CloudSettings
  lighting?: LightingSettings
  objects?: ObjectCommands
  hold?: {
    scrollProgressSpan?: number
    comment?: string
  }
}

export interface ObjectTransform {
  position: Vec3
  rotationY: number
  scale: number
}

export interface LoadAtConfig {
  type: 'anchor' | 'progress' | 'immediate' | 'idle'
  anchorId?: string
  when?: 'enter' | 'exit'
  at?: number
  preloadMargin?: number
}

export interface SceneObject {
  id: string
  url: string
  scope: ObjectScope
  cloudDepth: CloudDepth
  transform: ObjectTransform
  preload?: boolean
  normalize?: boolean
  bindAnchor?: string
  loadAt?: LoadAtConfig
}

export interface PageTransitionSpec {
  durationMs?: number
  easing?: EasingName
  from?: string
  to?: string
  camera?: CameraPose
}

export interface SceneConfig {
  schemaVersion: 1
  pageId: string
  renderer: SceneRenderer
  durationSeconds: number
  scrollMode?: ScrollMode
  entryCamera: CameraPose
  exitCamera?: CameraPose
  scrollAnchors: ScrollAnchor[]
  objects?: SceneObject[]
  clouds?: CloudSettings
  lighting?: LightingSettings
  transition?: {
    entry?: PageTransitionSpec
    exit?: PageTransitionSpec
  }
  sections?: Array<{
    selector: string
    anchorRange: [number, number]
    driver?: string
    gsapTimelineId?: string
  }>
  source?: {
    toolcraftApp?: string
    exportDate?: string
    settingsHash?: string
  }
  /** Internal WebGL resolution multiplier. CSS canvas stays full viewport. Quality tiers override this on mobile. */
  renderScale?: number
}

export interface EvaluatedSceneState {
  camera: CameraPose
  clouds: CloudSettings
  lighting: LightingSettings
  objectCommands: Required<ObjectCommands>
  activeAnchorId: string | null
}

/** Saved Cloud Playground snapshot (dev authoring → JSON on disk). */
export interface PlaygroundPoint {
  id: string
  name: string
  pageId?: string
  sectionId?: string
  includeCamera: boolean
  includeColors: boolean
  camera?: CameraPose
  clouds?: CloudSettings
  lighting?: LightingSettings
  createdAt?: string
}
