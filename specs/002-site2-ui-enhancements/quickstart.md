# Quickstart: Site 2 UI Enhancements

**Phase**: 1 — Development Quickstart  
**Date**: 2026-05-22

## Prerequisites

- Node.js 20+ installed
- `npm install` already run in `baseetstudiosite2/`
- Phosphor SVG source at `../phosphor-icons/SVGs/` (relative to project root)

## Setup (one-time)

```bash
cd baseetstudiosite2

# Copy needed Phosphor SVGs into public/
mkdir -p public/icons/regular public/icons/bold
# Copy icons — see list in contracts/components.md or run the copy script
# (individual icon copy list TBD during implementation)

# Verify build
npm run build
```

## Development Workflow

### 1. Create shared components first

Files to create:
- `src/components/icons/Icon.astro` — Phosphor SVG wrapper
- `src/components/icons/iconMappings.ts` — FA→Phosphor mapping
- `src/components/nav/MobileSidebar.astro` — Glassmorphic mobile menu
- `src/components/project/ProjectFeatureCard.astro` — Reusable feature card
- `src/components/project/ProjectTestimonial.astro` — Reusable testimonial
- `src/components/project/ProjectFAQ.astro` — Reusable FAQ accordion

### 2. Update app bar

Modify `src/components/nav/AppBar.astro`:
- Add `<MobileSidebar>` component after the nav
- Connect hamburger toggle to sidebar IDs

Modify `src/components/nav/AppBar.ts`:
- Add mobile sidebar open/close logic
- Add ViewTransitions cleanup for duplicate app bar fix

Modify `src/styles/nav.css`:
- Add `.mobile-sidebar` and `.mobile-sidebar-backdrop` styles
- Define slide animation and glassmorphic appearance

### 3. Redesign footer

Modify `src/components/shared/Footer.astro`:
- Replace `<i class="fab fa-*">` with `<Icon name="*-logo">`
- Add WhatsApp CTA button
- Add Facebook, YouTube, TikTok icons
- Match reference site layout

### 4. Redesign contact page

Modify `src/pages/contact.astro`:
- Add hero badge and heading
- Replace emoji with Phosphor icons
- Add WhatsApp CTA sidebar section
- Add response time notice

### 5. Rewrite project pages

**Branded (7 pages)** — create individual layouts per the reference patterns:
- `zaryn.astro` — split-screen with dashboard mockup, bento grid features
- `numu.astro` — centered hero with floating icons, carousel features
- `matrix.astro` — dark/glow themed
- `medev.astro` — medical themed
- `chopshop.astro` — e-commerce themed
- `deshikitchen.astro` — restaurant themed
- `moneybox.astro` — finance themed

**Standard (5 pages)** — case-study format:
- `photorestore-ai.astro`
- `medical-education-app.astro`
- `nss-virtual-education-fair.astro`
- `bd-railway-automated-timetable.astro`
- `malaysian-business-websites.astro`

### 6. Update sub-pages

Modify `[slug]/features.astro`, `[slug]/demo.astro`, `[slug]/terms.astro`:
- Replace `<i class="fas fa-*">` with `<Icon name="*">`

### 7. Clean up

- Remove `public/vendor/fontawesome-free/` if committed
- Remove `src/components/project/ProjectHeader.astro` (unused)
- Remove `links.json` → `external.font_awesome` entry

## Testing Checklist

- [ ] All 12 project pages render distinct layouts
- [ ] Footer appears on all pages with 8 social icons
- [ ] Contact form validates required fields
- [ ] Mobile hamburger opens glassmorphic sidebar with slide animation
- [ ] Sidebar closes on link click, backdrop click, Escape
- [ ] Sidebar body scroll lock works
- [ ] RTL (Arabic) renders correctly on all pages
- [ ] Zero external icon requests in Network tab
- [ ] Exactly one app bar visible on mobile at all scroll positions
- [ ] `npm run build` succeeds
- [ ] All pages pass at 375px, 768px, 1280px widths

## Key Files to Reference

| File | Purpose |
|------|---------|
| `spec.md` | Feature requirements and acceptance criteria |
| `research.md` | Architecture decisions and rationale |
| `data-model.md` | Component props and data structures |
| `contracts/components.md` | Component interface contracts |
| `../baseetStudioWebSIte/layouts/projects/` | Hugo reference layouts |
| `../baseetStudioWebSIte/layouts/partials/shared/header.html` | Reference mobile sidebar |
| `../baseetStudioWebSIte/layouts/partials/shared/footer.html` | Reference footer |
| `src/content/data/projects.json` | Project data (all 12 projects) |
| `../phosphor-icons/SVGs/regular/` | Phosphor SVG source |
