# Research: Project Pages Redesign

**Feature**: 003-project-pages-redesign  
**Date**: 2026-04-15  
**Purpose**: Resolve all technical unknowns before Phase 1 design

---

## R-001: Hugo Sub-Page Strategy (Section Bundles vs. Leaf Bundles)

**Decision**: Convert each of the 5 project content files from flat files (`content/projects/money-box.md`) to **section bundles** (`content/projects/money-box/_index.md`) with child leaf pages for features, demo, and terms.

**Rationale**: Hugo section bundles are the idiomatic way to create URL hierarchies. A section page (`_index.md`) represents the project landing page, and child pages represent sub-pages. This produces clean URLs:
- `/projects/money-box/` → landing (section page, `_index.md`)
- `/projects/money-box/features/` → features (leaf page, `features.md`)
- `/projects/money-box/demo/` → demo (leaf page, `demo.md`)
- `/projects/money-box/terms/` → terms (leaf page, `terms.md`)

**Alternatives considered**:
- **Headless bundles + custom output formats**: Over-engineered for simple sub-pages
- **Shortcodes in a single page**: Produces a single URL, not standalone pages
- **Custom URL manipulation via `url:` in front matter**: Works but fragile and non-idiomatic

**Template lookup for sub-pages**: Child pages under `content/projects/money-box/features.md` will use Hugo's lookup order:
1. `layouts/projects/features.html` (if `layout: features` in front matter) ← **chosen approach**
2. `layouts/projects/single.html` (fallback)
3. `layouts/_default/single.html` (final fallback)

Each sub-page's front matter will specify `layout: features`, `layout: demo`, or `layout: terms` to select the correct template.

**Migration plan**: The existing flat files (e.g., `content/projects/money-box.md`) must be moved to `content/projects/money-box/_index.md`. Arabic variants (e.g., `money-box.ar.md`) become `_index.ar.md` in the same directory. This preserves existing URLs since Hugo generates section pages at the same path.

---

## R-002: Unique Layout Strategy Per Project

**Decision**: Create 5 named layout templates (`moneybox.html`, `numu.html`, `matrix.html`, `chopshop.html`, `deshikitchen.html`) in `layouts/projects/`. Each project's `_index.md` will specify its layout via front matter `layout: moneybox`.

**Rationale**: Named layouts give complete HTML control per project while keeping the Hugo convention of front-matter-driven template selection. This is cleaner than a single template with many conditionals.

**Layout differentiation matrix**:

| Project | Hero Style | Feature Display | Section Order | Unique Component |
|---------|-----------|-----------------|---------------|-----------------|
| Money Box | Split-screen (text left, phone mockup right) | Bento grid (mixed sizes) | Hero → Features → Gallery → FAQ → CTA | Savings calculator widget |
| Numu | Centered hero with floating habit icons | Horizontal scroll carousel | Hero → Gallery → Features → Testimonials → CTA | Streak counter animation |
| Matrix | Dark-themed diagonal split | Tabbed feature panels | Hero → Features → Integrations → FAQ → CTA | Terminal/code-style text reveal |
| Chopshop | Full-width hero with food imagery overlay | Alternating left-right feature rows | Hero → How It Works → Features → Platforms → CTA | Step-by-step ordering flow |
| Deshi Kitchen | Warm gradient hero with spice illustrations | Masonry card grid | Hero → Features → Gallery → Social Proof → CTA | Live order ticker mockup |

**Alternatives considered**:
- **Single template with conditional blocks**: Becomes unmaintainable with 5 distinct layouts. A 500+ line template with `{{ if eq .Params.project.slug "moneybox" }}` everywhere
- **CSS-only differentiation**: Cannot change section order or component type, only appearance

---

## R-003: Font Pairing Selections

**Decision**: Each project gets a unique Google Fonts heading + body pairing. Loaded via `<link rel="preconnect">` + `<link>` with `font-display: swap` in the project-specific CSS file.

| Project | Heading Font | Body Font | Personality |
|---------|-------------|-----------|-------------|
| Money Box | **Space Grotesk** (700) | **Inter** (400, 500) | Clean, fintech, trustworthy |
| Numu | **Quicksand** (600, 700) | **Nunito** (400, 500) | Soft, friendly, wellness |
| Matrix | **JetBrains Mono** (700) | **IBM Plex Sans** (400, 500) | Technical, developer-focused |
| Chopshop | **Outfit** (600, 700) | **DM Sans** (400, 500) | Modern, bold, marketplace |
| Deshi Kitchen | **Playfair Display** (700) | **Source Sans 3** (400, 500) | Elegant, culinary, warm |

