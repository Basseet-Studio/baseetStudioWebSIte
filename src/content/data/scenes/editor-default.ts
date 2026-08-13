import type { CameraPose, CloudSettings, LightingSettings } from '../../../lib/scene/types'

/**
 * Authoritative default pose from cloudscape-editor-settings.json (2026-07-05).
 * Used as entry camera on every page before scroll / before GLB objects appear.
 */
export const editorDefaultCamera: CameraPose = {
  position: [12.1, 2.1, 4.7],
  target: [-10.8, -0.1, 0],
  fov: 50,
  source: 'editor:cloudscape-editor-settings',
}

export const editorDefaultClouds: CloudSettings = {
  density: 1,
  speed: 1.8,
  noise: 1,
  verticalSpread: 0.78,
  syncTheme: true,
}

/**
 * Customer mode toggle.
 *
 * When true, the Cloud Playground and the debug panel initialise and fall
 * back to the production cloud defaults above (density 1 / spread 0.78) —
 * the values visitors actually see — instead of the sparse authoring
 * defaults (density 0.1 / spread 0.6). Flip to false to get the sparse
 * authoring defaults back while tuning scenes.
 */
export const CUSTOMER_MODE = true

/** Cloud defaults used by the playground / debug panels. */
export const playgroundCloudDefaults: CloudSettings = CUSTOMER_MODE
  ? { ...editorDefaultClouds }
  : { density: 0.1, speed: 1.8, noise: 1, verticalSpread: 0.6, syncTheme: true }

export const editorDefaultLighting: LightingSettings = {
  azimuth: 62,
  elevation: 59,
  intensity: 0,
  fogDensity: 0.76,
}

/** Editor object transform — team-skyline at home-team anchor (tune scale in debug) */
export const editorTeamSkylineTransform = {
  position: [-13.5, 0.8, 0] as [number, number, number],
  rotationY: 0,
  scale: 1.2,
}
