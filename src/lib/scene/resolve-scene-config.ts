import { defaultSceneConfig } from '../../content/data/scenes/default'
import { homeSceneConfig } from '../../content/data/scenes/home'
import type { SceneConfig } from './types'

const routeMap: Record<string, SceneConfig> = {
  '/': homeSceneConfig,
  '/ar': homeSceneConfig,
  '/ur': homeSceneConfig,
  '/hi': homeSceneConfig,
  '/fil': homeSceneConfig,
}

/** Resolve scene config for a pathname (strips trailing slash). */
export function resolveSceneConfig(pathname: string): SceneConfig {
  const stripped = pathname.replace(/\/$/, '') || '/'
  return routeMap[stripped] ?? defaultSceneConfig
}
