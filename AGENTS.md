# baseetstudiosite2 Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-06-03

## Active Technologies

- TypeScript 5.x, Astro 5.x + Astro (SSG), Tailwind CSS 4.x, GSAP (animations), Vanta.js (clouds background) (002-site2-ui-enhancements)
- TypeScript 5.x, Astro 5.x + Astro (SSG), Tailwind CSS 4.x, GSAP, Vanta.js, Phosphor SVG icons (local), Node.js ESM build scripts, AR mirror route tree (003-round-3-migration)

## Project Structure

```text
src/
scripts/   # NEW: build-time helpers (copy-phosphor-icons, verify-icons)
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x, Astro 5.x: Follow standard conventions

## Recent Changes

- 003-round-3-migration: Added Phosphor SVG local copy, AR mirror route tree (src/pages/ar/), visitor detection (src/scripts/visitor-detect.ts), data migration to links.json/team.json, fixed project subpage 404 (AppBar URL builder), language switcher (removed stale data-astro-reload), project page padding (≥140px), CSS recovery (focus-visible, hover transitions, reduced-motion), clover-bold.svg as main logo
- 002-site2-ui-enhancements: Added TypeScript 5.x, Astro 5.x + Astro (SSG), Tailwind CSS 4.x, GSAP (animations), Vanta.js (clouds background)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
