import type { CameraPose, SceneConfig, Vec3 } from '../../../lib/scene/types'
import {
  editorDefaultClouds,
  editorDefaultLighting,
  editorTeamSkylineTransform,
} from './editor-default'

/**
 * Home flight: start far away with the cities small on the horizon, then
 * arc around them at a distance while altitude and pitch change, then hand
 * off to the team-skyline end shot.
 *
 * Every orbit pose is generated from FLIGHT below, so you tune the whole
 * path with a few numbers instead of raw coordinates:
 *   angle  — degrees around the city (0 = south / +Z side)
 *   radius — distance from the city centre (world units)
 *   height — camera altitude (cloud tops are around y = 5)
 *   lookY  — height the camera looks at (higher = pitched up, more sky)
 *   fov    — lens
 * Interior anchors use 'linear' easing so the Catmull-Rom spline flows
 * without stopping at each anchor; scroll smoothing provides the easing.
 */

/** World-space centre between the two skylines (object pos x WORLD_SCALE 0.4). */
export const CITY_CENTER: Vec3 = [-7, 3, -6]

interface OrbitShot {
  at: number
  angle: number
  radius: number
  height: number
  lookY: number
  fov: number
}

export const FLIGHT: OrbitShot[] = [
  // Opening: cities clearly in view across the cloud sea, sky in the upper half.
  { at: 0.0, angle: -30, radius: 48, height: 9, lookY: 12, fov: 45 },
  // Approach while banking around.
  { at: 0.25, angle: -5, radius: 38, height: 7.5, lookY: 9, fov: 46 },
  // Close pass skimming the cloud tops, looking up at the towers.
  { at: 0.5, angle: 30, radius: 30, height: 6, lookY: 8, fov: 50 },
  // Climb away and look down over the cloud sea.
  { at: 0.72, angle: 70, radius: 36, height: 12, lookY: 2, fov: 46 },
]

export function orbitPose(shot: OrbitShot, source: string): CameraPose {
  const a = (shot.angle * Math.PI) / 180
  return {
    position: [
      CITY_CENTER[0] + Math.sin(a) * shot.radius,
      shot.height,
      CITY_CENTER[2] + Math.cos(a) * shot.radius,
    ],
    target: [CITY_CENTER[0], shot.lookY, CITY_CENTER[2]],
    fov: shot.fov,
    source,
  }
}

export const homeStartCamera: CameraPose = orbitPose(FLIGHT[0], 'flight:far')

export const homeEndCamera: CameraPose = {
  position: [30, 2.8, 18.5],
  target: [4.5, -10, -16.6],
  fov: 31,
  source: 'playground:end-home-ourservice',
}

export const homeEntryCamera: CameraPose = homeStartCamera
export const homeExitCamera: CameraPose = homeEndCamera

const SKYLINE_IDS = ['dubai-skyline', 'petronas-skyline']
const SHOW_SKYLINES = { show: [...SKYLINE_IDS], hide: ['team-skyline'] }
const FLIGHT_IDS = ['home-hero', 'home-approach', 'home-features', 'home-climb']

export const homeSceneConfig: SceneConfig = {
  schemaVersion: 1,
  pageId: 'home',
  renderer: 'cloudscape',
  durationSeconds: 10,
  scrollMode: 'global',
  entryCamera: homeEntryCamera,
  exitCamera: homeExitCamera,
  clouds: { ...editorDefaultClouds },
  lighting: { ...editorDefaultLighting },
  transition: {
    entry: {
      durationMs: 1200,
      easing: 'easeInOutCubic',
      from: 'exit-camera',
    },
    exit: {
      durationMs: 800,
      easing: 'easeInQuad',
      to: 'entry-camera',
    },
  },
  scrollAnchors: [
    ...FLIGHT.map((shot, i) => ({
      id: FLIGHT_IDS[i],
      label: `Flight ${i + 1}`,
      atScrollProgress: shot.at,
      easing: 'linear' as const,
      camera: orbitPose(shot, `flight:${FLIGHT_IDS[i]}`),
      objects: SHOW_SKYLINES,
    })),
    {
      id: 'home-end',
      label: 'End — team skyline',
      atScrollProgress: 1,
      easing: 'easeInOutCubic',
      camera: homeEndCamera,
      lighting: { fogDensity: 0.45 },
      objects: {
        show: ['team-skyline'],
        hide: [...SKYLINE_IDS],
        animateIn: ['team-skyline'],
      },
    },
  ],
  objects: [
    {
      id: 'dubai-skyline',
      url: '/models/home/dubai-skyline.glb',
      scope: 'page',
      cloudDepth: 'middle',
      transform: { position: [-45, 10, -20], rotationY: 0, scale: 30 },
      normalize: true,
      preload: true,
    },
    {
      id: 'petronas-skyline',
      url: '/models/home/petronas-skyline.glb',
      scope: 'page',
      cloudDepth: 'middle',
      transform: { position: [10, 8, -10], rotationY: 0, scale: 22 },
      normalize: true,
      preload: true,
    },
    {
      id: 'team-skyline',
      url: '/models/home/team-skyline.glb',
      scope: 'page',
      cloudDepth: 'middle',
      transform: editorTeamSkylineTransform,
      normalize: true,
      bindAnchor: 'home-end',
      loadAt: {
        type: 'anchor',
        anchorId: 'home-end',
        when: 'enter',
        preloadMargin: 0.2,
      },
    },
  ],
}
