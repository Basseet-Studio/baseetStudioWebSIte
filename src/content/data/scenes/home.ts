import type { CameraPose, SceneConfig } from '../../../lib/scene/types'
import {
  editorDefaultClouds,
  editorDefaultLighting,
  editorTeamSkylineTransform,
} from './editor-default'

// Playground snapshots (camera only) — start → mid → end as you scroll home.
export const homeStartCamera: CameraPose = {
  position: [-30, 3.5, 28.8],
  target: [3.5, -4.7, -30],
  fov: 31,
  source: 'playground:starting-home-hero',
}

export const homeMidCamera: CameraPose = {
  position: [-23.9, 4.2, 30],
  target: [3.5, -8.5, -16.6],
  fov: 31,
  source: 'playground:midway-home-ourservice',
}

export const homeEndCamera: CameraPose = {
  position: [30, 2.8, 18.5],
  target: [4.5, -10, -16.6],
  fov: 31,
  source: 'playground:end-home-ourservice',
}

export const homeEntryCamera: CameraPose = homeStartCamera
export const homeExitCamera: CameraPose = homeEndCamera

/**
 * City skylines rising out of the cloud sea (hero → services).
 * Positions are in object-root units (x WORLD_SCALE 0.4 = world units).
 * normalize: true fits each model to a 2-unit box, then `scale` multiplies.
 * Starting values sit on the hero camera's line of sight — fine-tune with the
 * Cloud Playground "Objects" panel and paste the copied transform here.
 */
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
    {
      id: 'home-hero',
      label: 'Hero — start shot',
      atScrollProgress: 0,
      camera: homeStartCamera,
      objects: {
        show: [...SKYLINE_IDS],
        hide: ['team-skyline'],
      },
    },
    {
      id: 'home-features',
      label: 'Our services — midway shot',
      atScrollProgress: 0.5,
      easing: 'easeInOutCubic',
      camera: homeMidCamera,
      objects: {
        show: [...SKYLINE_IDS],
        hide: ['team-skyline'],
      },
    },
    {
      id: 'home-end',
      label: 'End — end shot',
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
      transform: { position: [-24.8, 0, -16.2], rotationY: 0, scale: 14 },
      normalize: true,
      preload: true,
    },
    {
      id: 'petronas-skyline',
      url: '/models/home/petronas-skyline.glb',
      scope: 'page',
      cloudDepth: 'middle',
      transform: { position: [-8.9, -2, -18.7], rotationY: 0, scale: 9 },
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
