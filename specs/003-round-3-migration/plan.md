# Implementation Plan: Site 2 Round 3 — Content, Icons & Navigation Hardening

**Branch**: `003-round-3-migration` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-round-3-migration/spec.md`

## Summary

Close the parity gap between `baseetStudioWebSIte` (Hugo, source of truth) and `baseetstudiosite2` (Astro, target). This round ships seven work streams that the user discovered while clicking the live build: data migration for team/project/studio links, broken project subpage navigation (404 on `/projects/{slug}/features/demo/`), inconsistent content offset under the floating app bar, non-functional language switcher (no Arabic routes built), missing visitor-detection line in the footer, sparse Phosphor icon set (only 4 bold + 9 fill + 93 regular SVGs present locally out of 1512+ available), and CSS regressions vs the old Hugo build. The technical approach is build-time SVG copy + small targeted edits to existing components — no new framework, no new architectural pattern.

## Technical Context

**Language/Version**: TypeScript 5.x, Astro 5.x, JavaScript ES2022+ (per site2/AGENTS.md)  
**Primary Dependencies**: Astro (SSG), Tailwind CSS 4.x (integration), GSAP (animations), Vanta.js (clouds background), Phosphor icons (local SVGs at `/phosphor-icons/SVGs/`)  
**Storage**: N/A — static JSON data files in `src/content/data/`; no database, no server runtime  
**Testing**: `npm run build` for build validation; `npm run lint` for code style; manual visual verification at 375px / 768px / 1280px viewports; manual click-through of all project subpages in both EN and AR; manual network-tab check for zero external icon/font requests  
**Target Platform**: Web browsers (mobile / tablet / desktop); static HTML/CSS/JS output to `dist/`; deployed to baseetstudio.com  
**Project Type**: Web (Astro SSG — single frontend project, no backend)  
**Performance Goals**: Lighthouse score > 90; page load < 3s on 3G; **zero external icon/font requests** (per FR-022, SC-007); first content section on every project subpage begins at consistent Y coordinate (within 4px)  
**Constraints**:
- No new npm dependencies (Phosphor SVGs already in repo; no `@phosphor-icons/web` package)
- No backend changes (visitor detection is client-side; the geo API call is public, no auth)
- Must not break existing pages — every change is additive or replacement of dead code
- AR pages must produce real `dist/ar/...` HTML files (currently NOT generated — major bug fix)
- All user-facing strings stay un-localised per the active "localise this later" rule (en.json / ar.json already shipped)
**Scale/Scope**: 12 project pages (each with 3 subpages = 36 routes × 2 locales = 72 HTML files), 1 home page, 4 content pages (services / clients / contact / 404), 1 footer, 1 app bar, 1 language switcher, ~1500 SVG files to copy

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The repository constitution at `.specify/memory/constitution.md` is the **CNG Platform Constitution** — written for a Flutter + Supabase + Riverpod monorepo (cng_customer / cng_vendor / cng_admin apps). It is not directly applicable to the Astro migration project, but its **five core principles** are still relevant as design discipline:

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Modularity-First | ✅ PASS | No cross-component coupling introduced. All new code lives inside the existing component tree (`src/components/icons/`, `src/components/nav/`, `src/components/shared/`). The SVG copier is a one-shot script, not a new module. |
| II. Riverpod State Management | N/A | No Flutter, no Riverpod — applies to mobile apps only. |
| III. Dual-Layer Data Persistence | N/A | No Hive, no Supabase — Astro is static SSG. |
| IV. Localization & Accessibility | ✅ PASS | All pages already serve EN + AR via the `/ar/` prefix pattern. The language switcher fix in this round **enables** AR routes (currently broken) without introducing new localisation surface area. RTL (`dir="rtl"`) already wired. Accessibility (focus rings, aria) is in scope via FR-031. |
| V. Security by Default | ✅ PASS | Visitor detect uses public `textContent` insertion (no XSS via geo response). No new secrets. No new external auth flows. Existing contact form delegates to a Cloudflare Worker that is untouched. |

**Gate Result (Pre-Design)**: PASS — no violations. The CNG constitution's Flutter-specific gates (Riverpod / Hive / Supabase) are out of scope for the Astro site.

**Site-specific discipline (from prior rounds, not in the CNG constitution but enforced in `site2/AGENTS.md`)**:

| Discipline | Status | Notes |
|------------|--------|-------|
| Local-first (no external CDN) | ✅ ENFORCED | FR-022 mandates local copy of every Phosphor SVG used. SC-007 verifies zero external icon requests. |
| Data-driven (JSON > hardcoded) | ✅ ENFORCED | All migrated links live in `links.json`, all team data in `team.json`. No inline `href="#"` anywhere. |
| Bilingual parity (EN ↔ AR) | ✅ ENFORCED | FR-010..FR-014 require AR pages to build and render. Existing `/ar/` route pattern is preserved. |
| Static-first (no server) | ✅ ENFORCED | Visitor detect is client-side JS. SVG copy is build-time. No server runtime introduced. |

**Re-evaluation (Post-Phase 1 Design)**: see bottom of plan.md.

## Project Structure

### Documentation (this feature)

```text
baseetstudiosite2/specs/003-round-3-migration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── icon-copier.md
│   ├── visitor-detect.md
│   └── i18n-routing.md
├── checklists/
│   └── requirements.md  # already exists (from /speckit.specify)
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
baseetstudiosite2/
├── public/
│   ├── icons/                                  # EXPANDED: copy missing Phosphor SVGs
│   │   ├── regular/                            # grow from 93 → ~1500 files
│   │   ├── bold/                               # grow from 4 → ~1512 files
│   │   ├── fill/                               # grow from 9 → ~100 files (only used ones)
│   │   └── clover-bold.svg                     # NEW: Baseet logo (copied from phosphor source)
│   ├── images/                                 # unchanged
│   ├── fonts/                                  # unchanged
│   └── vendor/                                 # unchanged
├── src/
│   ├── components/
│   │   ├── icons/
│   │   │   ├── Icon.astro                      # MODIFIED: add dev-only console.warn for missing
│   │   │   └── iconMappings.ts                 # MODIFIED: add new mappings (clover, translate, etc.)
│   │   ├── nav/
│   │   │   ├── AppBar.astro                    # MODIFIED: replace FA <i> with <Icon>; fix project nav URL builder; use clover logo
│   │   │   ├── AppBar.ts                       # unchanged
│   │   │   └── MobileSidebar.astro             # unchanged
│   │   ├── shared/
│   │   │   ├── ContactForm.astro               # MODIFIED: replace paper-plane <i> with <Icon>
│   │   │   ├── Footer.astro                    # MODIFIED: ensure all 8 social icons render; add visitor-detect script; use clover logo
│   │   │   ├── LanguageSwitcher.astro          # MODIFIED: remove data-astro-reload; add translate icon
│   │   │   └── ThemeSwitcher.astro             # unchanged (already icon-based)
│   │   └── project/                            # unchanged structurally
│   ├── layouts/
│   │   ├── Base.astro                          # MODIFIED: add visitor-detect <script>; verify lang/dir attrs
│   │   ├── Page.astro                          # unchanged
│   │   └── Project.astro                       # unchanged
│   ├── pages/
│   │   ├── 404.astro                           # unchanged
│   │   ├── clients.astro                       # unchanged
│   │   ├── contact.astro                       # unchanged
│   │   ├── index.astro                         # unchanged
│   │   ├── services.astro                      # already uses resolveIcon — no change
│   │   ├── projects/
│   │   │   ├── [slug]/
│   │   │   │   ├── index.astro                 # MODIFIED: padding-top ≥ 140px; ensure 8 social icons render
│   │   │   │   ├── features.astro              # MODIFIED: padding-top ≥ 140px
│   │   │   │   ├── demo.astro                  # MODIFIED: padding-top ≥ 140px; verify CTA
│   │   │   │   └── terms.astro                 # MODIFIED: padding-top ≥ 140px
│   │   │   ├── chopshop.astro                  # (if exists) — verify padding
│   │   │   └── ... (other 11 project files)    # verify padding
│   │   └── ar/                                 # NEW TREE: Arabic mirror routes
│   │       ├── index.astro
│   │       ├── services.astro
│   │       ├── clients.astro
│   │       ├── contact.astro
│   │       ├── 404.astro
│   │       └── projects/
│   │           ├── index.astro
│   │           ├── chopshop.astro
│   │           ├── ... (12 project files)
│   │           └── [slug]/
│   │               ├── index.astro
│   │               ├── features.astro
│   │               ├── demo.astro
│   │               └── terms.astro
│   ├── content/data/
│   │   ├── footer.json                         # unchanged
│   │   ├── home.json                           # unchanged
│   │   ├── links.json                          # MODIFIED: replace "#" placeholders with real URLs
│   │   ├── projects.json                       # unchanged
│   │   ├── services.json                       # unchanged
│   │   └── team.json                           # MODIFIED: remove _linksSource stub
│   ├── styles/
│   │   ├── global.css                          # MODIFIED: add :focus-visible outline; verify all hover states
│   │   ├── glass.css                           # unchanged (already shipped)
│   │   ├── nav.css                             # unchanged (already shipped)
│   │   └── animations.css                      # unchanged
│   └── animations/                             # unchanged
├── scripts/                                    # NEW DIRECTORY
│   ├── copy-phosphor-icons.mjs                 # Build-time SVG copier (one-shot, can be re-run)
│   └── verify-icons.mjs                        # CI guard: ensure every iconMapping target exists on disk
└── tests/                                      # unchanged (no tests in this repo)
```

**Structure Decision**: Single Astro project (no `backend/` / `frontend/` split). All edits are inside the existing `baseetstudiosite2/src/` tree. New `scripts/` directory for build-time helpers. New `src/pages/ar/` mirror tree to enable the language switcher.

## Implementation Phases

### Phase 0 — Research & SVG Audit (already complete in research.md)

### Phase 1 — Data, Components, Routing

1. **Data migration** — update `links.json` (replace `#` placeholders with real URLs from old Hugo site) and `team.json` (remove `_linksSource` stub, add real Twitter URLs)
2. **SVG copy** — run `scripts/copy-phosphor-icons.mjs` to copy every referenced Phosphor SVG from `phosphor-icons/SVGs/{variant}/` into `public/icons/{variant}/` (this also copies `clover-bold.svg` for the logo)
3. **Icon component polish** — add dev-only `console.warn` for missing icons; add new mappings (clover, translate, rocket, wrench for status, etc.)
4. **AppBar fix** — replace `<i class="fab fa-*">` with `<Icon>`; fix project nav URL builder to use `/${lang}projects/${slug}/${item.url}` (root-relative, not nested); integrate clover logo
5. **Project page offset** — increase top padding on all 4 subpages (index / features / demo / terms) to ≥ 140px
6. **Language switcher** — remove `data-astro-reload`; add `<Icon name="translate">` next to label
7. **AR routes** — create mirror `src/pages/ar/` tree, one file per existing page, with `lang="ar"` prop passed to layouts
8. **Visitor detection** — add `src/scripts/visitor-detect.ts` (TypeScript, port from old Hugo `visitor-detect.js`); wire into `Base.astro` to run on `DOMContentLoaded` and `astro:page-load`
9. **CSS recovery** — diff old Hugo `baseetStudioWebSIte/assets/css/` against new `src/styles/`; add any missing rules (focus-visible outline, hover transitions, glassmorphic utilities)
10. **Project detail icons** — add `code` icon to tech stack sections, `question` to FAQ, `rocket`/`wrench`/`check-circle` to status badges, `arrow-right` to CTAs

