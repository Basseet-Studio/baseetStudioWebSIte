import type { CameraPose } from '../../../lib/scene/types'
import { buildOrbitScene, type OrbitShot } from './world'

/**
 * Home: the opening slice of the orbit (-40° -> 62°).
 * Anchor ids match the section markers on the page.
 * Edit a row to tune: angle, radius, height, lookY (pitch), fov.
 *
 * The scroll story (carpets: high 12.5…17.5, mid -2.4…3.3, low -16.5…-9.5):
 *   hero        between mid & high, patchy top carpet overhead
 *   highlights  climb a little, look up the tower
 *   features    DIVE through the mid deck -> fly under it, low carpet below
 *   clients     still under the deck, look up through the holes
 *   team        climb back out through the mid deck
 *   end         settle where Services begins (70°)
 */
export const HOME_SHOTS: OrbitShot[] = [
  { id: 'home-hero', at: 0, angle: -40, radius: 88, height: 7, lookY: 16, fov: 48 },
  { id: 'home-highlights', at: 0.14, angle: -24, radius: 74, height: 9, lookY: 19, fov: 50 },
  { id: 'home-features', at: 0.5, angle: 6, radius: 58, height: -6, lookY: 8, fov: 58 },
  { id: 'home-clients', at: 0.65, angle: 26, radius: 54, height: -5.5, lookY: 16, fov: 56 },
  { id: 'home-team', at: 0.85, angle: 46, radius: 64, height: 8, lookY: 18, fov: 50 },
  { id: 'home-end', at: 1, angle: 62, radius: 76, height: 10, lookY: 13, fov: 48 },
]

export const homeSceneConfig = buildOrbitScene('home', HOME_SHOTS)

export const homeStartCamera: CameraPose = homeSceneConfig.entryCamera
export const homeEndCamera: CameraPose = homeSceneConfig.exitCamera as CameraPose
export const homeEntryCamera: CameraPose = homeStartCamera
export const homeExitCamera: CameraPose = homeEndCamera
