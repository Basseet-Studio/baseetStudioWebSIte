// src/lib/projects.ts
//
// Single entry point for project data. The ordered list of projects lives in
// `src/content/data/projects.json` (a lightweight summary list — one entry
// per project, in display order). Full per-project data lives in
// `src/content/data/projects/<slug>.json`.
//
// Consumers:
//   - The /projects index page calls `getProjectsIndex()` to render cards.
//   - Individual project pages call `getProject(slug)` to load full data.
//   - The dynamic [slug]/[page].astro route calls `getAllProjects()` to build
//     its getStaticPaths.

import type { Project } from '../types'
import projectsIndexRaw from '../content/data/projects.json'

export type ProjectIndexTier = 'anchor' | 'flagship' | 'more'

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
}

export interface ProjectIndexCard extends ProjectSummary {
  previewImage: string
  previewVideo?: string | null
}

// Eagerly load every per-project file at build time. Vite resolves the glob
// into a static map, so this costs zero at runtime.
const projectFiles = import.meta.glob<{ default: Project }>(
  '../content/data/projects/*.json',
  { eager: true }
)

const projectsBySlug: Record<string, Project> = {}
for (const [path, mod] of Object.entries(projectFiles)) {
  const filename = path.split('/').pop() ?? ''
  const slug = filename.replace(/\.json$/, '')
  // Vite exposes the JSON contents as `default` on the module.
  projectsBySlug[slug] = (mod.default ?? (mod as unknown as Project)) as Project
}

const index = projectsIndexRaw as ProjectSummary[]

/** Ordered list of project summaries for the index page. */
export function getProjectsIndex(): ProjectSummary[] {
  return index
}

function resolvePreviewImage(summary: ProjectSummary): string {
  if (summary.previewImage) return summary.previewImage
  const full = projectsBySlug[summary.slug]
  if (full?.screenshots?.[0]) return full.screenshots[0]
  if (summary.icon) return summary.icon
  return ''
}

/** Visible projects for /projects with resolved preview media. */
export function getProjectsForIndex(): ProjectIndexCard[] {
  return index
    .filter((p) => !p.indexHidden)
    .map((summary) => ({
      ...summary,
      previewImage: resolvePreviewImage(summary),
      previewVideo: summary.previewVideo ?? null,
    }))
    .filter((p) => p.previewImage)
}

/** Full project data for a given slug, or undefined if it doesn't exist. */
export function getProject(slug: string): Project | undefined {
  return projectsBySlug[slug]
}

/** Every project with full data, in the same order as the index. */
export function getAllProjects(): Project[] {
  return index
    .map((summary) => projectsBySlug[summary.slug])
    .filter((p): p is Project => Boolean(p))
}

/** All known project slugs — handy for static path generation. */
export function getProjectSlugs(): string[] {
  return index.map((p) => p.slug)
}
