# Quickstart: Site 2 Round 3 — Content, Icons & Navigation Hardening

**Phase**: 1 — Development Quickstart
**Date**: 2026-06-03
**Feature**: [spec.md](./spec.md)

## Prerequisites

- Node.js 20+ installed
- `npm install` already run in `baseetstudiosite2/`
- Phosphor SVG source at `../phosphor-icons/SVGs/` (relative to project root, **1512 icons × 6 variants = 9072 SVGs**)
- Old Hugo site at `../baseetStudioWebSIte/` for CSS / data cross-reference

## One-Time Setup

```bash
cd baseetstudiosite2

# 1. Create the new scripts directory
mkdir -p scripts src/scripts

# 2. Create the AR mirror route tree
mkdir -p src/pages/ar/projects/'[slug]'
```

## Implementation Workflow

Run these steps in order. Each step has a verification check before moving to the next.

### Step 1 — Migrate data files

**Edit `src/content/data/links.json`**:
- Verify `social.*` has 8 entries (3 of 8 are `"#"` — Facebook, YouTube, Dribbble — these will be hidden by the renderer per FR-032, no change needed)
- Verify `projects.*.{ios,android,web}` match the old Hugo `baseetStudioWebSIte/data/shared/links.yaml` `projects` section (already does — no change)
- No top-of-file TODO needed: per the user's clarification, missing Twitter URLs are handled by the hide-if-missing rule, not by URL research

**Edit `src/content/data/team.json`**:
- Remove the `_linksSource` stub at the top
- No TODO comment needed (same reason as above)

**Verify**: `node -e "console.log(JSON.parse(require('fs').readFileSync('src/content/data/links.json','utf8')).team)"` shows the 4 members with their social URLs.

### Step 2 — Copy Phosphor SVGs into the project

**Create `scripts/copy-phosphor-icons.mjs`** (see [contracts/icon-copier.md](./contracts/icon-copier.md) for the full spec).

```bash
cd baseetstudiosite2
node scripts/copy-phosphor-icons.mjs
```

Expected output:
```
[copy-phosphor-icons] Source: /Volumes/.../phosphor-icons/SVGs
[copy-phosphor-icons] Target: /Volumes/.../baseetstudiosite2/public/icons
[copy-phosphor-icons] Copying regular variants: 1419 files
[copy-phosphor-icons] Copying bold variants: 1508 files (includes clover-bold.svg)
[copy-phosphor-icons] Copying fill variants: 91 files
[copy-phosphor-icons] Done. Total: 3018 copied, 4 skipped (already present).
```

**Verify**:
```bash
ls public/icons/regular/ | wc -l    # → ~1512
ls public/icons/bold/ | wc -l       # → ~1512 (includes clover-bold.svg)
ls public/icons/fill/ | wc -l       # → ~100
ls public/icons/bold/clover-bold.svg  # → file exists
```

### Step 3 — Update `Icon.astro` and `iconMappings.ts`

**Edit `src/components/icons/Icon.astro`**:
- Add `if (import.meta.env.DEV) console.warn(...)` inside the catch block when the SVG is not found in primary or fallback variant
- No structural changes

