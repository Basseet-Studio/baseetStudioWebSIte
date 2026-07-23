// Locale helpers for multi-locale SEO routing (en unprefixed; ar/ur/hi/fil prefixed).
import type { Lang } from '../types'

export const LOCALES: readonly Lang[] = ['en', 'ar', 'ur', 'hi', 'fil'] as const

/** Locales that get a URL prefix (everything except default EN). */
export const PREFIXED_LOCALES: readonly Lang[] = ['ar', 'ur', 'hi', 'fil'] as const

export const DEFAULT_LOCALE: Lang = 'en'

const OG_LOCALE: Record<Lang, string> = {
  en: 'en_AE',
  ar: 'ar_AE',
  ur: 'ur_PK',
  hi: 'hi_IN',
  fil: 'fil_PH',
}

const HTML_LANG: Record<Lang, string> = {
  en: 'en',
  ar: 'ar',
  ur: 'ur',
  hi: 'hi',
  fil: 'fil',
}

const IN_LANGUAGE: Record<Lang, string> = {
  en: 'en-AE',
  ar: 'ar-AE',
  ur: 'ur-PK',
  hi: 'hi-IN',
  fil: 'fil-PH',
}

const LOCALE_LABEL: Record<Lang, string> = {
  en: 'English',
  ar: 'العربية',
  ur: 'اردو',
  hi: 'हिन्दी',
  fil: 'Filipino',
}

export function isLang(value: string): value is Lang {
  return (LOCALES as readonly string[]).includes(value)
}

export function isRtl(lang: Lang): boolean {
  return lang === 'ar' || lang === 'ur'
}

export function htmlLang(lang: Lang): string {
  return HTML_LANG[lang]
}

export function ogLocale(lang: Lang): string {
  return OG_LOCALE[lang]
}

export function inLanguage(lang: Lang): string {
  return IN_LANGUAGE[lang]
}

export function localeLabel(lang: Lang): string {
  return LOCALE_LABEL[lang]
}

/** `/ar` for ar, empty string for en. */
export function langPrefix(lang: Lang): string {
  return lang === DEFAULT_LOCALE ? '' : `/${lang}`
}

/**
 * Strip a leading locale prefix from a pathname.
 * `/ur/services/web/` → `/services/web/`, `/ar/` → `/`, `/services/` → `/services/`
 */
export function stripLocalePrefix(pathname: string): string {
  let path = pathname.replace(/\/$/, '') || '/'
  const match = path.match(/^\/(ar|ur|hi|fil)(?=\/|$)/)
  if (match) {
    path = path.slice(match[0].length) || '/'
  }
  if (path === '/') return '/'
  return path.endsWith('/') ? path : `${path}/`
}

/** Detect lang from pathname (`/ur/services/` → `ur`). */
export function langFromPathname(pathname: string): Lang {
  const stripped = pathname.replace(/\/$/, '') || '/'
  const match = stripped.match(/^\/(ar|ur|hi|fil)(\/|$)/)
  if (match && isLang(match[1])) return match[1]
  return DEFAULT_LOCALE
}

/**
 * Build a localized path from an EN-relative path.
 * `localizedPath('ar', '/services/web/')` → `/ar/services/web/`
 * `localizedPath('en', '/services/web/')` → `/services/web/`
 */
export function localizedPath(lang: Lang, path: string): string {
  const bare = stripLocalePrefix(path)
  const normalized =
    bare === '/' ? '/' : bare.endsWith('/') ? bare : `${bare}/`
  if (lang === DEFAULT_LOCALE) return normalized
  if (normalized === '/') return `/${lang}/`
  return `/${lang}${normalized}`
}

/** Absolute URL for a locale + bare path. */
export function localizedUrl(siteOrigin: string, lang: Lang, barePath: string): string {
  const origin = siteOrigin.replace(/\/$/, '')
  return `${origin}${localizedPath(lang, barePath)}`
}

/** All hreflang alternate entries for a bare (EN) path. */
export function hreflangAlternates(
  siteOrigin: string,
  barePath: string
): Array<{ lang: Lang | 'x-default'; href: string }> {
  const origin = siteOrigin.replace(/\/$/, '')
  const entries: Array<{ lang: Lang | 'x-default'; href: string }> = LOCALES.map((lang) => ({
    lang,
    href: `${origin}${localizedPath(lang, barePath)}`,
  }))
  entries.push({ lang: 'x-default', href: `${origin}${localizedPath('en', barePath)}` })
  return entries
}

/** getStaticPaths helper: one entry per prefixed locale. */
export function prefixedLocaleParams(): Array<{ params: { locale: Lang } }> {
  return PREFIXED_LOCALES.map((locale) => ({ params: { locale } }))
}

/** Validate `[locale]` param; throw if invalid (for getStaticPaths consumers). */
export function parseLocaleParam(locale: string | undefined): Lang {
  if (locale && isLang(locale) && locale !== 'en') return locale
  throw new Error(`Invalid locale param: ${locale}`)
}
