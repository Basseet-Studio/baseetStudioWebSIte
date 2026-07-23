// Home / team locale loaders.
import type { Lang } from '../types'
import { loadLocaleJson } from './content'
import { DEFAULT_LOCALE } from './locale'

export function getHomeData(lang: Lang = DEFAULT_LOCALE) {
  return loadLocaleJson<Record<string, unknown>>(lang, 'home.json')
}

export function getTeamData(lang: Lang = DEFAULT_LOCALE) {
  return loadLocaleJson<{ members?: unknown[] } & Record<string, unknown>>(lang, 'team.json')
}

export function getFooterData(lang: Lang = DEFAULT_LOCALE) {
  return loadLocaleJson<{
    links: Array<{ label: string; url: string; i18nKey?: string }>
  }>(lang, 'footer.json')
}
