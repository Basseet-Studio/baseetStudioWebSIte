# Research: Site 2 UI Enhancements

**Phase**: 0 — Outline & Research  
**Date**: 2026-05-22  
**Feature**: [spec.md](./spec.md)

## 1. Project Layout Architecture

### Decision: Per-project Astro page files with shared optional components

**Rationale**: The reference Hugo site has 7 individual branded project layout files (`zaryn.html`, `numu.html`, `matrix.html`, etc.) plus a generic `branded.html` fallback and a `single.html` for client projects. Each branded layout injects project-specific CSS, Google Fonts, GSAP animations, and custom HTML structure. The Astro equivalent is individual `.astro` page files that compose from shared components (`ProjectFeatureCard`, `ProjectTestimonial`, `ProjectFAQ`, `ProjectCTA`, `ProjectGallery`) but control their own hero section layout and section ordering.

**Alternatives considered**:
- Dynamic template switching via `layoutVariant` field in JSON: Rejected — each branded project has fundamentally different hero visuals (Zaryn's dashboard mockup, Numu's floating icons, Matrix's futuristic theme). A generic template would require excessive conditional rendering.
- Single generic template with slot-based composition: Rejected — would not achieve the "unique layout" requirement from the spec.

### Branded vs Standard Layout Patterns (from reference site analysis)

| Project | Type | Hero Style | Key Differentiators | Font |
|---------|------|-----------|-------------------|------|
| Zaryn | Branded | Split-screen with dashboard mockup | Bento grid features, tech stack pills | Space Grotesk + Inter |
| Numu | Branded | Centered with floating icons | Gallery before features, horizontal scroll carousel | Quicksand + Nunito |
| Matrix | Branded | Dark theme, glow effects | Premium futuristic styling | (project-specific) |
| Medev | Branded | Medical-themed | Health-sector styling | (project-specific) |
| ChopShop | Branded | E-commerce themed | Retail/store styling | (project-specific) |
| DeshiKitchen | Branded | Restaurant-themed | Food-service styling | (project-specific) |
| MoneyBox | Branded | Finance-themed | Savings/banking styling | (project-specific) |
| PhotoRestore AI | Standard | Case study | Challenge → Solution → Results | Default |
| Medical Education | Standard | Case study | Challenge → Solution → Results | Default |
| NSS Virtual Fair | Standard | Case study | Challenge → Solution → Results | Default |
| BD Railway | Standard | Case study | Challenge → Solution → Results | Default |
| Malaysian Business | Standard | Case study | Challenge → Solution → Results | Default |

**Adaptation strategy**: For branded projects, recreate the hero section unique to each project from the Hugo templates. Use the shared component library for features, gallery, FAQ, and CTA sections. For standard projects, use a consistent case-study layout with sections for Challenge, Solution, Results, and Technology Used.

## 2. Mobile Sidebar Navigation Pattern

### Decision: Separate `MobileSidebar.astro` component with glassmorphic CSS

**Rationale**: The reference Hugo site implements a mobile sidebar as a separate `<nav>` element (not nested inside the header) with `#shared-mobile-menu` ID, alongside a `#shared-mobile-backdrop` overlay. The sidebar slides from `translateX(100%)` to `translateX(0)` and the backdrop fades in. This pattern is cleaner than the current Astro implementation which toggles the inline `app-bar__links` UL visibility.

**Implementation specifics**:
- Breakpoint: `< 768px` (matching reference site)
- Sidebar width: `280px` / `max-width: 85vw`
- Animation: `transform: translateX(100%)` → `translateX(0)` with `transition: transform 0.3s ease`
- Glassmorphic styling: `backdrop-filter: blur(20px)`, semi-transparent background, border
- Backdrop: `position: fixed`, `inset: 0`, `background: rgba(0,0,0,0.5)`, `transition: opacity 0.3s`
- Body scroll lock: `overflow: hidden` when open
- Close triggers: backdrop click, any nav link click, Escape key, window resize > 768px
- Accessibility: `aria-expanded` on toggle, `aria-hidden` on menu, `aria-label` on both

**Alternatives considered**:
- Pure CSS sidebar (checkbox hack): Rejected — cannot sync with keyboard Escape key or window resize
- Overlay/dropdown menu: Rejected — spec explicitly requires "side popup" slide-in panel

## 3. Phosphor Icon Integration

### Decision: Copy SVGs to `public/icons/`, create `Icon.astro` component with name-based lookup

**Rationale**: The user specified: "use the actual SVGs from baseetstudiowebsite, all SVG files are in root, use those directly." The Phosphor icon SVGs exist at `site/phosphor-icons/SVGs/` with 1512 unique icons across regular, bold, fill, duotone, light, and thin variants. Copying the regular and bold variants to `public/icons/` makes them available as static assets at build time. A thin `Icon.astro` component wraps the SVG file include with props for name, size, color, and variant.

**Usage pattern**:
```astro
<Icon name="apple-logo" size={24} color="var(--color-light)" />
<Icon name="github-logo" size={20} variant="bold" />
```

**Font Awesome → Phosphor Mapping**:

All 60+ Font Awesome icon references across the codebase mapped to Phosphor SVG filenames. Key mappings documented in `src/components/icons/iconMappings.ts`. Critical brand logos available:
- `instagram-logo.svg`, `linkedin-logo.svg`, `twitter-logo.svg` / `x-logo.svg`
- `github-logo.svg`, `dribbble-logo.svg`, `apple-logo.svg`, `android-logo.svg`
- `stripe-logo.svg`, `whatsapp-logo.svg`, `facebook-logo.svg`, `tiktok-logo.svg`

**Gaps** (no Phosphor equivalent — fallback strategy):
- `fab fa-docker` → Use `cube.svg` (generic fallback) — no Docker brand logo in Phosphor
- `fas fa-x-ray` → Use `stethoscope.svg` (medical context fallback)
- `fas fa-route` → Use `path.svg` (closest match)
- `fas fa-award` → Use `trophy.svg` (conceptual match)
- `fas fa-user-doctor` → Use `stethoscope.svg` (medical context)
- `fas fa-file-medical` → Use `first-aid.svg` (medical context)

**Alternatives considered**:
- @phosphor-icons/web npm package: Rejected — user explicitly wants local SVGs, no npm dependency
- Inline SVG sprite sheet: Considered but rejected — 1512 icons would create a large sprite file; per-icon file inclusion keeps per-page payloads small
- CDN-loaded Phosphor JS: Rejected — violates "no external dependency" requirement

## 4. Duplicate App Bar Investigation

### Decision: The duplicate is caused by Astro ViewTransitions retaining previous page's DOM

**Root cause analysis**: When navigating between pages with Astro ViewTransitions enabled, both the outgoing page's `<nav class="app-bar">` and the incoming page's `<nav class="app-bar">` can briefly co-exist during the transition morph. On mobile, the previous page's app bar may remain in the DOM behind the new one, especially if the transition fails to complete. Additionally, the `AppBar.astro` is always rendered inside `<body>` (in `Base.astro`) — if any page unintentionally renders a second `<nav class="app-bar">`, the duplicate would be visible.

**Verified**: The `ProjectHeader.astro` component exists in the codebase but is NOT imported anywhere (confirmed via grep — zero imports). No page renders a second AppBar. The issue is ViewTransitions-related: the `astro:before-swap` event or the morph animation retains the old app bar DOM node behind the new one.

**Fix strategy**:
1. Add explicit cleanup in `AppBar.ts` during `astro:before-swap` — remove any lingering app bar elements
2. Ensure the app bar has a unique transition name (`transition:name="app-bar"`) so ViewTransitions doesn't try to morph two different app bars
3. Verify the `<main>` content area does not include an additional app bar element
4. Add `data-astro-transition-persist` attribute if needed to prevent double-render

**Alternatives considered**:
- Disabling ViewTransitions entirely: Rejected — would lose page transition animations
- CSS `display: none` on duplicate: Rejected — hides symptom, doesn't fix root cause

## 5. Footer Redesign

### Decision: Adapt reference Hugo footer to Astro with Phosphor social icons

**Reference structure** (from Hugo `footer.html`):
- Row 1: Logo/tagline | Navigation links (Services, Projects, Customers, Contact) | WhatsApp CTA button
- Row 2: Social icons (GitHub, LinkedIn, X/Twitter, Instagram, Facebook, YouTube, Dribbble, TikTok) | Copyright | Contact info (email + WhatsApp)
- Optional: Visitor detection info

**Adaptation**: The current Astro footer already has a 3-column grid (logo, navigation, social). Extend to match the reference's richer content: add WhatsApp CTA, increase social icon count to 8 platforms, add visitor detection. Replace all `<i class="fab fa-*">` elements with `<Icon name="*-logo" />` components.

## 6. Contact Page Redesign

### Decision: Two-column layout matching reference site pattern

**Current state**: Simple page with `<ContactForm />` (2/3 width) and contact info (1/3 width). Already close to target.

**Changes needed**: 
- Add "Get in Touch" hero badge at top
- Improve visual hierarchy with proper spacing
- Add WhatsApp CTA in sidebar
- Add response time notice
- Replace emoji icons (✉, 📞, 📍) with Phosphor SVGs (`envelope.svg`, `phone.svg`, `map-pin.svg`)
- Ensure form validation messaging is clear

## 7. SVG Copy Strategy

### Decision: Selective copy of needed icons only

Rather than copying all 1512 icons (which would be ~4MB+), only copy the 60+ icons actually used. The copy list is derived from the Font Awesome → Phosphor mapping table. The copy happens during the implementation phase into `public/icons/regular/` and `public/icons/bold/`.

**Build-time consideration**: Astro's `public/` directory is copied as-is to `dist/`. No build processing needed. The `Icon.astro` component reads from `/icons/{variant}/{name}.svg` at runtime.

## Summary of Key Decisions

| Decision | Rationale |
|----------|----------|
| Individual .astro files per project | Each branded project has fundamentally different hero/section layout |
| Shared component library (FeatureCard, Testimonial, FAQ, CTA, Gallery) | Reuse common sections, customize only hero and section ordering per project |
| Separate MobileSidebar.astro component | Cleaner than inline toggling; matches reference pattern |
| Glassmorphic sidebar with backdrop overlay | Matches reference Hugo site behavior; spec requirement |
| Copy selected Phosphor SVGs to public/icons/ | Self-contained, no CDN, small per-page payload |
| Icon.astro wrapper component | Clean abstraction; props for name/size/color/variant |
| ViewTransitions cleanup in AppBar.ts | Root cause fix for duplicate app bar, not CSS workaround |
