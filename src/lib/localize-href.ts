/** Prefix internal site paths with the active locale. External URLs unchanged. */
import type { Lang } from '../types'
import { localizedPath } from './locale'

export function localizeHref(lang: Lang, href: string | undefined | null): string {
  if (!href) return localizedPath(lang, '/')
  if (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#')
  ) {
    return href
  }
  return localizedPath(lang, href)
}