**Rationale**: Each pairing targets a different emotional register matching the project's domain. All fonts are open-source (Google Fonts), widely cached, and support Latin character sets. Arabic text continues using the existing Noto Sans Arabic.

**Performance mitigation**:
- Preconnect to `fonts.googleapis.com` and `fonts.gstatic.com`
- `font-display: swap` prevents FOIT (Flash of Invisible Text)
- Only load needed weights (2-3 per project, ~20-40KB total)
- Fonts cached across visits via browser cache and Google CDN

**Alternatives considered**:
- **System font stack only**: Insufficient variety — only 3-4 distinct families available across platforms
- **Self-hosted fonts**: Heavier build pipeline, no CDN caching benefit
- **Variable fonts**: Good option but not all chosen fonts have variable versions

---

## R-004: GSAP Animation Assignments

**Decision**: Use GSAP 3.x (core + ScrollTrigger plugin, ~30KB gzipped) loaded from CDN. Each project gets 1-2 unique scroll-triggered effects.

| Project | GSAP Effect 1 | GSAP Effect 2 | Total Animations |
|---------|---------------|---------------|-----------------|
| Money Box | **Staggered card flip** — Feature cards flip in sequentially as they enter viewport | **Counter roll-up** — Numbers in savings stats animate from 0 to target | 2 |
| Numu | **Elastic bounce-in** — Elements enter with spring physics easing | — | 1 |
| Matrix | **Typewriter reveal** — Text characters type in one-by-one with cursor blink | **Glitch shift** — Subtle horizontal displacement on section headers | 2 |
| Chopshop | **Slide-from-edges** — Left/right alternating feature rows slide in from opposite edges | — | 1 |
| Deshi Kitchen | **Parallax depth layers** — Background and foreground elements scroll at different speeds within hero | **Scale-in masonry** — Cards scale from 0 to 1 with staggered timing | 2 |

**Loading strategy**:
```html
<!-- Only on project pages, in baseof.html or project layouts -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js" defer></script>
```

**Reduced motion respect**:
```js
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
gsap.registerPlugin(ScrollTrigger);
// ... animations
```

**Rationale**: GSAP ScrollTrigger is the industry standard for scroll-triggered animations. The ~30KB payload is justified by the requirement for 5 distinctly different animation effects that vanilla JS cannot replicate with enough variety.

**Alternatives considered**:
- **CSS `@keyframes` + Intersection Observer**: Already used on main site. Cannot do counter animations, physics easing, or staggered timelines
- **Anime.js**: Smaller but lacks ScrollTrigger equivalent; would need custom scroll detection
- **Motion One / Web Animations API**: Lighter but limited easing and timeline features

---

## R-005: Country & Device Detection Strategy

**Decision**: Client-side detection using a free geo-IP API + navigator User-Agent parsing. Results displayed in a small footer line.

**Country detection**:
- Primary API: `https://ipapi.co/json/` — Free tier: 1,000 requests/day, no API key required, returns JSON with `country_name`
- Fallback: `https://ip-api.com/json/?fields=country` — Free for non-commercial, 45 req/min
- Timeout: 3 seconds. On failure → display "Unknown"
- Cache result in `sessionStorage` to avoid repeat calls on navigation

**Device detection**:
- Parse `navigator.userAgent` for mobile/tablet/desktop classification
- Tablet: check for "iPad" or (Android + screen width > 600px)
- Mobile: check for "Mobile", "Android" (without tablet), "iPhone"
- Desktop: everything else
- No external library needed — simple regex matching

**Display format**: `Visiting from: [Country] · Device: [Type]`

**Security considerations**:
- No personally identifiable information stored
- No cookies set
- API response not logged or transmitted elsewhere
- `sessionStorage` only (cleared on tab close)
- Sanitize API response before DOM insertion to prevent XSS

**Rationale**: Lightweight solution that fulfills the diagnostic requirement without adding dependencies or violating the static-first architecture.

