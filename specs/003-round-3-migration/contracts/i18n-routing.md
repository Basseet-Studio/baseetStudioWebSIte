# Contract: AR Mirror Route Tree

**Files**: 24 new files under `baseetstudiosite2/src/pages/ar/`
**Type**: Astro page files (mirror of `src/pages/*.astro` and `src/pages/projects/*.astro`)
**Trigger**: Built by Astro at build time → produces `dist/ar/...` HTML files
**Output**: AR-language versions of every EN page, accessible at `/ar/...` URLs

## Purpose

Enable the language switcher to function. The current `LanguageSwitcher.astro` prepends `/ar` to the current path and links to it, but no `src/pages/ar/` tree exists — so every AR URL returns 404. This contract specifies the file structure and per-file pattern for the AR mirror routes.

## Tree to create

```
src/pages/ar/
├── index.astro              → dist/ar/index.html
├── services.astro           → dist/ar/services/index.html
├── clients.astro            → dist/ar/clients/index.html
├── contact.astro            → dist/ar/contact/index.html
├── 404.astro                → dist/ar/404.html
└── projects/
    ├── index.astro          → dist/ar/projects/index.html
    ├── chopshop.astro       → dist/ar/projects/chopshop.html
    ├── deshikitchen.astro
    ├── matrix.astro
    ├── medev.astro
    ├── moneybox.astro
    ├── numu.astro
    ├── zaryn.astro
    ├── photorestore-ai.astro
    ├── medical-education-app.astro
    ├── nss-virtual-education-fair.astro
    ├── bd-railway-automated-timetable.astro
    ├── malaysian-business-websites.astro   (12 project files total)
    └── [slug]/
        ├── index.astro      → dist/ar/projects/{slug}/index.html
        ├── features.astro   → dist/ar/projects/{slug}/features/index.html
        ├── demo.astro       → dist/ar/projects/{slug}/demo/index.html
        └── terms.astro      → dist/ar/projects/{slug}/terms/index.html
```

**Total**: 24 new files (5 root + 1 projects/index + 12 project pages + 4 [slug] subpages = 22... recalculate: 5 + 1 + 12 + 4 = 22).

## Per-file pattern

Each AR file is a thin wrapper. For a non-project page, e.g. `src/pages/services.astro`:

```astro
---
// src/pages/ar/services.astro
import Page from '../../layouts/Page.astro'
import servicesData from '../../content/data/services.json'
import { t } from '../../i18n/utils'

const lang = 'ar' as const
const title = t(lang, 'services_title')
---
<Page title={title} section="services" lang={lang}>
  <section style="padding:100px 24px 64px;text-align:center;">
    <h1>{t(lang, 'services_heading')}</h1>
    <p>{t(lang, 'services_subtitle')}</p>
  </section>

  {servicesData.map(category => (
    <div>
      <h2>{t(lang, category.titleKey)}</h2>
      <p>{t(lang, category.bodyKey)}</p>
    </div>
  ))}
</Page>
```

**For a project subpage**, e.g. `src/pages/ar/projects/[slug]/index.astro`:

```astro
---
// src/pages/ar/projects/[slug]/index.astro
import ProjectLayout from '../../../../layouts/Project.astro'
import projects from '../../../../content/data/projects.json'
import { t } from '../../../../i18n/utils'
import type { Lang, Project } from '../../../../types'

export function getStaticPaths() {
  return projects
    .filter(p => p.navItems && p.navItems.length > 0)
    .map(p => ({ params: { slug: p.slug } }))
}

const slug = Astro.params.slug as string
const project = projects.find(p => p.slug === slug) as Project | undefined
if (!project) return Astro.redirect('/ar/404')

const lang: Lang = 'ar'
---
<ProjectLayout
  title={`${project.name} — Baseet Studio`}
  slug={project.slug}
  projectColor={project.color}
  projectGradient={project.gradient}
  projectName={project.name}
  projectNavItems={project.navItems}
  projectNavMeta={project.navMetaItems}
  lang={lang}
>
  <!-- Same body as the EN file, but with `lang="ar"` in the ProjectLayout props above.
       All visible text strings inside are passed through t(lang, 'key'). -->
</ProjectLayout>
```

## Rules

1. **Layouts and components are NOT duplicated** — both EN and AR files import the same `Page.astro`, `Project.astro`, `Base.astro` layouts. Only the `lang` prop differs.

2. **Data files are NOT duplicated** — both EN and AR files import the same `*.json` from `src/content/data/`. The data is language-agnostic; only the displayed strings differ via the `t(lang, key)` function.

