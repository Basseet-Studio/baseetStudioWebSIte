// project-brand.ts — real brand assets per project.
// Only files that exist in /public are listed. No generic fallback icon:
// a project without a logo shows its name alone.
const LOGOS: Record<string, string> = {
  geeb: '/projects/logos/geeb.svg',
  invexo: '/projects/logos/invexo.svg',
  matrix: '/projects/logos/matrix.svg',
  moneybox: '/projects/logos/moneybox.svg',
  numu: '/projects/logos/numu.svg',
  ordelo: '/projects/logos/ordelo.svg',
  'photorestore-ai': '/projects/logos/photorestore-ai.svg',
  zyrn: '/projects/logos/zyrn.svg',
  jemeti: '/images/projects/jemeti-icon.svg',
}

export function projectLogo(slug: string): string | null {
  return LOGOS[slug] ?? null
}

/** Screenshots are stored as absolute public paths; keep legacy bare names working. */
export function screenshotSrc(slug: string, src: string): string {
  if (/^(https?:)?\//.test(src)) return src
  return `/images/projects/${slug}/${src}`
}

/** Real outbound link, or null when the data only holds a placeholder. */
export function usableLink(href?: string | null): string | null {
  if (!href) return null
  const v = href.trim()
  if (!v || v === '#') return null
  return v
}
