import {
  bootCloudscapeFromDom,
  getCloudscapeRuntime,
  readSceneConfigFromWindow,
} from './cloudscape-runtime'
import type { CloudSettings } from './types'

export function boot(): void {
  bootCloudscapeFromDom()
}

/** Re-sync scene when canvas persisted across view transitions. */
export async function refreshAfterNavigation(): Promise<void> {
  const runtime = getCloudscapeRuntime()
  if (!runtime) return

  if (!runtime.bridge.getIsTransitioning()) {
    runtime.scrollDriver.tick({ force: true, source: 'page-load-refresh' })
    return
  }

  const config = readSceneConfigFromWindow()
  if (!config) {
    runtime.bridge.forceEndTransition()
    runtime.scrollDriver.tick({ force: true, source: 'page-load-recovery' })
    return
  }

  await runtime.bridge.onAfterSwap(config)
}

export function setCloudscapeTheme(theme: 'day' | 'night'): void {
  import('./sky-theme').then((m) => {
    const win = window as Window & {
      __BASEET_SCENE_CONFIG__?: { clouds?: CloudSettings; lighting?: object }
    }
    const base = win.__BASEET_SCENE_CONFIG__?.clouds || {}
    if (base.syncTheme === false) return
    m.setCloudscapeTheme(theme, base)
  })
}
