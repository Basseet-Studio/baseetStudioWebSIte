import type { CameraPose, SceneConfig } from '../../../lib/scene/types'
import { editorDefaultClouds, editorDefaultLighting } from './editor-default'

/**
 * Per-page-family camera paths.
 *
 * Every page gets a 3-anchor scroll path (start / mid / end). The poses are
 * authored so each page's END sits near the next page's START — navigating
 * between pages should feel like continuing a scroll, not a teleport.
 *
 * Cloud Y constraint: the shader keeps clouds in a fixed slab, so every
 * pose keeps position.y in [1.8, ~4.5] (clouds vanish above ~5, and the
 * camera dips under the floor below 1.8). FOV stays ~31 to match home.
 */

const FOV = 31

// ─── HOME (reference; end feeds into services) ────────────────────────
export const servicesStartCamera: CameraPose = {
  position: [28, 3.2, 20],
  target: [4, -8, -18],
  fov: FOV,
  source: 'page:services-start',
}
export const servicesMidCamera: CameraPose = {
  position: [18, 4.0, 26],
  target: [2, -6, -22],
  fov: FOV,
  source: 'page:services-mid',
}
export const servicesEndCamera: CameraPose = {
  position: [6, 3.0, 30],
  target: [0, -4, -28],
  fov: FOV,
  source: 'page:services-end',
}

// ─── CLIENTS (start near services end) ────────────────────────────────
export const clientsStartCamera: CameraPose = {
  position: [8, 3.0, 30],
  target: [0, -4, -28],
  fov: FOV,
  source: 'page:clients-start',
}
export const clientsMidCamera: CameraPose = {
  position: [-8, 4.0, 30],
  target: [-2, -6, -22],
  fov: FOV,
  source: 'page:clients-mid',
}
export const clientsEndCamera: CameraPose = {
  position: [-22, 3.2, 24],
  target: [-4, -8, -16],
  fov: FOV,
  source: 'page:clients-end',
}

// ─── CONTACT (start near clients end) ─────────────────────────────────
export const contactStartCamera: CameraPose = {
  position: [-24, 3.0, 22],
  target: [-4, -8, -16],
  fov: FOV,
  source: 'page:contact-start',
}
export const contactMidCamera: CameraPose = {
  position: [-28, 3.6, 18],
  target: [-6, -6, -10],
  fov: FOV,
  source: 'page:contact-mid',
}
export const contactEndCamera: CameraPose = {
  position: [-30, 3.5, 14],
  target: [-8, -4, -4],
  fov: FOV,
  source: 'page:contact-end',
}

// ─── PROJECTS (branches from near the home end) ───────────────────────
export const projectsStartCamera: CameraPose = {
  position: [26, 3.2, 22],
  target: [6, -8, -20],
  fov: FOV,
  source: 'page:projects-start',
}
export const projectsMidCamera: CameraPose = {
  position: [14, 4.2, 28],
  target: [4, -6, -24],
  fov: FOV,
  source: 'page:projects-mid',
}
export const projectsEndCamera: CameraPose = {
  position: [-14, 3.4, 28],
  target: [2, -8, -28],
  fov: FOV,
  source: 'page:projects-end',
}

// ─── DEFAULT (leftover / 404) — gentle 3-anchor drift ─────────────────
export const defaultStartCamera: CameraPose = {
  position: [12.1, 2.1, 4.7],
  target: [-10.8, -0.1, 0],
  fov: FOV,
  source: 'page:default-start',
}
export const defaultMidCamera: CameraPose = {
  position: [6, 3.0, 8],
  target: [-4, -2, -6],
  fov: FOV,
  source: 'page:default-mid',
}
export const defaultEndCamera: CameraPose = {
  position: [0, 3.4, 12],
  target: [0, -3, -10],
  fov: FOV,
  source: 'page:default-end',
}

function buildPageConfig(
  pageId: string,
  start: CameraPose,
  mid: CameraPose,
  end: CameraPose,
): SceneConfig {
  return {
    schemaVersion: 1,
    pageId,
    renderer: 'cloudscape',
    durationSeconds: 10,
    scrollMode: 'global',
    entryCamera: start,
    exitCamera: end,
    clouds: { ...editorDefaultClouds },
    lighting: { ...editorDefaultLighting },
    transition: {
      entry: { durationMs: 1200, easing: 'easeInOutCubic', from: 'exit-camera' },
      exit: { durationMs: 800, easing: 'easeInQuad', to: 'entry-camera' },
    },
    scrollAnchors: [
      { id: `${pageId}-start`, label: `${pageId} — start`, atScrollProgress: 0, camera: start },
      {
        id: `${pageId}-mid`,
        label: `${pageId} — mid`,
        atScrollProgress: 0.5,
        easing: 'easeInOutCubic',
        camera: mid,
      },
      {
        id: `${pageId}-end`,
        label: `${pageId} — end`,
        atScrollProgress: 1,
        easing: 'easeInOutCubic',
        camera: end,
      },
    ],
    objects: [],
  }
}

export const servicesSceneConfig: SceneConfig = buildPageConfig(
  'services',
  servicesStartCamera,
  servicesMidCamera,
  servicesEndCamera,
)
export const clientsSceneConfig: SceneConfig = buildPageConfig(
  'clients',
  clientsStartCamera,
  clientsMidCamera,
  clientsEndCamera,
)
export const contactSceneConfig: SceneConfig = buildPageConfig(
  'contact',
  contactStartCamera,
  contactMidCamera,
  contactEndCamera,
)
export const projectsSceneConfig: SceneConfig = buildPageConfig(
  'projects',
  projectsStartCamera,
  projectsMidCamera,
  projectsEndCamera,
)
export const defaultThreeAnchorSceneConfig: SceneConfig = buildPageConfig(
  'default',
  defaultStartCamera,
  defaultMidCamera,
  defaultEndCamera,
)
