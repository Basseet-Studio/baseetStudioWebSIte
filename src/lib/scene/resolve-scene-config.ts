import { homeSceneConfig } from '../../content/data/scenes/home'
import { defaultThreeAnchorSceneConfig } from '../../content/data/scenes/pages'
import {
  clientsSceneConfig,
  contactSceneConfig,
  projectsSceneConfig,
  servicesSceneConfig,
} from '../../content/data/scenes/pages'
import type { SceneConfig } from './types'

/**
 * Resolve a scene config for a pathname.
 *
 * Locale prefixes are stripped first, then the remaining path is prefix-
 * matched against the page families so detail routes (e.g. /services/web,
 * /projects/geeb) inherit their family's camera path.
 */
export function resolveSceneConfig(pathname: string): SceneConfig {
  const stripped = stripLocaleAndTrailingSlash(pathname)

  if (stripped === '/') return homeSceneConfig
  if (stripped === '/services' || stripped.startsWith('/services/')) return servicesSceneConfig
  if (stripped === '/clients' || stripped.startsWith('/clients/')) return clientsSceneConfig
  if (stripped === '/contact') return contactSceneConfig
  if (stripped === '/projects' || stripped.startsWith('/projects/')) return projectsSceneConfig

  return defaultThreeAnchorSceneConfig
}

const LOCALE_PREFIXES = ['/ar', '/ur', '/hi', '/fil']

function stripLocaleAndTrailingSlash(pathname: string): string {
  let p = pathname.replace(/\/$/, '') || '/'
  for (const locale of LOCALE_PREFIXES) {
    if (p === locale) return '/'
    if (p.startsWith(`${locale}/`)) return p.slice(locale.length) || '/'
  }
  return p
}
