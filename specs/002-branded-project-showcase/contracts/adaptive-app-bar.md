# Contract: Adaptive App Bar (layouts/partials/shared/header.html)

**Purpose**: Dynamically render studio or product-specific branding and navigation based on page context.

## Interface

The partial receives the standard Hugo page context (`.`) and determines the app bar mode by checking for branded page front matter.

## Decision Logic

```
IF .Page.Params.project.brandName exists AND .Page.Layout == "branded"
  → BRANDED MODE
ELSE
  → STUDIO MODE
```

## Studio Mode (default)

| Element | Source | Value |
|---------|--------|-------|
| Logo text | `{{ i18n "logo_text" }}` | "Baseet Studio" |
| Logo link | `{{ "/" \| relLangURL }}` | Homepage |
| Nav items | `{{ range site.Menus.main }}` | Home, Services, Projects, Clients, Contact |
| Language switcher | `{{ partial "language-switcher.html" . }}` | EN / ع |
| Mobile menu | Same nav items as desktop | Slide-in sidebar |

## Branded Mode

| Element | Source | Value |
|---------|--------|-------|
| Logo text | `.Page.Params.project.brandName` | e.g., "Nomu" |
| Logo image | `.Page.Params.project.brandLogo` | Optional SVG/PNG |
| Logo link | `#home` | Scroll to top of current page |
| Logo color | `.Page.Params.project.color` | Product brand color |
| Nav items | `{{ range .Page.Params.project.navItems }}` | Product-specific items |
| Back to Baseet | Hardcoded | `{{ "/" \| relLangURL }}` with i18n text |
| Language switcher | Same as studio mode | EN / ع |
| Mobile menu | Same nav items as desktop + Back to Baseet | Slide-in sidebar |

## NavItem Schema

```yaml
navItems:
  - label: string     # Display text (i18n key or literal)
    url: string        # Anchor (#features) or relative path
    i18nKey: string    # Optional — i18n key for label translation
```

## CSS Contract

- App bar MUST have `background: white` in both modes
- Branded mode logo uses `color: {{ .Page.Params.project.color }}` instead of `#496bc1`
- Active nav link underline uses product gradient instead of studio gradient
- "Back to Baseet" link styled distinctly (e.g., outlined, with arrow icon)

## Accessibility Contract

- `aria-label` on logo reflects current brand context
- Mobile menu `aria-expanded` toggling preserved
- Skip-to-content link always present
- All nav links have descriptive text
- "Back to Baseet" link has `aria-label` explaining navigation context

## Responsive Contract

- Desktop (>768px): Horizontal nav bar
- Mobile (≤768px): Hamburger → slide-in sidebar
- Product branding preserved in both breakpoints
