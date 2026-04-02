# Contract: Branded Page Layout (layouts/projects/branded.html)

**Extends**: `baseof.html`  
**Triggered by**: `layout: branded` in content front matter  
**Purpose**: Render a full branded landing page for a product with its own identity

## Template Context

The template receives the standard Hugo page context (`.`) with the content page's front matter accessible via `.Params`.

## Required Front Matter Fields

```yaml
layout: branded
project:
  brandName: string        # REQUIRED — displayed in app bar
  navItems: []NavItem      # REQUIRED — product app bar navigation
  bgEffect: string         # REQUIRED — background renderer identifier
  bgFallbackGradient: string # REQUIRED — CSS gradient for non-WebGL fallback
  name: string             # REQUIRED — product name
  slug: string             # REQUIRED — URL slug
  color: string            # REQUIRED — hex color
  gradient: string         # REQUIRED — CSS gradient
  hero: Hero               # REQUIRED — hero section data
  features: []Feature      # REQUIRED — features list
  status: string           # REQUIRED — product status
```

## Sections Rendered (in order)

1. **Background Effect** — Loaded based on `project.bgEffect`
2. **Branded App Bar** — Via `shared/header.html` partial (adaptive mode)
3. **Hero Section** — Product hero with CTA buttons
4. **Features Section** — Feature grid cards
5. **Gallery/Screenshots** — If screenshots provided
6. **Download/Demo Section** — Platform links or demo request
7. **Testimonials** — If testimonials provided
8. **FAQ** — If FAQ provided
9. **Contact Section** — Embedded contact form via `contact-form.html` partial
10. **Footer** — Standard studio footer

## CSS Variables Injected

```css
:root {
  --project-color: {{ .Params.project.color }};
  --project-gradient: {{ .Params.project.gradient }};
  --bg-fallback: {{ .Params.project.bgFallbackGradient }};
}
```

## Blocks Defined

- `main` — All branded page content
- `css` — Product-specific CSS (branded-effects.css, product color variables)
- `js` — Product-specific JS (background effect renderer)

## i18n Keys Used

- `back_to_baseet` — "Back to Baseet" / "العودة إلى بصيت"
- `project_features_title` — "Features" section heading
- `project_download_title` — "Download" section heading
- `project_demo_title` — "Demo" section heading
- `contact_title` — Contact section heading
- All existing project i18n keys (`project_<slug>_*`)
