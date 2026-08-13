import type { SceneConfig } from '../../../lib/scene/types'
import { defaultThreeAnchorSceneConfig } from './pages'

// ─── DEFAULT SCENE — 3-anchor drift (no longer a frozen pose) ───
// Kept as a re-export so existing imports of `defaultSceneConfig` pick up
// the chained 3-anchor path authored in pages.ts.
export const defaultSceneConfig: SceneConfig = defaultThreeAnchorSceneConfig
