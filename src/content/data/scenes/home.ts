import type { CameraPose, SceneConfig } from '../../../lib/scene/types'
import {
  editorDefaultCamera,
  editorDefaultClouds,
  editorDefaultLighting,
  editorTeamSkylineTransform,
} from './editor-default'

// ─── DEFAULT ENTRY (editor pose — before scroll / before GLB loads) ───
export const homeEntryCamera: CameraPose = {
  ...editorDefaultCamera,
  source: 'anchor:home-hero',
}

// ─── EXIT CAMERA (navigation away from home) ───
export const homeExitCamera: CameraPose = {
  position: [0, 0.6, 3.2],
  target: [0, 0.1, 0],
  fov: 38,
  source: 'anchor:home-end',
}

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
    // ─── ANCHOR home-hero @ progress 0 — editor default pose ───
    {
      id: 'home-hero',
      label: 'Hero — editor establishing shot',
      atScrollProgress: 0,
      camera: homeEntryCamera,
      objects: { hide: ['team-skyline'] },
    },
    // ─── ANCHOR home-highlights @ 0.14 — drift right, lower altitude ───
    {
      id: 'home-highlights',
      label: 'Highlights — gentle drift',
      atScrollProgress: 0.14,
      easing: 'easeInOutCubic',
      camera: {
        position: [1.2, 1.6, 8],
        target: [0.2, 0.2, 0],
        fov: 48,
      },
    },
    // ─── ANCHOR home-features @ 0.30 — push through cloud layer ───
    {
      id: 'home-features',
      label: 'Features — push through clouds',
      atScrollProgress: 0.3,
      easing: 'easeInOutCubic',
      camera: {
        position: [2, 1.4, 6],
        target: [0, 0.4, 0],
        fov: 45,
      },
    },
    // ─── ANCHOR home-projects @ 0.48 — orbit over portfolio grid ───
    {
      id: 'home-projects',
      label: 'Projects — orbit view',
      atScrollProgress: 0.48,
      easing: 'easeInOutCubic',
      camera: {
        position: [0.5, 1.2, 5.5],
        target: [0, 0.3, 0],
        fov: 44,
      },
    },
    // ─── ANCHOR home-clients @ 0.65 — gentle pull-back ───
    {
      id: 'home-clients',
      label: 'Clients — pull back',
      atScrollProgress: 0.65,
      easing: 'easeInOutCubic',
      camera: {
        position: [-0.8, 1, 5],
        target: [0, 0.2, 0],
        fov: 42,
      },
    },
    // ─── ANCHOR home-team @ 0.85 — low pass, GLB reveal ───
    {
      id: 'home-team',
      label: 'Team — low pass + skyline',
      atScrollProgress: 0.85,
      easing: 'easeOutQuad',
      camera: {
        position: [0, 0.7, 4],
        target: [0, 0.15, 0],
        fov: 40,
      },
      lighting: { fogDensity: 0.42 },
      objects: {
        show: ['team-skyline'],
        animateIn: ['team-skyline'],
      },
    },
    // ─── ANCHOR home-end @ 1.0 — bottom hold (exit camera) ───
    {
      id: 'home-end',
      label: 'End — hold low pass',
      atScrollProgress: 1,
      easing: 'easeOutQuad',
      camera: homeExitCamera,
      lighting: { fogDensity: 0.45 },
      objects: {
        show: ['team-skyline'],
      },
    },
  ],
  objects: [
    // ─── OBJECT team-skyline — GLB in front of clouds at home-team ───
    // POSITION / scale from editor export — tune here
    {
      id: 'team-skyline',
      url: '/models/home/team-skyline.glb',
      scope: 'page',
      cloudDepth: 'middle',
      transform: editorTeamSkylineTransform,
      normalize: true,
      bindAnchor: 'home-team',
      loadAt: {
        type: 'anchor',
        anchorId: 'home-team',
        when: 'enter',
        preloadMargin: 0.06,
      },
    },
  ],
}