3. **All user-visible text must go through `t(lang, 'key')`** — no hardcoded English in AR files. If a translation key is missing in `ar.json`, the function falls back to `en.json[key]`, then to the key itself (per `i18n/utils.ts`).

4. **Path depth in imports increases by one** — because AR files are one level deeper than EN files (`pages/ar/foo.astro` vs `pages/foo.astro`), the relative import paths to `layouts/`, `components/`, `content/`, and `types/` need one extra `../`.

5. **Project subpage `[slug]/getStaticPaths()` is identical** to the EN version — both generate 8 static paths (one per project with `navItems`).

6. **No new translation keys in `ar.json`** for this round — per the active "localise this later" rule, the existing keys are reused. If a new string appears in an AR file, it falls back to the English key value. This is acceptable for round 3; a follow-up round can do proper AR translations.

7. **No new components in `src/components/`** — the AR pages use the same shared components as the EN pages. Only the data prop and the surrounding wrapper differ.

## Edge cases

### 404 handling

- AR `404.astro` is structurally identical to EN `404.astro` but with `lang="ar"` prop and a `dir="rtl"` rendered via `Base.astro`.
- `Astro.redirect('/ar/404')` in the `[slug]/getStaticPaths` redirect block (per existing pattern) ensures unknown project slugs land on the AR 404.

### Footer project links

- The footer `navLinks` in `Footer.astro` are built with `lang === 'ar' ? '/ar' + link.url : link.url`. When the user is on `/ar/services/`, the nav links correctly point to `/ar/projects/`, `/ar/contact/`, etc.
- The project subpage nav builder in `AppBar.astro` (after the fix in this round) produces `/ar/projects/{slug}/features/` etc. — works from any starting page.

### Cross-language links

- If a page in `/ar/...` links to a resource that only exists in EN (e.g. an external project page), the link should NOT be wrapped with `/ar/` prefix. The `lang` prop tells the layout to render `dir="rtl"` on the wrapper, but the user can still navigate to EN-only pages.

## Verification

```bash
# 1. Build produces all expected AR HTML files
cd baseetstudiosite2
npm run build
test -f dist/ar/index.html                              || echo MISSING: ar/index.html
test -f dist/ar/services/index.html                     || echo MISSING: ar/services/index.html
test -f dist/ar/clients/index.html                      || echo MISSING: ar/clients/index.html
test -f dist/ar/contact/index.html                      || echo MISSING: ar/contact/index.html
test -f dist/ar/404.html                                || echo MISSING: ar/404.html
test -f dist/ar/projects/index.html                     || echo MISSING: ar/projects/index.html
for slug in zaryn medev chopshop deshikitchen moneybox numu matrix photorestore-ai medical-education-app nss-virtual-education-fair bd-railway-automated-timetable malaysian-business-websites; do
  test -f "dist/ar/projects/${slug}.html"               || echo MISSING: ar/projects/${slug}.html
  test -f "dist/ar/projects/${slug}/index.html"        || echo MISSING: ar/projects/${slug}/index.html
  test -f "dist/ar/projects/${slug}/features/index.html" || echo MISSING: ar/projects/${slug}/features/index.html
  test -f "dist/ar/projects/${slug}/demo/index.html"     || echo MISSING: ar/projects/${slug}/demo/index.html
  test -f "dist/ar/projects/${slug}/terms/index.html"    || echo MISSING: ar/projects/${slug}/terms/index.html
done

# 2. AR HTML has correct lang and dir
grep -l 'lang="ar"' dist/ar/index.html
grep -l 'dir="rtl"' dist/ar/index.html
```

Expected: zero `MISSING` lines, both grep commands return `dist/ar/index.html`.

## Performance

- Adds ~22 static HTML files to the build output
- Each AR file is similar in size to its EN sibling (~30-50 KB depending on the page)
- Total AR output: ~1 MB additional
- Build time increases by ~10-15 seconds (Astro parallelises the page builds)
- No runtime cost — these are static files served as-is by the CDN

## Why mirror tree and not `getStaticPaths` locale switching

Astro's `getStaticPaths` works **inside** a single page file. It can generate multiple `params` for one route (e.g. 12 project pages from one `[slug].astro`), but it cannot generate an entirely separate route tree at `/ar/...` from a single EN file. The mirror tree is the canonical Astro i18n pattern (see [Astro docs → Recipes → i18n](https://docs.astro.build/en/recipes/i18n/)).

Alternatives that were considered and rejected:
- **i18n routing middleware**: requires `output: 'server'` or `output: 'hybrid'`, breaking the SSG model
- **Client-side language swap (JS-only)**: breaks SEO and produces no real `/ar/...` URL
- **Single EN file with conditional rendering**: doubles the JS payload, harder to maintain, harder to test
