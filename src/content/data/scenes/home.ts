import type { CameraPose } from '../../../lib/scene/types'
import { buildOrbitScene, type OrbitShot } from './world'

/**
 * Home: the opening slice of the orbit (-40° -> 60°).
 * Anchor ids match the section markers on the page.
 * Edit a row to tune: angle, radius, height, lookY (pitch), fov.
 */
export const HOME_SHOTS: OrbitShot[] = [
  { id: 'home-hero', at: 0, angle: -40, radius: 85, height: 8, lookY: 18, fov: 48 },
  { id: 'home-highlights', at: 0.14, angle: -25, radius: 70, height: 5, lookY: 15, fov: 50 },
  { id: 'home-features', at: 0.5, angle: 5, radius: 55, height: 2.8, lookY: 22, fov: 56 },
  { id: 'home-clients', at: 0.65, angle: 25, radius: 50, height: 13, lookY: 3, fov: 52 },
  { id: 'home-team', at: 0.85, angle: 45, radius: 60, height: 6, lookY: 16, fov: 50 },
  { id: 'home-end', at: 1, angle: 60, radius: 72, height: 9, lookY: 12, fov: 48 },
]

export const homeSceneConfig = buildOrbitScene('home', HOME_SHOTS)

export const homeStartCamera: CameraPose = homeSceneConfig.entryCamera
export const homeEndCamera: CameraPose = homeSceneConfig.exitCamera as CameraPose
export const homeEntryCamera: CameraPose = homeStartCamera
export const homeExitCamera: CameraPose = homeEndCamera
