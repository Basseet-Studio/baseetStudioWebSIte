# Component Contracts: Site 2 UI Enhancements

**Phase**: 1 — Design & Contracts  
**Date**: 2026-05-22

## Overview

Since this is a static Astro site with no REST/GraphQL API, "contracts" define the component interfaces, reusable prop types, and data file schemas that ensure consistency across the 12 project pages and shared components.

---

## Contract 1: Icon.astro — Phosphor SVG Icon Component

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `name` | `string` | ✅ Yes | — | Phosphor icon filename without extension or variant suffix (e.g., `"apple-logo"`, `"cash-register"`) |
| `size` | `number` | No | `24` | Width and height in pixels |
| `color` | `string` | No | `"currentColor"` | CSS color value applied via SVG `fill` |
| `variant` | `"regular"` \| `"bold"` \| `"fill"` | No | `"regular"` | Which Phosphor variant subdirectory to load from |
| `class` | `string` | No | `""` | Additional CSS class(es) for the wrapper element |
| `ariaLabel` | `string` | No | `name` | Accessible label for screen readers |

### Usage Example

```astro
---
import Icon from '../components/icons/Icon.astro'
---

<!-- Basic usage -->
<Icon name="hospital" size={32} color="var(--color-primary)" />

<!-- Brand logo with bold variant -->
<Icon name="apple-logo" size={24} variant="bold" />

<!-- With explicit aria label -->
<Icon name="github-logo" size={20} ariaLabel="GitHub" />
```

### Contract (TypeScript Interface)

```typescript
interface IconProps {
  name: string;
  size?: number;        // default: 24
  color?: string;       // default: "currentColor"
  variant?: "regular" | "bold" | "fill";  // default: "regular"
  class?: string;       // default: ""
  ariaLabel?: string;   // default: props.name
}
```

### Render Output

```html
<span class="phosphor-icon" style="width:24px;height:24px;color:var(--color-primary);" aria-label="hospital" role="img">
  <!-- Raw SVG content from /icons/regular/hospital.svg -->
  <svg ...>...</svg>
</span>
```

### Validation Rule

- If the SVG file at `public/icons/{variant}/{name}.svg` does not exist, render a fallback empty `<span>` of the same dimensions.

---

## Contract 2: MobileSidebar.astro — Mobile Navigation Panel

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `links` | `NavLink[]` | ✅ Yes | — | Array of navigation link objects |
| `lang` | `"en"` \| `"ar"` | ✅ Yes | — | Current locale for RTL support |
| `toggleId` | `string` | No | `"mobile-toggle"` | DOM ID of the hamburger toggle button |
| `menuId` | `string` | No | `"mobile-sidebar"` | DOM ID of the sidebar panel |
| `backdropId` | `string` | No | `"mobile-backdrop"` | DOM ID of the backdrop overlay |

### NavLink Type

```typescript
interface NavLink {
  label: string;
  url: string;
  i18nKey?: string;     // for data-page attribute on AppBar
}
```

### Usage Example

```astro
---
import MobileSidebar from '../components/nav/MobileSidebar.astro'

const links = [
  { label: 'Home', url: '/', i18nKey: 'home' },
  { label: 'Work', url: '/projects/', i18nKey: 'projects' },
  { label: 'Services', url: '/services/', i18nKey: 'services' },
  { label: 'Clients', url: '/clients/', i18nKey: 'clients' },
  { label: 'Contact', url: '/contact/', i18nKey: 'contact' },
]
---

<MobileSidebar links={links} lang="en" />
```

### Contract: HTML Output

```html
<!-- Backdrop overlay -->
<div id="mobile-backdrop" class="mobile-sidebar-backdrop" aria-hidden="true"></div>

<!-- Sidebar panel -->
<nav id="mobile-sidebar" class="mobile-sidebar" aria-label="Mobile navigation" aria-hidden="true">
  <ul class="mobile-sidebar__links">
    <li><a href="/" class="mobile-sidebar__link">Home</a></li>
    <li><a href="/projects/" class="mobile-sidebar__link">Work</a></li>
    <li><a href="/services/" class="mobile-sidebar__link">Services</a></li>
    <li><a href="/clients/" class="mobile-sidebar__link">Clients</a></li>
    <li><a href="/contact/" class="mobile-sidebar__link">Contact</a></li>
  </ul>
</nav>
```

### Behavioral Contract

1. **Open**: Toggle button click → add `.open` to sidebar and backdrop → `aria-expanded="true"` on toggle → `aria-hidden="false"` on sidebar → `overflow: hidden` on body
2. **Close**: Backdrop click OR any link click OR Escape key OR window resize above 768px → remove `.open` → restore aria states → restore body overflow
3. **RTL**: When `lang === "ar"`, sidebar slides from the left edge (`translateX(-100%)` → `translateX(0)`) instead of the right

---

## Contract 3: Footer.astro — Redesigned Footer

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `lang` | `"en"` \| `"ar"` | No | `"en"` | Current locale |

### Data Sources

