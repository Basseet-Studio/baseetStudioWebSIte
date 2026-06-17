// src/lib/services.ts
//
// Single entry point for service data. Mirrors src/lib/projects.ts:
//   - services.json holds the lightweight index (cards on /services).
//   - services/<slug>.json holds the full per-service detail (hero, sub-services,
//     process, deliverables, tech, FAQ) consumed by the /services/<slug> pages.
//
// Consumers:
//   - The /services index page calls getServicesIndex() to render cards.
//   - The /services/<slug> dynamic route calls getService(slug) for full data.
//   - getAllServices() powers related-services lookups on detail pages.

import type { Service, ServiceDetail } from '../types'
import servicesIndexRaw from '../content/data/services.json'

// Lightweight summary used by the /services index page.
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

// Eagerly load every per-service file at build time. Vite resolves the glob
// into a static map, so this costs zero at runtime.
const serviceFiles = import.meta.glob<{ default: ServiceDetail }>(
  '../content/data/services/*.json',
  { eager: true }
)

const servicesBySlug: Record<string, ServiceDetail> = {}
for (const [path, mod] of Object.entries(serviceFiles)) {
  const filename = path.split('/').pop() ?? ''
  const slug = filename.replace(/\.json$/, '')
  servicesBySlug[slug] = (mod.default ?? (mod as unknown as ServiceDetail)) as ServiceDetail
}

const index = (servicesIndexRaw as { categories: ServiceSummary[] }).categories

/** Ordered list of service summaries for the /services index page. */
export function getServicesIndex(): ServiceSummary[] {
  return index
}

/** Full service detail for a given slug, or undefined if it doesn't exist. */
export function getService(slug: string): ServiceDetail | undefined {
  return servicesBySlug[slug]
}

/** Every service with full data, in the same order as the index. */
export function getAllServices(): ServiceDetail[] {
  return index
    .map((summary) => servicesBySlug[summary.slug])
    .filter((s): s is ServiceDetail => Boolean(s))
}

/** All known service slugs — handy for static path generation. */
export function getServiceSlugs(): string[] {
  return index.map((s) => s.slug)
}
