# Implementation Plan: Site 2 UI Enhancements

**Branch**: `002-site2-ui-enhancements` | **Date**: 2026-05-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-site2-ui-enhancements/spec.md`

## Summary

Four-track UI enhancement for the Astro-based baseetstudiosite2 project:
1. Replace the shared generic project template with 12 individual project layouts (7 branded with unique designs, 5 standard with case-study format)
2. Redesign footer to match reference site, polish contact page with two-column layout, and implement a glassmorphic side-popup mobile navigation sidebar
3. Migrate all icons from Font Awesome (CDN-dependent) to Phosphor SVGs stored locally in the project root
4. Fix a rendering bug causing duplicate app bar visibility on mobile viewports

## Technical Context

**Language/Version**: TypeScript 5.x, Astro 5.x  
**Primary Dependencies**: Astro (SSG), Tailwind CSS 4.x, GSAP (animations), Vanta.js (clouds background)  
**Storage**: N/A (static site, content via JSON data files and Astro `.astro` templates)  
**Testing**: Manual visual verification at 375px, 768px, 1280px breakpoints; `npm run build` for build validation  
**Target Platform**: Web browsers (mobile, tablet, desktop); static HTML/CSS/JS output to `dist/`  
**Project Type**: Web (Astro SSG — single frontend project)  
**Performance Goals**: Lighthouse score > 90; page load < 3s on 3G; no external icon requests  
**Constraints**: Zero external icon dependencies (Phosphor SVGs must be self-contained); all pages must support both EN and AR locales; mobile sidebar must open/close within 200ms  
**Scale/Scope**: 12 project pages, 1 contact page, 1 footer component, 1 app bar component, ~60+ icon replacements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Performance & Core Web Vitals | ✅ PASS | Removing Font Awesome CDN improves load time. SVG icons are smaller than icon fonts. Static Astro output already minified. |
| II. Bilingual Parity | ✅ PASS | All pages already have EN/AR routing via `/ar/` prefix. Footer and mobile sidebar must continue supporting RTL via `dir="rtl"` attribute. |
| III. Content-Data Separation | ✅ PASS | Project content lives in `projects.json` (data). Templates are structural. New project layouts read from existing data source. |
| IV. Static-First Architecture | ✅ PASS | Astro outputs static HTML. Contact form delegates to external Worker. No server runtime dependency introduced. |
| V. Visual & Brand Consistency | ⚠️ NOTE | Constitution references Hugo-specific color profile (`#171D1C`, `#496BC1`, etc.). The Astro site uses CSS custom properties (`--color-primary`, `--color-dark`, `--color-light`). Project layouts use per-project `--project-color` and `--project-gradient`. This is compliant with the spirit of the principle (brand consistency via design tokens) even though the specific hex values differ from the Hugo site's `tailwind.config.js` approach. |

**Gate Result (Pre-Design)**: PASS — no violations. The Hugo-specific tech stack section of the constitution does not apply to this Astro project; only the 5 core principles are relevant.

**Re-evaluation (Post-Phase 1 Design)**:

| Principle | Status | Verification |
|-----------|--------|-------------|
| I. Performance | ✅ STILL PASS | Phosphor SVGs smaller than Font Awesome CDN payload. Icon.astro includes raw SVG inline (no extra requests). Sidebar uses CSS transitions (GPU-accelerated). |
| II. Bilingual Parity | ✅ STILL PASS | All new components accept `lang` prop. MobileSidebar includes RTL support (slide direction). Footer nav links use `/ar/` prefix routing. |
| III. Content-Data Separation | ✅ STILL PASS | No content hardcoded in new templates. ProjectFeatureCard, Testimonial, FAQ all read from props (which come from projects.json). |
| IV. Static-First | ✅ STILL PASS | No new server dependencies. Icon SVGs served as static files. Contact form still delegates to existing Worker endpoint. |
| V. Brand Consistency | ✅ STILL PASS | Project colors continue via `--project-color`/`--project-gradient` CSS custom properties. New components respect these variables. |

## Project Structure

### Documentation (this feature)

