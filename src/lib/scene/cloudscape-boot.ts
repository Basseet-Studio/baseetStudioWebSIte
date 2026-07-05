import { bootCloudscapeFromDom, getCloudscapeRuntime } from './cloudscape-runtime'
import type { CloudSettings } from './types'

export function boot(): void {
  bootCloudscapeFromDom()
}

/** Re-sync scroll/camera when canvas persisted across view transitions. */
export function refreshAfterNavigation(): void {
  const runtime = getCloudscapeRuntime()
  if (!runtime) return
  runtime.scrollDriver.tick({ force: true, source: 'page-load-refresh' })
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