- `footer.json`: Navigation links, copyright text
- `links.json`: Social media URLs, contact email, phone, WhatsApp

### Contract: Social Icon List

Footer MUST render social links for these platforms (if URL exists in `links.json`):

| Platform | Phosphor Icon | links.json key |
|----------|---------------|----------------|
| Instagram | `instagram-logo` | `social.instagram` |
| LinkedIn | `linkedin-logo` | `social.linkedin` |
| X/Twitter | `x-logo` | `social.twitter` |
| GitHub | `github-logo` | `social.github` |
| Dribbble | `dribbble-logo` | `social.dribbble` |
| Facebook | `facebook-logo` | `social.facebook` |
| YouTube | `youtube-logo` | `social.youtube` |
| TikTok | `tiktok-logo` | `social.tiktok` |

### Contract: Layout Zones

```
┌────────────────────────────────────────────────┐
│ [Logo "Baseet Studio"]  [Nav Links]  [WhatsApp] │  Row 1
├────────────────────────────────────────────────┤
│ [Social Icons (8)]  [Copyright]  [Email|Phone]  │  Row 2
└────────────────────────────────────────────────┘
```

---

## Contract 4: Project Page — Branded Layout

Each branded project page (7 total) MUST follow this structural contract:

### Required Sections (by order)

1. **Hero Section**: Unique per-project visual treatment
   - Project icon (Phosphor SVG)
   - Project name + tagline
   - Status badge
   - Hero title + subtitle
   - CTA button(s)
   - Visual element (dashboard mockup, floating icons, etc.)
   - MUST apply `--project-color` and `--project-gradient` CSS custom properties

2. **Features Section**: Grid or carousel of feature cards
   - Uses `ProjectFeatureCard.astro` (shared)
   - 3-6 features per project
   - Each card: icon (Phosphor), title, description

3. **Screenshot Gallery**: Reuse `ProjectGallery.astro` (existing)

4. **Testimonials Section**: (if testimonials exist in data)
   - Uses `ProjectTestimonial.astro` (shared)

5. **FAQ Section**: (if FAQ entries exist in data)
   - Uses `ProjectFAQ.astro` (shared)
   - Accordion pattern (details/summary)

6. **CTA Section**: Gradient call-to-action block
   - Uses project gradient as background
   - "Get in Touch" link to /contact/

### Injected CSS Variables

```css
:root {
  --project-color: /* from project.color */;
  --project-gradient: /* from project.gradient */;
}
```

---

## Contract 5: Project Page — Standard/Case Study Layout

Each standard project page (5 total) MUST follow this structural contract:

### Required Sections (by order)

1. **Hero Section**: Clean case-study hero
   - Back to projects link
   - Project icon (Phosphor SVG)
   - Project name + tagline
   - Hero title + subtitle
   - CTA button(s)

2. **Challenge Section**: Problem definition paragraph

3. **Solution Section**: How the project addressed the challenge

4. **Results Section**: Outcome metrics or impact

5. **Technology Section**: Technology stack used

6. **CTA Section**: Gradient call-to-action block

---

## Contract 6: Contact Page Layout

### Required Zones

```
┌──────────────────────────────────────────┐
│  [Badge] "Get in Touch"                   │
│  [Heading] Large heading                  │
│  [Subtitle] Response time notice          │
├────────────────────┬─────────────────────┤
│  Contact Form      │  Contact Info        │
│  (2/3 width)       │  (1/3 width)         │
│  - Name            │  - Email (icon+)     │
│  - Email           │  - Phone (icon+)     │
│  - Phone           │  - Address (icon+)   │
│  - Subject         │  - WhatsApp CTA      │
│  - Message         │  - Social Links      │
│  - Submit btn      │  - Response time     │
├────────────────────┴─────────────────────┤
```

### Form Validation Contract

| Field | Required | Validation |
|-------|----------|------------|
| Name | ✅ Yes | Min 2 chars, max 100 |
| Email | ✅ Yes | Valid email format (regex) |
| Phone | No | If provided, valid phone format |
| Subject | No | Max 200 chars |
| Message | ✅ Yes | Min 10 chars, max 5000 |

Error state: Red border on input + error message below field. Success state: Inline confirmation or redirect.

---

## Contract 7: Font Awesome → Phosphor Icon Mapping

Full mapping table in `src/components/icons/iconMappings.ts`. This is the authoritative source for icon name resolution.

### Resolution Algorithm

```typescript
function resolveIcon(faClass: string): { name: string; variant?: "regular" | "bold" } {
  const direct = FA_TO_PHOSPHOR[faClass];
  if (direct) return { name: direct, variant: "regular" };
  
  // Try with bold suffix if not found
  const boldAttempt = FA_TO_PHOSPHOR_BOLD[faClass];
  if (boldAttempt) return { name: boldAttempt, variant: "bold" };
  
  // Fallback
  console.warn(`No Phosphor mapping for: ${faClass}`);
  return { name: "circle", variant: "regular" };
}
```
