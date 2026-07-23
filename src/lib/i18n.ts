import uiEn from '../content/locales/en/ui.json'
import uiAr from '../content/locales/ar/ui.json'
import uiUr from '../content/locales/ur/ui.json'
import uiHi from '../content/locales/hi/ui.json'
import uiFil from '../content/locales/fil/ui.json'
import type { Lang } from '../types'

type UiDict = Record<string, string>
type UiKey = keyof typeof uiEn

const dictionaries: Record<Lang, UiDict> = {
  en: uiEn as UiDict,
  ar: uiAr as UiDict,
  ur: uiUr as UiDict,
  hi: uiHi as UiDict,
  fil: uiFil as UiDict,
}

export function t(key: UiKey | string, lang: Lang = 'en', vars?: Record<string, string>): string {
  const dict = dictionaries[lang] ?? dictionaries.en
  let text = dict[key] ?? dictionaries.en[key] ?? key
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, value)
    }
  }
  return text
}
