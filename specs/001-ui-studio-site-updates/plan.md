# Implementation Plan: Studio Site 2 UI Updates

**Branch**: `001-ui-studio-site-updates` | **Date**: 2026-05-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ui-studio-site-updates/spec.md`

## Summary

UI styling updates to studio site 2 (Astro project):
- Change Vanta clouds background from dark to light blue sky
- Reposition app bar from centered floating pill to left-aligned compact header
- Reduce app bar height from 72px to ~52px
- Remove per-project header components (ProjectHeader.astro) from project pages
- Match link styling to original Hugo site

## Technical Context

**Language/Version**: Astro 4.x, TypeScript, Tailwind CSS
**Primary Dependencies**: Vanta.js clouds, Astro components
**Storage**: N/A (static site)
**Testing**: Visual verification only (no unit tests for CSS)
**Target Platform**: Web (desktop + mobile browsers)
**Project Type**: Single Astro project (baseetstudiosite2)
**Performance Goals**: No performance changes; maintain existing load times
**Constraints**: Must work with existing Vanta clouds integration, RTL support for Arabic
**Scale/Scope**: 3 main pages (home, projects index, project detail), services, clients, contact

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Performance | ✅ PASS | No JS/CSS changes affecting load times |
| II. Bilingual Parity | ✅ PASS | EN/AR support already in place; changes maintain existing i18n |
| III. Content-Data Separation | ✅ PASS | Changes are pure CSS/styling; no content hard-coding |
| IV. Static-First Architecture | ✅ PASS | CSS-only changes; no server-side logic introduced |
| V. Visual & Brand Consistency | ✅ PASS | Changes align with established brand colors (#496bc1 primary) |

**Result**: All gates pass - proceed to Phase 0.

## Project Structure

### Source Code (repository root)

```text
baseetstudiosite2/
├── src/
│   ├── components/
│   │   ├── background/
│   │   │   ├── VantaBg.astro        # Cloud background component
│   │   │   └── vanta-init.ts        # Vanta initialization script
│   │   ├── nav/
│   │   │   ├── AppBar.astro         # Main navigation bar
│   │   │   └── AppBar.ts            # App bar behavior script
│   │   ├── project/
│   │   │   ├── ProjectHeader.astro  # TO BE REMOVED from project pages
│   │   │   ├── ProjectGallery.astro
│   │   │   └── ProjectCTA.astro
│   │   └── shared/
│   │       ├── Footer.astro
│   │       ├── ContactForm.astro
│   │       └── LanguageSwitcher.astro
│   ├── layouts/
│   │   ├── Base.astro              # Main layout with AppBar
│   │   └── Project.astro           # Project layout - will remove ProjectHeader
│   ├── pages/
│   │   ├── index.astro
│   │   ├── projects/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro         # Project detail pages
│   │   ├── services.astro
│   │   ├── clients.astro
│   │   └── contact.astro
│   └── styles/
│       ├── global.css              # CSS variables (--vanta-sky)
│       ├── nav.css                 # App bar styles
│       ├── glass.css
│       └── animations.css
├── specs/001-ui-studio-site-updates/
│   ├── plan.md                     # This file
│   ├── spec.md                     # Feature specification
│   └── research.md                 # N/A - no unknowns
└── package.json
```

**Structure Decision**: Single Astro project. Changes isolated to:
- `src/styles/global.css` - sky color
- `src/styles/nav.css` - app bar position/size styling
- `src/components/nav/AppBar.astro` - link styling
- `src/layouts/Project.astro` - remove ProjectHeader
- `src/pages/projects/[slug].astro` - remove ProjectHeader import

## Complexity Tracking

> No constitution violations to justify. This is pure CSS/styling work.

## Phase 0: Research

**Status**: Complete - no unknowns

The technical approach is straightforward:
1. Vanta sky color: Change `--vanta-sky` CSS variable from `#0d1117` (dark) to `#87CEEB` (light blue)
2. App bar positioning: Modify `nav.css` to remove `left: 50%; transform: translateX(-50%);` and use standard left alignment with max-width constraint
3. App bar height: Reduce `--nav-height-expanded` from 72px to ~52px
4. Project pages: Remove `<ProjectHeader />` component from project layout and all project detail pages
5. Logo/links: Ensure AppBar.astro matches styling from original Hugo site's app-bar.css

## Phase 1: Design & Contracts

**Status**: Not applicable for UI styling change

No data model, API contracts, or complex architecture. This is pure CSS/styling modification.

### Files to Modify

| File | Change |
|------|--------|
| `src/styles/global.css` | Change `--vanta-sky: #0d1117` to `--vanta-sky: #87CEEB` |
| `src/styles/nav.css` | Remove center positioning, reduce height, adjust border-radius |
| `src/components/nav/AppBar.astro` | Update link colors to match original site |
| `src/layouts/Project.astro` | Remove ProjectHeader component usage |
| `src/pages/projects/*.astro` | Remove ProjectHeader imports |

### Visual Reference

Original Hugo site app bar (baseetStudioWebSIte/layouts/partials/header.html):
- Position: Left-aligned, full-width with max-width: 1280px
- Height: ~60px (1rem padding top/bottom)
- Links: `#171d1c` default, `#496bc1` on hover/active
- Active indicator: 2px gradient underline (#496bc1 to #fbcd37)

## Phase 2: Implementation Notes

*(Will be detailed in tasks.md via /speckit.tasks command)*

Key implementation steps:
1. Update global.css with light blue sky color
2. Restyle nav.css for left-aligned compact header
3. Update AppBar.astro link styling
4. Remove ProjectHeader from Project.astro layout
5. Remove ProjectHeader imports from all project detail pages
6. Verify changes with visual inspection at mobile (375px), tablet (768px), desktop (1280px)