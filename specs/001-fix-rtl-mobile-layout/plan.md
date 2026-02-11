# Implementation Plan: Fix RTL Mobile Layout

**Branch**: `001-fix-rtl-mobile-layout` | **Date**: 2026-02-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-fix-rtl-mobile-layout/spec.md`

## Summary

Remove hardcoded `dir="ltr"` from the app bar and mobile menu in both header partials, replace physical CSS positioning properties (`right`, `left`, `margin-left`) with CSS logical properties (`inset-inline-end`, `inset-inline-start`, `margin-inline-start`) and directional selectors, so the entire mobile and desktop layout automatically mirrors for RTL Arabic pages without breaking the existing LTR English layout. This also fixes page content being pushed off-screen in Arabic on mobile and corrects the mobile menu slide-in direction.

## Technical Context

**Language/Version**: Hugo templates (Go template syntax) + CSS3 + vanilla JavaScript  
**Primary Dependencies**: Hugo Extended v0.152.2+, Tailwind CSS v4.1.17, Autoprefixer  
**Storage**: N/A (static site, no database)  
**Testing**: Vitest with jsdom environment; manual visual verification at 320px, 375px, 768px, 1280px  
**Target Platform**: All modern browsers (Chrome, Firefox, Safari, Edge) + mobile (iOS Safari, Chrome Mobile)  
**Project Type**: Web (Hugo static site — single project structure)  
**Performance Goals**: No increase in CSS bundle size beyond 1KB; page load time stays under 3s on 3G  
**Constraints**: No JavaScript frameworks permitted (Constitution Principle I); must use only vanilla JS and CSS; bilingual parity required (Principle II)  
**Scale/Scope**: 6 affected files (2 HTML partials, 1 CSS file, 3 layout files with minor RTL adjustments); ~200 lines changed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Performance & Core Web Vitals | ✅ PASS | No new JS framework. CSS changes are net-neutral or reduce dead CSS. No new third-party scripts. |
| II. Bilingual Parity (NON-NEGOTIABLE) | ✅ PASS | This feature *fixes* bilingual parity — Arabic pages will render correctly after implementation. No new i18n keys needed; no content file changes. |
| III. Content-Data Separation | ✅ PASS | Changes are in templates (`layouts/`) and CSS (`assets/css/`) only. No content or data files modified. |
| IV. Static-First Architecture | ✅ PASS | No server-side logic introduced. Changes are purely presentational (CSS + HTML attributes). |
| V. Visual & Brand Consistency | ✅ PASS | No color changes. Layout will be verified at 375px, 768px, 1280px per constitution. The app bar simply mirrors; brand colours and typography are unchanged. |

**Gate result**: ALL PASS — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-fix-rtl-mobile-layout/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal — no data entities)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (empty — no API contracts)
│   └── README.md
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
layouts/
├── baseof.html                     # Dir attribute source of truth (no change needed)
├── partials/
│   ├── header.html                 # Remove dir="ltr", update mobile menu markup
│   ├── shared/
│   │   └── header.html             # Same as above for shared header
│   └── language-switcher.html      # No change needed
├── services/list.html              # Minor: verify RTL rules still work without forced dir
├── customers/list.html             # Minor: verify RTL border rules
└── contact/list.html               # No change needed

assets/
└── css/
    └── app-bar.css                 # Major: replace physical → logical properties,
                                    #   fix mobile menu RTL positioning,
                                    #   remove dead RTL rules,
                                    #   fix overly broad [dir='rtl'] selector
```

**Structure Decision**: Hugo static site structure — all changes are in `layouts/` (Hugo partials) and `assets/css/` (stylesheets). No new files beyond spec documentation.

## Complexity Tracking

> No constitution violations — this section is intentionally empty.
