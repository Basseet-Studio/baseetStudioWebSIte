// src/lib/services.ts — locale-aware service data with EN fallback.
import type { Lang, ServiceDetail } from '../types'
import { loadLocaleJson, loadLocaleJsonDir } from './content'
import { DEFAULT_LOCALE } from './locale'

export interface ServiceSummary {
  id: string
  slug: string
  title: string
  icon: string
  color: string
  gradient: string
  shortDescription: string
  tagline?: string
}

export interface ServicesIndexData {
  categories: ServiceSummary[]
  process?: Array<{ step: number; title: string; description: string }>
  cta?: { title: string; description: string; buttonText: string; buttonUrl?: string }
  [key: string]: unknown
}

export function getServicesIndexData(lang: Lang = DEFAULT_LOCALE): ServicesIndexData {
  return loadLocaleJson<ServicesIndexData>(lang, 'services.json')
}

export function getServicesIndex(lang: Lang = DEFAULT_LOCALE): ServiceSummary[] {
  return getServicesIndexData(lang).categories
}

export function getService(slug: string, lang: Lang = DEFAULT_LOCALE): ServiceDetail | undefined {
  const all = loadLocaleJsonDir<ServiceDetail>(lang, 'services')
  return all[slug]
}

export function getAllServices(lang: Lang = DEFAULT_LOCALE): ServiceDetail[] {
  const index = getServicesIndex(lang)
  const bySlug = loadLocaleJsonDir<ServiceDetail>(lang, 'services')
  return index.map((s) => bySlug[s.slug]).filter((s): s is ServiceDetail => Boolean(s))
}

export function getServiceSlugs(lang: Lang = DEFAULT_LOCALE): string[] {
  return getServicesIndex(lang).map((s) => s.slug)
}
