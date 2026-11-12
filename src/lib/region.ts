// Region profiles: country code → languages, default language, and contact.
// The detector does not import this. Callers pass the country code in.
import type { Lang } from '../types'
import { isLang } from './locale.ts'

export interface RegionContact {
  email: string
  email_link: string
  phone: string
  phone_display: string
  phone_link: string
  whatsapp: string
  whatsapp_link: string
  address: string
  maps_link: string
}

/** One country block from links.json. Extra keys are kept for future features. */
export interface RegionCountryConfig {
  languages?: string[]
  defaultLanguage?: string
  contact?: Partial<RegionContact>
  [key: string]: unknown
}

export interface RegionSource {
  contact: Partial<RegionContact> & {
    email: string
    phone: string
    whatsapp: string
    whatsapp_link: string
    address: string
  }
  regions?: {
    default?: string
    countries?: Record<string, RegionCountryConfig>
  }
}

export interface ResolvedRegion {
  /** The visitor's country, or null when it is unknown. */
  countryCode: string | null
  /** The profile that was applied. UAE when the country has no profile. */
  regionCode: string
  languages: Lang[]
  defaultLanguage: Lang
  contact: RegionContact
  /** The country's config object, including any future keys. */
  raw: RegionCountryConfig
}

const CONTACT_KEYS = [
  'email',
  'email_link',
  'phone',
  'phone_display',
  'phone_link',
  'whatsapp',
  'whatsapp_link',
  'address',
  'maps_link',
] as const

function filled(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function baseContact(source: RegionSource): RegionContact {
  const contact = source.contact
  const phone = filled(contact.phone) ?? ''
  const whatsapp = filled(contact.whatsapp) ?? phone
  const email = filled(contact.email) ?? ''
  return {
    email,
    email_link: filled(contact.email_link) ?? (email ? `mailto:${email}` : ''),
    phone,
    phone_display: filled(contact.phone_display) ?? phone,
    phone_link: filled(contact.phone_link) ?? (phone ? `tel:${phone}` : ''),
    whatsapp,
    whatsapp_link: filled(contact.whatsapp_link) ?? '',
    address: filled(contact.address) ?? '',
    maps_link: filled(contact.maps_link) ?? '',
  }
}

function mergeContact(base: RegionContact, override: Partial<RegionContact> | undefined): RegionContact {
  if (!override) return base
  const next = { ...base }
  for (const key of CONTACT_KEYS) {
    const value = filled(override[key])
    if (value) next[key] = value
  }
  return next
}

function languagesOf(config: RegionCountryConfig | undefined, fallback: Lang[]): Lang[] {
  const listed = (config?.languages ?? []).filter(isLang)
  return listed.length > 0 ? listed : fallback
}

function defaultLanguageOf(config: RegionCountryConfig | undefined, languages: Lang[], fallback: Lang): Lang {
  const requested = config?.defaultLanguage
  if (requested && isLang(requested) && languages.includes(requested)) return requested
  if (languages.includes(fallback)) return fallback
  return languages[0] ?? fallback
}

/**
 * Resolve the region profile for a visitor country code.
 * Unknown countries and a null code use the configured default (UAE).
 * Empty contact overrides are ignored, so a blank Malaysia number keeps the UAE number.
 */
export function resolveRegion(code: string | null, source: RegionSource): ResolvedRegion {
  const countries = source.regions?.countries ?? {}
  const fallbackCode = filled(source.regions?.default)?.toUpperCase() || 'AE'
  const fallbackConfig = countries[fallbackCode]
  const fallbackLanguages = languagesOf(fallbackConfig, ['en'])
  const fallbackLanguage = defaultLanguageOf(fallbackConfig, fallbackLanguages, 'en')
  const contact = baseContact(source)

  const normalized = filled(code)?.toUpperCase() ?? ''
  const matched = normalized && countries[normalized] ? normalized : ''
  const regionCode = matched || fallbackCode
  const config = countries[regionCode]

  const languages = languagesOf(config, fallbackLanguages)
  const defaultLanguage = defaultLanguageOf(config, languages, fallbackLanguage)

  return {
    countryCode: normalized ? normalized : null,
    regionCode,
    languages,
    defaultLanguage,
    contact: mergeContact(contact, config?.contact),
    raw: config ?? { languages, defaultLanguage },
  }
}
