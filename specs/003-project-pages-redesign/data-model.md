# Data Model: Project Pages Redesign

**Feature**: 003-project-pages-redesign  
**Date**: 2026-04-15

---

## Entity: Project (Enhanced)

Extends the existing project front matter schema with new fields for unique layouts, font pairings, and GSAP animation selection.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Display name (e.g., "Money Box") |
| `brandName` | string | no | Short brand name for app bar (e.g., "MoneyBox") |
| `slug` | string | yes | URL slug (e.g., "money-box") |
| `tagline` | string | yes | One-line description |
| `color` | string (hex) | yes | Primary brand color |
| `gradient` | string (CSS) | yes | CSS gradient value |
| `bgEffect` | string | no | Background canvas effect identifier (paper-notes, clouds, shopping, grid, leaves) |
| `bgFallbackGradient` | string (CSS) | no | CSS gradient fallback when canvas unavailable |
| `iconClass` | string | no | Font Awesome icon class |
| `status` | enum | yes | One of: "Coming Soon", "Live", "Ready to Deliver" |
| `galleryType` | enum | no | "mobile" or "web" — determines screenshot aspect ratio |
| **`layoutVariant`** | string | **yes (NEW)** | Layout template name: "moneybox", "numu", "matrix", "chopshop", "deshikitchen" |
| **`fontHeading`** | string | **yes (NEW)** | Google Font name for headings (e.g., "Space Grotesk") |
| **`fontBody`** | string | **yes (NEW)** | Google Font name for body text (e.g., "Inter") |
| **`fontWeights`** | string | **yes (NEW)** | Comma-separated weights to load (e.g., "400,500,700") |
| **`gsapAnimation`** | string | **yes (NEW)** | GSAP animation module identifier (e.g., "stagger-flip", "elastic-bounce") |
| **`appType`** | enum | **yes (NEW)** | "mobile" or "web" — determines "Download" vs "Demo" label in nav |

### Existing Fields (unchanged)

| Field | Type | Description |
|-------|------|-------------|
| `hero.title` | string | Hero section main heading |
| `hero.subtitle` | string | Hero section description |
| `hero.cta_primary` | string | Primary CTA button text |
| `hero.cta_secondary` | string | Secondary CTA button text |
| `hero.cta_primary_link` | string | Primary CTA URL |
| `hero.cta_secondary_link` | string | Secondary CTA URL |
| `hero.image` | string | Hero image path |
| `features[]` | array | Feature list with title, description, icon |
| `screenshots[]` | array | Screenshot image filenames |
| `faq[]` | array | FAQ items with question and answer |
| `testimonials[]` | array | Testimonial quotes with author and role |
| `platforms[]` | array | Platform availability with name, icon, version, link |
| `techStack[]` | array | Technology names |

### Relationships

- **Project → Sub-Pages**: One project has 3 child pages (features, demo, terms). Linked via Hugo section hierarchy.
- **Project → App Bar State**: Project data drives the project-mode app bar (name, color, navItems, appType).
- **Project → GSAP Module**: The `gsapAnimation` field maps to a JS file (`assets/js/gsap-{slug}.js`).
- **Project → Font Pair**: `fontHeading` + `fontBody` map to a CSS file (`assets/css/project-{slug}.css`).

---

## Entity: Project Navigation Items

Embedded in project front matter under `navItems`. Drives the project-specific app bar.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | yes | Display text (i18n key or literal) |
| `url` | string | yes | Relative URL from project root (e.g., "features/", "demo/") |
| `i18nKey` | string | no | i18n key override for bilingual labels |

### Enhanced navItems Schema (NEW)

```yaml
project:
  navItems:
    - label: "Home"
      url: ""
      i18nKey: "nav_home"
    - label: "Features"
      url: "features/"
      i18nKey: "project_nav_features"
    - label: "Download"          # or "Demo"
      url: "demo/"
      i18nKey: "project_nav_download"  # or "project_nav_demo"
    - label: "Terms"
      url: "terms/"
      i18nKey: "project_nav_terms"
  navMetaItems:
    - label: "Baseet"
      url: "/"
      i18nKey: "project_nav_baseet"
    - label: "Contact Us"
      url: "/contact/"
      i18nKey: "nav_contact"
```

---

## Entity: Project Sub-Page

Content file for features, demo, or terms page. Minimal front matter — inherits project data from parent section.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Page title for SEO and breadcrumbs |
| `layout` | string | yes | Template name: "features", "demo", or "terms" |
| `activeNav` | string | yes | Which nav item to highlight (e.g., "features", "demo", "terms") |
| `type` | string | yes | Hugo content type, always "projects" |

### Example: `features.md`

```yaml
---
title: "Money Box Features"
layout: features
activeNav: features
type: projects
---
```

### Data Inheritance

Sub-pages access parent project data via Hugo's section hierarchy:
```go
{{ $parentPage := .Parent }}
{{ $project := $parentPage.Params.project }}
```
This gives features/demo/terms pages access to project name, color, gradient, fonts, navItems, etc. without duplicating data.

---

## Entity: App Bar State

Not a stored entity — derived at render time from template context.

### States

| State | Trigger | Logo | Navigation Links | Meta Links |
|-------|---------|------|-----------------|------------|
| **Main Site** | Any non-project page | "Baseet Studio" | Home, Services, Projects, Clients, Contact | Language Switcher |
| **Project Mode** | Any page under `/projects/<slug>/` | Project brandName in project color | Home, Features, Download/Demo, Terms | Baseet, Contact Us, Language Switcher |

### Detection Logic (Hugo template)

```go
{{ $isProjectPage := and (eq .Section "projects") (ne .Kind "taxonomy") }}
{{ if $isProjectPage }}
  {{ partial "project-header.html" . }}
{{ else }}
  {{ partial "header.html" . }}
{{ end }}
```

---

## Entity: Visitor Info

Client-side only. Not persisted to any backend.

### Fields

| Field | Type | Source | Fallback |
|-------|------|--------|----------|
| `country` | string | IP geolocation API response `country_name` | "Unknown" |
| `device` | enum | User-Agent parsing | "Desktop" |

### Device Classification

| Category | Detection Rule |
|----------|---------------|
| Mobile | UA contains "iPhone" or ("Android" and "Mobile") |
| Tablet | UA contains "iPad" or ("Android" and screen.width > 600 and no "Mobile") |
| Desktop | Everything else |

### Storage

- `sessionStorage.setItem('visitor_country', countryName)` — cleared on tab close
- Device type computed fresh each page load (no storage needed, instant)

---

## Instance Data: The Five Projects

| Project | slug | color | layoutVariant | fontHeading | fontBody | gsapAnimation | appType |
|---------|------|-------|--------------|-------------|----------|---------------|---------|
| Money Box | money-box | #34C759 | moneybox | Space Grotesk | Inter | stagger-flip | mobile |
| Numu | numu | #AF52DE | numu | Quicksand | Nunito | elastic-bounce | mobile |
| Matrix | matrix | #0891B2 | matrix | JetBrains Mono | IBM Plex Sans | typewriter-glitch | web |
| Chopshop | chopshop | #E11D48 | chopshop | Outfit | DM Sans | slide-edges | web |
| Deshi Kitchen | deshikitchen | #F97316 | deshikitchen | Playfair Display | Source Sans 3 | parallax-masonry | web |