### Phase 2 — Tasks (output to tasks.md, NOT created by this plan)

## Complexity Tracking

> No constitution violations to justify. All complexity is incremental — no new architectural patterns introduced.

| Concern | Decision | Simpler Alternative Rejected |
|---------|----------|------------------------------|
| Copying ~1500 SVG files into the repo (~10-20 MB) | Required by user ("copy it into site2 assets and use it") | Subset (only icons used) rejected — user wants full coverage so future additions don't need icon work |
| Creating 24 mirror AR page files | Required to fix language switcher (currently 404 on `/ar/...`) | Middleware-based locale switching rejected — Astro SSG requires static output; middleware would force SSR |
| Manual port of visitor-detect.js → visitor-detect.ts | Required to integrate with Astro's `astro:page-load` lifecycle | Reusing the old JS file directly rejected — would not hook into ViewTransitions |
| Per-project padding increase (not a global CSS rule) | Required because home page already works correctly | Global padding-top rejected — would push the entire site down unnecessarily |

## Verification Strategy

After implementation, the following checks must all pass:

1. **Build**: `cd baseetstudiosite2 && npm run build` produces `dist/` with **all** `/ar/...` HTML files
2. **Lint**: `npm run lint` passes
3. **404 sweep**: open `dist/projects/zaryn/features/demo/index.html` — should NOT exist (file is at `dist/projects/zaryn/demo/index.html`); click-through navigation in browser hits 200 on all 4 subpages
4. **Icon coverage**: `node scripts/verify-icons.mjs` exits 0 (every `iconMappings.ts` target file exists on disk)
5. **Network audit**: open any page in browser DevTools Network tab — zero requests to external icon CDNs, zero requests to Font Awesome
6. **AR parity**: visit `/ar/projects/zaryn/`, verify `dir="rtl"`, Arabic typography, identical layout
7. **Visitor line**: load any page, observe footer within 4 seconds — text shows `Visiting from {country} · Device {type}` (or `Unknown` on timeout)
8. **Focus audit**: tab through the home page — every interactive element shows a visible focus ring
9. **Padding check**: open DevTools on any project subpage — first content `<section>` has `padding-top` ≥ 140px

