import type { CameraPose, SceneConfig, Vec3 } from '../../../lib/scene/types'
import {
  editorDefaultClouds,
  editorDefaultLighting,
  editorTeamSkylineTransform,
} from './editor-default'

/**
 * HOME FLY-THROUGH (world units)
 *
 *   cloud deck   y ≈ -2.4 … 3.4   (camera skims 2–9, dips INTO it mid-flight)
 *   Dubai        centre (-40, -30), base y -35, height 70 → top y 35
 *   Petronas     centre ( 35, -20), base y -25, height 50 → top y 25
 *
 * The camera flies a real path past the towers (they sweep across the
 * screen = you feel the speed) instead of orbiting a fixed point:
 *   approach → skim the cloud tops → thread BETWEEN the towers inside the
 *   cloud layer → turn back to look up at Dubai → swing round the west side
 *   → end shot over the team skyline.
 * Every pose stays ≥ ~37 units from each tower centre so we never clip
 * inside a model. 'linear' easing + Catmull-Rom = constant-speed flight.
 *
 * Tune: edit a row below (position, target, fov). Skyline sizes are logged in
 * the debug panel on load: "[object] dubai-skyline world h=70 w=… d=…".
 */
interface Shot {
  at: number
  pos: Vec3
  look: Vec3
  fov: number
  label: string
}

export const FLIGHT: Shot[] = [
  { at: 0.0, pos: [0, 6, 45], look: [-3, 14, -25], fov: 50, label: 'Approach — both towers ahead' },
  { at: 0.2, pos: [-2, 3.8, 15], look: [-40, 18, -30], fov: 55, label: 'Skim the cloud tops, eye on Dubai' },
  { at: 0.4, pos: [-2.5, 2.2, -24], look: [-2, 9, -70], fov: 58, label: 'Through the clouds, between the towers' },
  { at: 0.6, pos: [-10, 5.5, -65], look: [-40, 18, -30], fov: 55, label: 'Turn back, look up at Dubai' },
  { at: 0.8, pos: [-75, 8, -5], look: [-5, 6, -22], fov: 50, label: 'Swing round the west side' },
]

function pose(shot: Shot): CameraPose {
  return { position: shot.pos, target: shot.look, fov: shot.fov, source: `flight:${shot.label}` }
}

export const homeStartCamera: CameraPose = pose(FLIGHT[0])

export const homeEndCamera: CameraPose = {
  position: [30, 2.8, 18.5],
  target: [4.5, -10, -16.6],
  fov: 31,
  source: 'playground:end-home-ourservice',
}

export const homeEntryCamera: CameraPose = homeStartCamera
export const homeExitCamera: CameraPose = homeEndCamera

const SKYLINE_IDS = ['dubai-skyline', 'petronas-skyline']

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
      durationMs: 2400,
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
      id: i === 0 ? 'home-hero' : `home-flight-${i}`,
      label: shot.label,
      atScrollProgress: shot.at,
      easing: 'linear' as const,
      camera: pose(shot),
      objects: { show: [...SKYLINE_IDS], hide: ['team-skyline'] },
    })),
    {
      id: 'home-end',
      label: 'End — team skyline (skylines stay in view)',
      atScrollProgress: 1,
      easing: 'linear',
      camera: homeEndCamera,
      lighting: { fogDensity: 0.45 },
      objects: {
        show: [...SKYLINE_IDS, 'team-skyline'],
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
      // world: centre (-40, -30), base y -35, height 70
      transform: { position: [-100, -87.5, -75], rotationY: 0, scale: 87.5 },
      fitHeight: true,
      preload: true,
    },
    {
      id: 'petronas-skyline',
      url: '/models/home/petronas-skyline.glb',
      scope: 'page',
      cloudDepth: 'middle',
      // world: centre (35, -20), base y -25, height 50
      transform: { position: [87.5, -62.5, -50], rotationY: 0, scale: 62.5 },
      fitHeight: true,
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