**Edit `src/components/icons/iconMappings.ts`**:
- Add new entries per [research.md §6](./research.md#6-icon-component-polish)
- Add `clover` → `clover-bold` (bold variant) for the main logo use case
- Add `fas fa-language` → `translate`
- Add status badge mappings (rocket / wrench / check-circle / hourglass)
- Add section heading icons (code / question / info)

**Verify**: `npx tsc --noEmit` passes (no type errors in the new mappings).

### Step 4 — Fix the AppBar

**Edit `src/components/nav/AppBar.astro`**:
- Add `clover-bold.svg` logo `<img>` to the `.app-bar__logo` slot, replacing the text-only "Baseet" label
- Replace the 4 `<i class="fab fa-*">` social links with `<Icon name="*-logo" variant="fill" />` (using the `FA_TO_PHOSPHOR_FILL` map)
- In the project nav `<ul>` render block, change `href={item.url || '#'}` to `href={`/${lang === 'ar' ? 'ar/' : ''}projects/${slug || ''}/${item.url}`}` (matches the `navLinks` constant pattern)
- In the app bar social links array (frontmatter), filter entries to only those with a real URL: `const socialLinks = [instagram, linkedin, github, twitter].filter(p => links.social[p] && links.social[p] !== '#').map(p => ({ platform: p, icon: iconMap[p], url: links.social[p] }))` — per FR-032, the studio-level Twitter (currently `"#"` in old data) is omitted from the DOM, not rendered as a disabled icon

**Verify**: `npm run build` produces `dist/projects/zaryn/features/index.html` AND clicking "Demo" from `/projects/zaryn/features/` navigates to `/projects/zaryn/demo/` (200, not 404). Inspect the rendered HTML — the app bar social row should show 3 icons (instagram, linkedin, github) when Twitter is `"#"`, not 4 with one broken.

### Step 5 — Push project page content down

**Edit `src/pages/projects/[slug]/index.astro`, `features.astro`, `demo.astro`, `terms.astro`**:
- Find the first content `<section>` in each file (the one with the colored pill badge / heading / subtitle pattern)
- Change `padding: 100px 24px 64px` → `padding: 140px 24px 64px` (or larger; verify visually with floating app bar)
- Apply the same to the 12 individual `projects/{slug}.astro` files if they have a similar first section

**Verify**: open `/projects/zaryn/features/` in browser, measure the Y coordinate of the first `<h1>` — same as on `/projects/zaryn/`, `/projects/zaryn/demo/`, `/projects/zaryn/terms/` (within 4px).

### Step 6 — Fix the language switcher

**Edit `src/components/shared/LanguageSwitcher.astro`**:
- Remove the `data-astro-reload` attribute (not a valid Astro 5.x attribute)
- Add an `<Icon name="translate" size={14} />` next to the EN/AR label
- Keep the existing `<a href={targetPath}>` — this already does a real navigation; the only bug was the stale attribute

**Verify**: click the language switcher on `/projects/zaryn/` — URL changes to `/ar/projects/zaryn/` AND the page renders with `dir="rtl"`. Click again — back to EN.

### Step 7 — Create the AR mirror routes

For each existing EN page under `src/pages/`, create an AR counterpart under `src/pages/ar/`. The AR file is a thin wrapper:

```astro
---
// src/pages/ar/services.astro
import Page from '../../layouts/Page.astro'
import services from '../../content/data/services.json'
import { t } from '../../i18n/utils'

const pathname = Astro.url.pathname
const lang = 'ar' as const
---
<Page title={t(lang, 'services_title')} section="services" lang={lang}>
  <!-- Same body as the EN file, with all visible strings wrapped in t(lang, 'key') -->
</Page>
```

**Required AR files** (24 total):
- `src/pages/ar/index.astro`
- `src/pages/ar/services.astro`
- `src/pages/ar/clients.astro`
- `src/pages/ar/contact.astro`
- `src/pages/ar/404.astro`
- `src/pages/ar/projects/index.astro`
- `src/pages/ar/projects/chopshop.astro`, `deshikitchen.astro`, `matrix.astro`, `medev.astro`, `moneybox.astro`, `numu.astro`, `zaryn.astro`, `photorestore-ai.astro`, `medical-education-app.astro`, `nss-virtual-education-fair.astro`, `bd-railway-automated-timetable.astro`, `malaysian-business-websites.astro` (12 files)
- `src/pages/ar/projects/[slug]/index.astro`
- `src/pages/ar/projects/[slug]/features.astro`
- `src/pages/ar/projects/[slug]/demo.astro`
- `src/pages/ar/projects/[slug]/terms.astro`

**Verify**: `npm run build` produces `dist/ar/...` HTML files. Open `/ar/` — page renders with `dir="rtl"`.

### Step 8 — Implement visitor detection

**Create `src/scripts/visitor-detect.ts`** (see [contracts/visitor-detect.md](./contracts/visitor-detect.md) for the full spec). Direct TypeScript port of the old Hugo `visitor-detect.js`.

**Edit `src/layouts/Base.astro`**:
- Add `<script>` block that imports `visitor-detect` and calls `init()` on both `DOMContentLoaded` and `astro:page-load` events

**Verify**: open any page in browser, observe the footer within 4 seconds — text shows `Visiting from {Country} · Device {Mobile|Tablet|Desktop}` (or `Unknown` on timeout).

### Step 9 — Recover missing CSS

**Diff `baseetStudioWebSIte/assets/css/` against `baseetstudiosite2/src/styles/`**. Per the audit in [research.md §5](./research.md#5-css-recovery--diff-hugo-vs-astro-style-trees), add:
- `:focus-visible` outline rules to `global.css`
- Footer social icon hover transition (200ms) to `global.css`
- `html { scroll-behavior: smooth }` to `global.css`
- `@media (prefers-reduced-motion: reduce)` block to `global.css` to disable transitions

**Verify**: tab through the home page — every interactive element shows a visible focus ring. Hover a footer social icon — background transitions within 200ms.

### Step 10 — Add project detail icons

For each of the 12 project pages, add Phosphor icons to:
- Tech stack section heading: `<Icon name="code" size={20} />`
- FAQ section heading: `<Icon name="question" size={20} />`
- Status badge: `<Icon name={statusIconMap[project.status]} size={14} />` (rocket / wrench / check-circle / hourglass)
- CTA button: `<Icon name="arrow-right" size={16} />`

A shared `<ProjectMeta.astro>` component could host these — but for this round, inline the icons in each `projects/[slug]/*.astro` file to keep the change surface small.

**Verify**: open `/projects/zaryn/` — every section heading and badge has a visible icon.

### Step 11 — Apply hide-if-missing filter to all social/platform surfaces

Per FR-032 and FR-033, every social icon and platform badge whose URL is `"#"`, empty, or missing must be omitted from the DOM. Apply the filter in the Astro frontmatter (NOT in CSS):

**Edit `src/components/shared/Footer.astro`** (already partially implemented):
- Confirm the social icon row uses `.filter(item => item.url && item.url !== '#')` before rendering

**Edit `src/components/nav/AppBar.astro`** (also done in Step 4):
- Confirm the social links array filters per FR-032

**Edit `src/pages/index.astro` (team section)**:
- For each team member, render only the social platforms where `links.json.team[memberKey][platform]` is a real URL
- Pattern:
  ```astro
  {member.social.github && member.social.github !== '#' && (
    <a href={member.social.github} aria-label="GitHub"><Icon name="github-logo" /></a>
  )}
  ```

**Edit `src/components/project/ProjectCTA.astro` (or wherever platform badges render)**:
- For each platform (ios / android / web), render the badge only if `links.json.projects[slug][platform]` is a real URL
- Pattern:
  ```astro
  {projectLinks.web && projectLinks.web !== '#' && (
    <a href={projectLinks.web}><Icon name="globe" />Web</a>
  )}
  ```

**Verify**:
- Open DevTools → Elements tab on the home page → inside the team section, find each member → count `<a>` children inside their social block. Should be 3 for members with all 3 real URLs, 2 for the two with `"#"` Twitter, never 0 unless all 3 are `"#"`
- Open the footer → count social icons. Should be 5 (github, linkedin, twitter, instagram, tiktok are real URLs in current data) when Facebook/YouTube/Dribbble are `"#"`. Should be 8 if all data is real
- Open any project page → count platform badges. Should match the count of non-`"#"` URLs in `links.json.projects[slug]`
- No `<a href="#">` anywhere inside any social/team/platform container

## End-to-End Verification

After all 10 steps:

```bash
# 1. Build
cd baseetstudiosite2
npm run build

# 2. Lint
npm run lint

# 3. Verify AR routes built
ls dist/ar/                          # should exist
ls dist/ar/projects/                 # should exist
ls dist/ar/projects/zaryn/           # should exist
ls dist/ar/projects/zaryn/demo/      # should exist (no 404 path)

# 4. Verify icon coverage
node scripts/verify-icons.mjs        # exits 0

# 5. Manual click-through
# Open http://localhost:4321 in browser
# - Click every footer social icon → opens correct URL; no icon visible for Facebook/YouTube/Dribbble (filtered)
# - Click every team social icon → opens correct URL; Twitter icon hidden for Mohamed and Asadur (filtered)
# - Click "Features" → "Demo" → "Terms" on /projects/zaryn/ → no 404
# - Click language switcher → /ar/ renders with rtl
# - Scroll to footer → visitor line appears within 4 seconds
# - Tab through home page → focus rings visible
# - DevTools: no <a href="#"> inside any social/team/platform container
# - DevTools: count of icons in each row matches count of real URLs in source data

# 6. Network audit
# Open DevTools Network tab on any page → zero external icon/font requests
```

## Rollback

If any step breaks the build, revert the offending commit. The changes are scoped:

- Data files: revert `links.json` / `team.json`
- SVG copy: `rm -rf public/icons/regular/* public/icons/bold/* public/icons/fill/*` (will be re-populated next run)
- AppBar / Footer / Icon: revert the specific component file
- AR routes: `rm -rf src/pages/ar/` and the build will not emit them
- Visitor detect: remove the `<script>` from `Base.astro` and delete `src/scripts/visitor-detect.ts`

The feature is isolated — no other system depends on the new files.
