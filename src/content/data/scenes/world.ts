import type { CameraPose, SceneConfig, SceneObject, Vec3 } from '../../../lib/scene/types'
import { editorDefaultClouds, editorDefaultLighting } from './editor-default'

/**
 * ONE WORLD, ONE LANDMARK
 *
 * The visitor's landmark stands at ORBIT_CENTER for the whole site:
 *   UAE (and anyone unknown) -> Dubai skyline
 *   Malaysia                 -> Petronas skyline
 *   Saudi Arabia             -> Riyadh skyline (Kingdom Centre, Al Faisaliah)
 * (picked at runtime by lib/scene/landmark.ts — all registered, one shows)
 *
 * Every page is a slice of an orbit around it. Scrolling moves along that
 * page's slice; navigating flies around the circle to the next page's slice.
 * Only the angle / height / pitch change — the landmark never disappears.
 *
 *   cloud carpets (see lib/scene/cloud-shader.ts)
 *     high  y ≈ 12.5 … 17.5   (patchy)
 *     mid   y ≈ -2.4 … 3.3
 *     low   y ≈ -16.5 … -9.5  (covers the satellite ground, with gaps)
 *   Dubai       height 70, base y -35 -> top y 35
 *   Petronas    height 50, base y -25 -> top y 25
 *   Riyadh      height 52, base y -26 -> top y 26
 *
 * Camera heights: the camera NEVER goes below the mid deck.
 *   CAMERA_FLOOR (5) is enforced in camera-motion.ts + page flights.
 *   skim the deck       5 … 6
 *   between mid & high  6 … 11
 *   above everything    19+
 *
 * Page slices (degrees around the landmark):
 *   home -40…60 · services 70…130 · projects 140…200 · clients 210…260
 *   contact 270…310 · other 320…350
 */
export const ORBIT_CENTER: Vec3 = [0, 0, 0]

/** Lowest camera altitude anywhere (just above the mid cloud deck top ~3.3). */
export const CAMERA_FLOOR = 5

export const LANDMARK_IDS = {
  AE: 'dubai-skyline',
  MY: 'petronas-skyline',
  SA: 'riyadh-skyline',
} as const

/** fitHeight: world height = scale x 0.8, world base y = position[1] x 0.4 */
export const LANDMARK_OBJECTS = [
  {
    id: LANDMARK_IDS.AE,
    url: '/models/home/dubai-skyline.glb',
    scope: 'global',
    cloudDepth: 'middle',
    transform: { position: [0, -87.5, 0], rotationY: 0, scale: 87.5 },
    fitHeight: true,
    preload: false,
  },
  {
    id: LANDMARK_IDS.MY,
    url: '/models/home/petronas-skyline.glb',
    scope: 'global',
    cloudDepth: 'middle',
    transform: { position: [0, -62.5, 0], rotationY: 0, scale: 62.5 },
    fitHeight: true,
    preload: false,
  },
  {
    id: LANDMARK_IDS.SA,
    url: '/models/home/riyadh-skyline.glb',
    scope: 'global',
    cloudDepth: 'middle',
    transform: { position: [0, -65, 0], rotationY: 0, scale: 65 },
    fitHeight: true,
    preload: false,
  },
] as unknown as SceneObject[]

export interface OrbitShot {
  id: string
  at: number
  /** degrees around the landmark */
  angle: number
  /** distance from the landmark (world units) */
  radius: number
  /** camera altitude */
  height: number
  /** height the camera looks at (higher = pitched up) */
  lookY: number
  fov: number
  /** shifts framing so the landmark sits right of the text (world units) */
  frame?: number
}

export const DEFAULT_FRAME = 10

export function orbitPose(shot: OrbitShot, source = `orbit:${shot.id}`): CameraPose {
  const a = (shot.angle * Math.PI) / 180
  const sin = Math.sin(a)
  const cos = Math.cos(a)
  const frame = shot.frame ?? DEFAULT_FRAME
  // camera-right on the ground plane = (cos a, 0, -sin a); aim left of centre
  return {
    position: [ORBIT_CENTER[0] + sin * shot.radius, shot.height, ORBIT_CENTER[2] + cos * shot.radius],
    target: [ORBIT_CENTER[0] - cos * frame, shot.lookY, ORBIT_CENTER[2] + sin * frame],
    fov: shot.fov,
    source,
  }
}

export function buildOrbitScene(pageId: string, shots: OrbitShot[]): SceneConfig {
  const poses = shots.map((s) => orbitPose(s))
  return {
    schemaVersion: 1,
    pageId,
    renderer: 'cloudscape',
    durationSeconds: 10,
    scrollMode: 'global',
    entryCamera: poses[0],
    exitCamera: poses[poses.length - 1],
    clouds: { ...editorDefaultClouds },
    lighting: { ...editorDefaultLighting },
    transition: {
      entry: { durationMs: 2400, easing: 'easeInOutCubic', from: 'exit-camera' },
      exit: { durationMs: 800, easing: 'easeInQuad', to: 'entry-camera' },
    },
    scrollAnchors: shots.map((s, i) => ({
      id: s.id,
      label: `${pageId} — ${s.id}`,
      atScrollProgress: s.at,
      // Ease in/out per segment: the camera settles on each section and moves
      // quickly between them, so it spends little time INSIDE a cloud carpet.
      easing: 'easeInOutCubic' as const,
      camera: poses[i],
    })),
    objects: [...LANDMARK_OBJECTS],
  } as SceneConfig
}
