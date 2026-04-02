# Implementation Plan: Branded Project Showcase & Site Restructuring

**Branch**: `002-branded-project-showcase` | **Date**: 2026-04-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-branded-project-showcase/spec.md`

## Summary

Restructure the Baseet Studio Hugo website to support three tiers of project presentation: branded landing pages (5 products with unique identity, adaptive app bar, per-product animated backgrounds), standard project pages (5 projects within the studio framework), and a client showcase section (Portia Grid, Iyat). The app bar dynamically adapts logo/nav per page context. Homepage reorganized, "Customers" renamed to "Clients", Fleet Ops renamed to Portia Grid with testimonial, Iyat added as new client.

## Technical Context

**Language/Version**: Hugo Extended 0.152.2+ (Go templates), vanilla JavaScript (ES6+), CSS3/GLSL  
**Primary Dependencies**: Hugo, Tailwind CSS v4.x, @tailwindcss/cli, @tailwindcss/typography, Autoprefixer, Font Awesome 6  
**Storage**: N/A (static site, all data in YAML/Markdown files)  
**Testing**: Vitest with jsdom (`npm run test`)  
**Target Platform**: Web (static HTML/CSS/JS served via Nginx/CDN/GitHub Pages)  
**Project Type**: Static website (Hugo SSG)  
**Performance Goals**: <3s page load on 3G, 30+ fps for background animations on mid-range mobile  
**Constraints**: No external JS frameworks (constitution), full bilingual en/ar parity, all content data-driven (YAML/Markdown), reduced-motion fallback for animations  
**Scale/Scope**: 5 branded landing pages, 5 standard project pages, 2 client entries, 1 adaptive app bar system, 5 unique background effects, homepage restructure, global rename (Customers→Clients, Fleet Ops→Portia Grid)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Gate (Initial)

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Performance & Core Web Vitals | **PASS** | Vanilla JS only for backgrounds (WebGL shaders like existing clouds). Assets fingerprinted/minified via Hugo pipeline. No external runtime frameworks. Each background effect loaded only on its own page. |
| II | Bilingual Parity (NON-NEGOTIABLE) | **PASS** | Plan requires en/ar variants for all content files, i18n keys for new nav items ("Back to Baseet", "Features", "Download", "Demo"), and Arabic front matter for all new/updated project pages. |
| III | Content-Data Separation | **PASS** | Product definitions in content/ front matter + data/ YAML. App bar configuration driven by page front matter (not hard-coded in templates). Background effect selection driven by data, not template logic. |
| IV | Static-First Architecture | **PASS** | Everything is Hugo templates + vanilla JS + GLSL shaders. No server runtime. Contact forms use existing Web3Forms integration. |
| V | Visual & Brand Consistency | **PASS with note** | Studio-level UI elements (app bar frame, footer) use the defined color palette. Product-specific brand colors (Nomu purple, Money Box green, etc.) are intentionally distinct — they represent product identities, not modifications to the studio palette. Product colors already exist in `data/home/projects.yaml` and content front matter. New product colors for ChopShop and Matrix will be defined in their respective data/content files. |

**Gate Result**: ALL PASS — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-branded-project-showcase/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (Hugo template interfaces)
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Existing files to MODIFY
config/_default/menus.yaml          # Rename "Customers" → "Clients" in main/footer menus
layouts/baseof.html                 # Conditional background loading per page type
layouts/home.html                   # Homepage restructuring
layouts/partials/shared/header.html # Adaptive app bar (or layouts/partials/header.html)
layouts/partials/header.html        # Adaptive app bar logic (logo + nav swap)
layouts/projects/single.html        # Add branded-product layout detection
layouts/customers/list.html         # Rename to clients context, update template
data/home/projects.yaml             # Add ChopShop, Matrix entries; categorize items
data/customers.yaml                 # Rename to clients.yaml; rename FleetOps → Portia Grid; add Iyat
i18n/en.yaml                        # New keys: nav items, product names, back-to-baseet, etc.
i18n/ar.yaml                        # Arabic translations for all new keys
assets/css/app-bar.css              # Product-specific logo/brand styles in app bar

# New files to CREATE
layouts/projects/branded.html       # New layout for branded product landing pages
layouts/partials/branded-header.html # App bar variant for branded products
layouts/partials/branded-contact.html # Contact section for branded pages
assets/js/leaves.js                 # Nomu background effect (WebGL or CSS)
assets/js/paper-notes.js            # Money Box background effect
assets/js/kitchen.js                # Desi Kitchen background effect
assets/js/shopping.js               # ChopShop background effect
assets/js/grid.js                   # Matrix background effect
assets/css/branded-effects.css      # Shared CSS for all branded background effects
content/projects/chopshop.md        # ChopShop content (English)
content/projects/chopshop.ar.md     # ChopShop content (Arabic)
content/projects/matrix.md          # Matrix content (English)
content/projects/matrix.ar.md       # Matrix content (Arabic)
data/clients.yaml                   # Renamed from customers.yaml (or modify in-place)
layouts/clients/list.html           # Clients list page (renamed from customers)
content/clients/_index.md           # Clients section index (English)
content/clients/_index.ar.md        # Clients section index (Arabic)
```

**Structure Decision**: This is a Hugo static site. No src/backend/frontend split — all new code goes into Hugo's conventional directories (layouts/, assets/, content/, data/, i18n/). The key architectural addition is the `branded.html` layout that branded products declare via `layout: branded` in front matter, which triggers the adaptive app bar and product-specific background effect.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Product-specific colors outside studio palette (Principle V) | Each branded product has its own identity (Nomu=purple, Money Box=green, Desi Kitchen=orange, ChopShop=#E11D48 rose, Matrix=#0891B2 cyan) | Using only the studio palette would make product pages look like studio pages, defeating the purpose of branded identity. Product colors are scoped to their pages only and don't affect the studio palette. |

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 design completion.*

| # | Principle | Status | Post-Design Notes |
|---|-----------|--------|-------------------|
| I | Performance & Core Web Vitals | **PASS** | Each background effect JS loaded only on its page (not globally). Hugo resource pipeline handles minify/fingerprint. WebGL renderers follow proven CloudsRenderer pattern with 0.5x resolution, 50-step limit, auto-pause. No external frameworks introduced. |
| II | Bilingual Parity (NON-NEGOTIABLE) | **PASS** | Data model specifies en/ar content files for all new pages (chopshop, matrix, clients). i18n key convention defined (`client_<id>_*`, `back_to_baseet`, product nav labels). Contract requires both language files updated. |
| III | Content-Data Separation | **PASS** | App bar driven by front matter params (not hardcoded). Product data in content front matter + YAML. Background selection via `bgEffect` param. Client data in `data/clients.yaml`. No content in templates. |
| IV | Static-First Architecture | **PASS** | All new code is Hugo templates + vanilla JS + GLSL shaders. Contact forms reuse existing Web3Forms integration. No server-side runtime added. |
| V | Visual & Brand Consistency | **PASS with justified variance** | Studio UI elements (app bar frame, footer, nav structure) use studio palette. Product colors (purple, green, orange, rose, cyan) are scoped via CSS variables (`--project-color`, `--project-gradient`) to branded pages only. ChopShop color `#E11D48` and Matrix color `#0891B2` defined in data model. See Complexity Tracking above. |

**Post-Design Gate Result**: ALL PASS — proceed to `/speckit.tasks` for Phase 2.
