import type { SceneConfig } from '../../../lib/scene/types'
import {
  editorDefaultCamera,
  editorDefaultClouds,
  editorDefaultLighting,
} from './editor-default'

// ─── DEFAULT ENTRY — editor export pose (scroll 0, before any GLB loads) ───
export const defaultEntryCamera = editorDefaultCamera

// ─── DEFAULT SCENE — static camera, no GLB objects ───
export const defaultSceneConfig: SceneConfig = {
  schemaVersion: 1,
  pageId: 'default',
  renderer: 'cloudscape',
  durationSeconds: 10,
  scrollMode: 'global',
  entryCamera: defaultEntryCamera,
  exitCamera: defaultEntryCamera,
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
      id: 'default',
      label: 'Default — editor entry pose',
      atScrollProgress: 0,
      camera: defaultEntryCamera,
    },
  ],
  objects: [],
}
