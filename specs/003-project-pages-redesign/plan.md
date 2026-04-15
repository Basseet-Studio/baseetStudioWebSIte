# Implementation Plan: Project Pages Redesign

**Branch**: `003-project-pages-redesign` | **Date**: 2026-04-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-project-pages-redesign/spec.md`

## Summary

Redesign five project landing pages (Money Box, Numu, Matrix, Chopshop, Deshi Kitchen) with unique layouts per project, standalone sub-pages (Features, Demo, Terms), a context-switching app bar, per-project GSAP scroll animations, and a country/device detector in the footer. All built on the existing Hugo + Tailwind CSS 4 + vanilla JS stack with full EN/AR bilingual support.

## Technical Context

**Language/Version**: Hugo Extended (Go modules, Go 1.24+), Tailwind CSS 4.1.x, Vanilla JS (ES2020+)  
**Primary Dependencies**: Hugo, @tailwindcss/cli 4.1.17, @tailwindcss/typography 0.5.19, Autoprefixer, Font Awesome 6.5.1 CDN  
**Storage**: N/A — static site, content via YAML/Markdown front matter  
**Testing**: Vitest 3.2.4 with jsdom environment, ESLint 9.x + Prettier 3.6.x  
**Target Platform**: Static HTML/CSS/JS — CDN/Nginx/GitHub Pages  
**Project Type**: Web (Hugo static site)  
**Performance Goals**: <3s load on 3G (Constitution Principle I), 60fps GSAP animations  
**Constraints**: No server-side runtime (Constitution IV), bilingual parity EN+AR (Constitution II), content-data separation (Constitution III), brand color palette (Constitution V)  
**Scale/Scope**: 20 new pages (5 projects × 4 pages), 5 unique layout templates, 1 redesigned header partial, 1 footer enhancement

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Performance & Core Web Vitals | ⚠️ VIOLATION | Constitution says "No external runtime JavaScript frameworks; vanilla JS only." GSAP is external JS. Also: Google Fonts per project may block rendering. |
| II | Bilingual Parity | ✅ PASS | All new pages, i18n keys, and content must ship in both EN and AR. Plan accounts for this. |
| III | Content-Data Separation | ✅ PASS | All project data stays in YAML front matter. Templates remain structural. New project = new content file, no template edits. |
| IV | Static-First Architecture | ✅ PASS | Country detection uses client-side fetch to free API. No server runtime introduced. |
| V | Visual & Brand Consistency | ⚠️ NOTE | Per-project fonts and distinct layouts intentionally diverge from the main Baseet brand palette. This is by design — project pages represent individual products, not the Baseet corporate site. The main brand palette still governs the Baseet-level app bar and shared elements. |

### VIOLATION Justification (Principle I — GSAP)

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| GSAP library (external JS) | Spec FR-025/FR-026 require unique scroll-triggered animations per project. Vanilla JS Intersection Observer can do fade-in but cannot do timeline sequencing, stagger, or physics-based easing that differentiate 5 projects. | Pure CSS animations + IO: insufficient variety for 5 distinct effects. Would result in similar-looking animations across projects, defeating the purpose. |
| Google Fonts per project | Each project needs a distinct font pairing. System fonts don't provide enough typographic variety for 5 unique identities. | System font stack: only ~4 distinct families across platforms, insufficient for 5 unique pairings. |

**Mitigations**:
- GSAP loaded only on project pages via `<script defer>`, NOT on main Baseet pages
- GSAP loaded from CDN with `async` attribute to avoid blocking critical path
- Per-project Google Fonts loaded with `font-display: swap` and `<link rel="preconnect">`
- Total GSAP payload: ~30KB gzipped (core + ScrollTrigger plugin only)
- GSAP removed from bundle if `prefers-reduced-motion: reduce` is set

### Post-Design Re-Evaluation (Phase 1 Complete)

All five constitution principles re-evaluated after research and design:

| # | Principle | Post-Design Status | Delta |
|---|-----------|-------------------|-------|
| I | Performance | ⚠️ VIOLATION (justified) | No change. Mitigations confirmed: GSAP ~30KB gzip, defer-loaded, project-pages only. Fonts use preconnect + swap. |
| II | Bilingual Parity | ✅ PASS | Confirmed: 30 AR content files planned, all i18n keys have AR translations in contract. |
| III | Content-Data Separation | ✅ PASS | Confirmed: Sub-pages inherit project data from parent `_index.md` via `{{ .Parent.Params }}`. Zero data in templates. |
| IV | Static-First | ✅ PASS | Confirmed: Country detection = client-side fetch to free API. sessionStorage cache. No server runtime. |
| V | Brand Consistency | ⚠️ NOTE (accepted) | Confirmed: Project pages intentionally diverge (per-product identity). Main Baseet brand palette governs shared elements (footer, project app bar "Baseet" link, contact page). |

No new violations. Plan proceeds to Phase 2 (tasks).

## Project Structure

### Documentation (this feature)

```text
specs/003-project-pages-redesign/
├── plan.md              # This file
├── research.md          # Phase 0: GSAP patterns, font pairings, geo-API, Hugo sub-pages
├── data-model.md        # Phase 1: Project entity model with layout/font/animation fields
├── quickstart.md        # Phase 1: How to run, test, and add a new project
├── contracts/           # Phase 1: URL structure, i18n key contracts, front matter schema
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
layouts/
├── partials/
│   ├── header.html                  # MODIFIED — conditional project-mode app bar
│   ├── project-header.html          # NEW — project-specific app bar partial
│   └── shared/
│       └── footer.html              # MODIFIED — country/device detector display
├── projects/
│   ├── branded.html                 # EXISTING — kept as fallback for non-redesigned projects
│   ├── moneybox.html                # NEW — unique Money Box landing layout
│   ├── numu.html                    # NEW — unique Numu landing layout
│   ├── matrix.html                  # NEW — unique Matrix landing layout
│   ├── chopshop.html                # NEW — unique Chopshop landing layout
│   ├── deshikitchen.html            # NEW — unique Deshi Kitchen landing layout
│   ├── features.html                # NEW — project features sub-page template
│   ├── demo.html                    # NEW — project demo sub-page template
│   └── terms.html                   # NEW — project terms sub-page template