```text
specs/002-site2-ui-enhancements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
baseetstudiosite2/
├── src/
│   ├── components/
│   │   ├── icons/                  # NEW: Phosphor SVG icon components
│   │   │   ├── Icon.astro          # Generic icon component (renders SVG by name)
│   │   │   └── iconMappings.ts     # Font Awesome → Phosphor filename mappings
│   │   ├── nav/
│   │   │   ├── AppBar.astro        # MODIFIED: Add mobile sidebar markup
│   │   │   ├── AppBar.ts           # MODIFIED: Mobile sidebar open/close logic
│   │   │   └── MobileSidebar.astro # NEW: Glassmorphic mobile sidebar panel
│   │   ├── project/
│   │   │   ├── ProjectGallery.astro    # Existing, may need icon updates
│   │   │   ├── ProjectCTA.astro        # Existing, may need icon updates
│   │   │   ├── ProjectHeader.astro     # UNUSED, candidate for removal
│   │   │   ├── ProjectFeatureCard.astro # NEW: Reusable feature card with Phosphor icon
│   │   │   ├── ProjectTestimonial.astro # NEW: Reusable testimonial block
│   │   │   └── ProjectFAQ.astro         # NEW: Reusable FAQ accordion
│   │   └── shared/
│   │       ├── Footer.astro         # MODIFIED: Redesigned with Phosphor social icons
│   │       ├── ContactForm.astro    # Existing, may need minor updates
│   │       └── LanguageSwitcher.astro # Existing, no changes
│   ├── layouts/
│   │   ├── Base.astro               # Existing, no structural changes
│   │   ├── Page.astro               # Existing, no changes
│   │   └── Project.astro            # Existing, passes project color/gradient
│   ├── pages/
│   │   ├── contact.astro            # MODIFIED: Redesigned two-column layout
│   │   └── projects/
│   │       ├── index.astro          # MODIFIED: Update icons to Phosphor
│   │       ├── zaryn.astro          # REWRITE: Branded layout (dashboard mockup hero, bento features, tech stack, CTA)
│   │       ├── medev.astro          # REWRITE: Branded layout
│   │       ├── chopshop.astro       # REWRITE: Branded layout
│   │       ├── deshikitchen.astro   # REWRITE: Branded layout
│   │       ├── moneybox.astro       # REWRITE: Branded layout
│   │       ├── numu.astro           # REWRITE: Branded layout (centered hero, floating icons, carousel features)
│   │       ├── matrix.astro         # REWRITE: Branded layout
│   │       ├── photorestore-ai.astro     # REWRITE: Standard/case-study layout
│   │       ├── medical-education-app.astro # REWRITE: Standard/case-study layout
│   │       ├── nss-virtual-education-fair.astro # REWRITE: Standard/case-study layout
│   │       ├── bd-railway-automated-timetable.astro # REWRITE: Standard/case-study layout
│   │       ├── malaysian-business-websites.astro   # REWRITE: Standard/case-study layout
│   │       └── [slug]/
│   │           ├── features.astro   # MODIFIED: Icon updates
│   │           ├── demo.astro       # MODIFIED: Icon updates
│   │           └── terms.astro      # MODIFIED: Icon updates
│   ├── styles/
│   │   ├── nav.css                  # MODIFIED: Mobile sidebar styles
│   │   ├── global.css               # MODIFIED: Remove Font Awesome import if any
│   │   └── projects/                # NEW: Project-specific styles
│   │       ├── zaryn.css            # Zaryn bento grid, dashboard mockup styles
│   │       ├── numu.css             # Numu floating icons, carousel styles
│   │       ├── matrix.css           # Matrix-specific styles
│   │       ├── moneybox.css         # MoneyBox-specific styles
│   │       ├── deshikitchen.css     # DeshiKitchen-specific styles
│   │       ├── chopshop.css         # ChopShop-specific styles
│   │       └── medev.css            # Medev-specific styles
│   └── content/data/
│       ├── projects.json            # Existing, no changes needed
│       ├── links.json               # MODIFIED: Remove font_awesome external URL
│       └── footer.json              # Existing, icon field references updated
├── public/
│   └── icons/                       # NEW: Copied Phosphor SVGs for static serving
│       ├── regular/                 # Copied from phosphor-icons/SVGs/regular/
│       ├── bold/                    # Copied from phosphor-icons/SVGs/bold/
│       └── fill/                    # Copied from phosphor-icons/SVGs/fill/
└── phosphor-icons/                  # SOURCE: Existing at project parent level
    └── SVGs/                        # Source directory for SVG copies
```

**Structure Decision**: Single Astro project. Phosphor SVG files copied from `site/phosphor-icons/SVGs/` into `public/icons/` for static serving at build time. A new `Icon.astro` component wraps SVG file inclusion. Project pages rewritten individually per the branded/standard patterns from the reference Hugo site, adapted for Astro's component model.

## Complexity Tracking

No constitution violations to justify.
