# Data Model: Site 2 UI Enhancements

**Phase**: 1 — Design & Contracts  
**Date**: 2026-05-22  
**Feature**: [spec.md](./spec.md)

## Overview

This feature is primarily UI/presentation-layer. No new database entities, no API schema changes. The data model documentation covers the existing data structures used by the feature components and any new data fields needed.

## Existing Entities (Unchanged)

### Project (`projects.json`)

The `projects.json` array contains all project data and requires no structural changes. Each project entry already includes all fields needed by the new layouts:

| Field | Type | Description | Used By |
|-------|------|-------------|---------|
| `name` | string | Display name | Hero, page title |
| `slug` | string | URL segment | Routing |
| `type` | `"branded"` \| `"standard"` | Determines layout family | Layout selection |
| `tagline` | string | One-line description | Hero subtitle |
| `description` | string | Markdown content | Content section |
| `iconClass` | string | Font Awesome class (legacy) | Hero icon (mapped to Phosphor) |
| `color` | string | CSS color (hex) | `--project-color` |
| `gradient` | string | CSS gradient | `--project-gradient` |
| `status` | string | Project status | Status badge |
| `layoutVariant` | string | Layout variant name | (reserved for future use) |
| `features` | array | Feature objects | Features section |
| `platforms` | array | Platform objects | Demo/download section |
| `tech` | array? | Technology strings | Tech stack section (new usage) |
| `screenshots` | array | Screenshot objects | Gallery |
| `testimonials` | array | Testimonial objects | Testimonials section |
| `faq` | array | FAQ objects | FAQ section |
| `navItems` | array | Nav link objects | App bar project mode |
| `navMetaItems` | array | Meta link objects | App bar project mode |

### Footer Links (`footer.json`)

No structural changes. The `social` array's `icon` field values are mapped from Font Awesome classes to Phosphor filenames at render time (not in the data file).

### Links (`links.json`)

One field removed:
- **REMOVED**: `external.font_awesome` — no longer needed after Phosphor migration

All other fields unchanged (social links, contact info, project download links, form URL).

## New Entities

### Icon Mapping (`iconMappings.ts` — code, not data)

A TypeScript constant mapping Font Awesome class strings to Phosphor SVG filenames:

```typescript
type IconMapping = Record<string, string>;

const FA_TO_PHOSPHOR: IconMapping = {
  'fas fa-cash-register': 'cash-register',
  'fas fa-hospital': 'hospital',
  'fas fa-utensils': 'fork-knife',
  'fas fa-shopping-bag': 'shopping-bag',
  'fab fa-apple': 'apple-logo',
  'fab fa-android': 'android-logo',
  'fab fa-instagram': 'instagram-logo',
  'fab fa-linkedin-in': 'linkedin-logo',
  'fab fa-x-twitter': 'x-logo',
  'fab fa-github': 'github-logo',
  'fab fa-dribbble': 'dribbble-logo',
  // ... full mapping of 60+ icons
};
```

### Phosphor SVG File (`public/icons/{variant}/{name}.svg`)

Each icon is a standalone SVG file. The `Icon.astro` component reads the file at render time.

### Mobile Sidebar State (in-memory, browser)

Managed by `AppBar.ts` JavaScript:

```
MobileSidebarState:
  isOpen: boolean    // default: false
  toggle: HTMLElement  // hamburger button ref
  menu: HTMLElement    // sidebar panel ref
  backdrop: HTMLElement // overlay ref
```

State transitions:
- Closed → Open: hamburger click → `openMenu()` → add `.open` class, `aria-expanded="true"`, body `overflow: hidden`
- Open → Closed: backdrop click OR link click OR Escape key OR window resize > 768px → `closeMenu()` → remove `.open` class, `aria-expanded="false"`, body `overflow: ""`

## Component Props (New/Modified)

### Icon.astro

```typescript
interface IconProps {
  name: string;       // e.g., "apple-logo", "cash-register"
  size?: number;      // default: 24
  color?: string;     // default: "currentColor"
  variant?: "regular" | "bold" | "fill";  // default: "regular"
  class?: string;     // additional CSS classes
}
```

### MobileSidebar.astro

```typescript
interface MobileSidebarProps {
  links: Array<{ label: string; url: string }>;
  lang: Lang;
}
```

### ProjectFeatureCard.astro

```typescript
interface ProjectFeatureCardProps {
  title: string;
  description: string;
  iconName: string;      // Phosphor icon name (was: Font Awesome class)
  projectColor: string;
  projectGradient: string;
  index?: number;         // for stagger animation delay
}
```

### ProjectTestimonial.astro

```typescript
interface ProjectTestimonialProps {
  quote: string;
  author: string;
  role?: string;
  projectColor: string;
}
```

### ProjectFAQ.astro

```typescript
interface ProjectFAQProps {
  question: string;
  answer: string;
  projectColor: string;
}
```

## Relationship Diagram

```
Base.astro (layout)
├── VantaBg.astro
├── AppBar.astro
│   ├── MobileSidebar.astro (new, rendered as sibling)
│   ├── Icon.astro (for hamburger and other app bar icons)
│   └── LanguageSwitcher.astro
├── <main>
│   └── [page content via slot]
│       └── (Project pages)
│           ├── ProjectFeatureCard.astro (new, shared)
│           ├── ProjectTestimonial.astro (new, shared)
│           ├── ProjectFAQ.astro (new, shared)
│           ├── ProjectGallery.astro (existing)
│           ├── ProjectCTA.astro (existing)
│           └── Icon.astro (new, for all icon instances)
└── Footer.astro (modified)
    └── Icon.astro (new, for social icons)
```
