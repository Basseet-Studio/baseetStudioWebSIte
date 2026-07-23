// Locale-aware content loading with EN fallback.
// Content lives in src/content/locales/{lang}/…
import type { Lang } from '../types'
import { DEFAULT_LOCALE } from './locale'

type JsonModule = { default: unknown }

const localeJsonModules = import.meta.glob<{ default: unknown }>(
  '../content/locales/*/**/*.json',
  { eager: true }
)

function modulePath(lang: Lang, relativePath: string): string {
  // relativePath like "home.json" or "services/web.json"
  return `../content/locales/${lang}/${relativePath}`
}

function readModule(lang: Lang, relativePath: string): unknown | undefined {
  const path = modulePath(lang, relativePath)
  const mod = localeJsonModules[path] as JsonModule | undefined
  if (!mod) return undefined
  return mod.default ?? mod
}

/**
 * Load a JSON content file for a locale, falling back to English when missing.
 */
export function loadLocaleJson<T>(lang: Lang, relativePath: string): T {
  const localized = readModule(lang, relativePath)
  if (localized !== undefined) return localized as T
  if (lang !== DEFAULT_LOCALE) {
    const fallback = readModule(DEFAULT_LOCALE, relativePath)
    if (fallback !== undefined) return fallback as T
  }
  throw new Error(`Missing content: locales/${lang}/${relativePath} (and no en fallback)`)
}

/**
 * Eager map of `services/*.json` (or `projects/*.json`) for a locale,
 * falling back file-by-file to English.
 */
export function loadLocaleJsonDir<T>(
  lang: Lang,
  dir: 'services' | 'projects'
): Record<string, T> {
  const result: Record<string, T> = {}
  const prefix = `../content/locales/${DEFAULT_LOCALE}/${dir}/`
  for (const path of Object.keys(localeJsonModules)) {
    if (!path.startsWith(prefix)) continue
    const filename = path.slice(prefix.length)
    if (!filename.endsWith('.json') || filename.includes('/')) continue
    const slug = filename.replace(/\.json$/, '')
    result[slug] = loadLocaleJson<T>(lang, `${dir}/${filename}`)
  }
  return result
}
