// src/lib/projects.ts — locale-aware project data with EN fallback.
import type { Lang, Project } from '../types'
import { loadLocaleJson, loadLocaleJsonDir } from './content'
import { DEFAULT_LOCALE } from './locale'

export type ProjectIndexTier = 'anchor' | 'flagship' | 'more'
export type PreviewInteractive = 'matrix' | 'moneybox' | 'numu' | 'invexo'

export interface ProjectSummary {
  slug: string
  name: string
  tagline: string
  color: string
  gradient: string
  status: string
  iconClass?: string | null
  icon?: string | null
  platforms: Array<{ name: string; icon: string }>
  indexHidden?: boolean
  indexTier?: ProjectIndexTier
  previewImage?: string
  previewVideo?: string | null
  previewInteractive?: PreviewInteractive | null
}

export interface ProjectIndexCard extends ProjectSummary {
  previewImage: string
  previewVideo?: string | null
}

function projectsIndex(lang: Lang): ProjectSummary[] {
  return loadLocaleJson<ProjectSummary[]>(lang, 'projects.json')
}

function projectsBySlug(lang: Lang): Record<string, Project> {
  return loadLocaleJsonDir<Project>(lang, 'projects')
}

export function getProjectsIndex(lang: Lang = DEFAULT_LOCALE): ProjectSummary[] {
  return projectsIndex(lang)
}

function resolvePreviewImage(summary: ProjectSummary, lang: Lang): string {
  if (summary.previewImage) return summary.previewImage
  const full = projectsBySlug(lang)[summary.slug]
  if (full?.screenshots?.[0]) return full.screenshots[0]
  if (summary.icon) return summary.icon
  return ''
}

export function getProjectsForIndex(lang: Lang = DEFAULT_LOCALE): ProjectIndexCard[] {
  return projectsIndex(lang)
    .filter((p) => !p.indexHidden)
    .map((summary) => ({
      ...summary,
      previewImage: resolvePreviewImage(summary, lang),
      previewVideo: summary.previewVideo ?? null,
    }))
    .filter((p) => p.previewImage)
}

export function getProject(slug: string, lang: Lang = DEFAULT_LOCALE): Project | undefined {
  return projectsBySlug(lang)[slug]
}

export function getAllProjects(lang: Lang = DEFAULT_LOCALE): Project[] {
  const index = projectsIndex(lang)
  const bySlug = projectsBySlug(lang)
  return index.map((s) => bySlug[s.slug]).filter((p): p is Project => Boolean(p))
}

export function getProjectSlugs(lang: Lang = DEFAULT_LOCALE): string[] {
  return projectsIndex(lang).map((p) => p.slug)
}

export function getProjectsForClient(clientId: string, lang: Lang = DEFAULT_LOCALE): Project[] {
  return Object.values(projectsBySlug(lang)).filter((p) =>
    (p.clientIds ?? []).includes(clientId)
  )
}
