import ui from '../content/i18n/ui.json'
import type { Lang } from '../types'

type UiKey = keyof (typeof ui)['en']

const dictionaries = ui as Record<Lang, Record<string, string>>

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