## Re-evaluation (Post-Phase 1 Design)

| Principle | Status | Verification |
|-----------|--------|--------------|
| I. Modularity-First | ✅ STILL PASS | New `scripts/` directory is self-contained. `src/pages/ar/` is a clean mirror tree with no shared imports beyond the layout/components. |
| II-IV. Flutter-specific | N/A | Unchanged. |
| IV. Localization & Accessibility | ✅ STILL PASS | AR routes built, focus rings added (`FR-031`). Language switcher functional end-to-end. |
| V. Security by Default | ✅ STILL PASS | `visitor-detect.ts` uses `textContent` only. No new outbound requests beyond the two public geo APIs. No secrets. |
| Local-first (site discipline) | ✅ STILL PASS | All icons local. Visitor geo APIs are user-facing public services (intentional exception, documented in spec). |
| Data-driven (site discipline) | ✅ STILL PASS | All team/project links migrated to `links.json`. Zero hardcoded URLs. |
| Bilingual parity (site discipline) | ✅ STILL PASS | `/ar/` mirror tree complete. RTL preserved via existing `dir={isRTL ? 'rtl' : 'ltr'}`. |
| Static-first (site discipline) | ✅ STILL PASS | Visitor detect is client-side only. SVG copy is build-time. AR routes are static HTML. |

**Final Gate Result**: PASS — ready for Phase 2 (tasks.md) and implementation.