**Alternatives considered**:
- **Server-side detection via Nginx headers**: Violates static-first principle (Constitution IV)
- **MaxMind GeoLite2 local database**: Requires server-side processing or 50MB+ client-side DB
- **Cloudflare headers**: Only works behind Cloudflare; not portable

---

## R-006: Project-Specific App Bar Strategy

**Decision**: Create a new partial `layouts/partials/project-header.html` that renders the project-mode app bar. The existing `layouts/partials/header.html` remains unchanged. Each project layout template includes the project header instead of the main header by overriding a block in baseof.html.

**Implementation approach**:
1. Add a `{{ block "header" . }}{{ partial "header.html" . }}{{ end }}` to `layouts/baseof.html` (replacing the current direct partial include)
2. Each project layout template overrides the header block: `{{ define "header" }}{{ partial "project-header.html" . }}{{ end }}`
3. `project-header.html` reads navigation from `project.navItems` in front matter (already exists in content files)

**Navigation structure** (front matter in each project `_index.md`):
```yaml
project:
  navItems:
    - label: "Home"
      url: ""           # resolves to project landing page
    - label: "Features"
      url: "features/"
    - label: "Download"  # or "Demo" for web apps
      url: "demo/"
    - label: "Terms"
      url: "terms/"
  navMeta:
    - label: "Baseet"
      url: "/"           # back to main site
    - label: "Contact Us"
      url: "/contact/"   # main contact page
```

**Active link detection**: Compare current page's `.RelPermalink` suffix against nav item URLs.

**RTL support**: Same approach as current header — `dir="ltr"` on header element, flex-row-reverse utilities applied conditionally.

**Rationale**: Block override is the cleanest Hugo pattern for conditional partials. No JavaScript needed for the switch — it's purely template-driven based on which layout is active.

**Alternatives considered**:
- **Single header with JavaScript-driven mode switching**: Adds complexity, flash of wrong nav on load
- **Single header with Hugo conditionals**: Makes header.html unmaintainably complex
- **Separate baseof for project pages**: Over-engineered, duplicates the entire base template

---

## R-007: Terms Page Template Structure

**Decision**: Single shared template `layouts/projects/terms.html` used by all 5 projects. Template provides structural section headings; content is placeholder text marked for replacement.

**Section headings** (rendered by template, not content):
1. Introduction
2. Terms of Use
3. Privacy Policy
4. Data Collection & Usage
5. User Rights
6. Limitations of Liability
7. Contact Information

Each section renders an `<h2>` heading and a `<div class="placeholder-content">` with instructions like "Add your terms of use here." These placeholders are styled as subtle gray boxes with dashed borders to indicate they need filling.

**Branding**: Template reads `project.color`, `project.gradient`, and `project.fontFamily` from front matter to apply project-specific styling. The app bar shows project navigation with "Terms" as the active link.

**Rationale**: A single template with structural headings ensures consistency across all 5 projects while allowing per-project branding through CSS variables.

---

## R-008: Content Migration Strategy

**Decision**: Move existing flat content files to section bundle directories in a single migration step.

**Before**:
```
content/projects/
├── money-box.md
├── money-box.ar.md
├── chopshop.md
├── chopshop.ar.md
├── matrix.md
├── matrix.ar.md
├── deshikitchen.md
├── deshikitchen.ar.md
└── numu.md
└── numu.ar.md
```

**After**:
```
content/projects/
├── money-box/
│   ├── _index.md          (was money-box.md)
│   ├── _index.ar.md       (was money-box.ar.md)
│   ├── features.md
│   ├── features.ar.md
│   ├── demo.md
│   ├── demo.ar.md
│   ├── terms.md
│   └── terms.ar.md
├── chopshop/
│   └── ... (same structure)
├── matrix/
│   └── ...
├── deshikitchen/
│   └── ...
└── numu/
    └── ...
```

**URL preservation**: Hugo generates section pages at the same URL as the original flat file. `/projects/money-box/` continues to work after migration.

**Front matter changes**: Update `layout: branded` to `layout: moneybox` (etc.) in each `_index.md`. Add sub-page-specific front matter (layout, title, activeNav) to each features/demo/terms file.

**Risk**: Other projects (PhotoRestore AI, Medical Education App, etc.) remain as flat files and continue using `branded.html` layout unchanged. No impact on out-of-scope projects.