content/projects/
├── money-box/
│   ├── _index.md                    # MOVED from money-box.md (becomes section)
│   ├── features.md                  # NEW — features sub-page
│   ├── demo.md                      # NEW — demo sub-page
│   └── terms.md                     # NEW — terms sub-page
├── numu/
│   ├── _index.md                    # NEW (Numu didn't exist before)
│   ├── features.md
│   ├── demo.md
│   └── terms.md
├── matrix/
│   ├── _index.md                    # MOVED from matrix.md
│   ├── features.md
│   ├── demo.md
│   └── terms.md
├── chopshop/
│   ├── _index.md                    # MOVED from chopshop.md
│   ├── features.md
│   ├── demo.md
│   └── terms.md
└── deshikitchen/
    ├── _index.md                    # MOVED from deshikitchen.md
    ├── features.md
    ├── demo.md
    └── terms.md

assets/
├── css/
│   ├── project-moneybox.css         # NEW — Money Box specific styles + font import
│   ├── project-numu.css             # NEW — Numu specific styles + font import
│   ├── project-matrix.css           # NEW — Matrix specific styles + font import
│   ├── project-chopshop.css         # NEW — Chopshop specific styles + font import
│   └── project-deshikitchen.css     # NEW — Deshi Kitchen specific styles + font import
├── js/
│   ├── gsap-moneybox.js             # NEW — Money Box GSAP animation
│   ├── gsap-numu.js                 # NEW — Numu GSAP animation
│   ├── gsap-matrix.js               # NEW — Matrix GSAP animation
│   ├── gsap-chopshop.js             # NEW — Chopshop GSAP animation
│   ├── gsap-deshikitchen.js         # NEW — Deshi Kitchen GSAP animation
│   └── visitor-detect.js            # NEW — Country + device detection

i18n/
├── en.yaml                          # MODIFIED — new keys for project nav, terms, demo, features
└── ar.yaml                          # MODIFIED — Arabic translations for all new keys

# Arabic content mirrors (all NEW):
content/projects/money-box/features.ar.md
content/projects/money-box/demo.ar.md
content/projects/money-box/terms.ar.md
# ... (same pattern for all 5 projects × 3 sub-pages × 2 languages = 30 content files)
```

**Structure Decision**: Hugo section bundles (`content/projects/<slug>/`) enable sub-pages under each project. Each project landing page becomes `_index.md` (section page), and sub-pages (features, demo, terms) become leaf pages within that section. This is the idiomatic Hugo approach for nested URL structures like `/projects/money-box/features/`.
