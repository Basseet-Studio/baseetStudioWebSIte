# Data Model: Branded Project Showcase & Site Restructuring

**Feature**: `002-branded-project-showcase`  
**Date**: 2026-04-02

## Entities

### 1. Branded Product (content/projects/<slug>.md)

A project content page with `layout: branded` that gets a full landing page treatment.

**Front Matter Schema** (extends existing `project:` object):

```yaml
title: 'Product Name'
description: 'SEO description'
date: 2026-04-02
draft: false
layout: branded                        # NEW — triggers branded layout

project:
  # ---- Existing fields (already in use) ----
  name: 'Product Name'
  slug: 'product-slug'
  tagline: 'Short tagline'
  icon: '/images/projects/product-icon.png'
  iconClass: 'fas fa-icon'            # Fallback if no icon image
  color: '#AF52DE'
  gradient: 'linear-gradient(135deg, #AF52DE 0%, #BF5AF2 100%)'
  status: 'Coming Soon | Live | Ready to Deliver'
  platforms:
    - name: 'iOS'
      icon: 'fab fa-apple'
      version: 'iOS 15+'
      link: '#'
  hero:
    title: 'Hero Headline'
    subtitle: 'Hero subtext'
    cta_primary: 'Primary CTA Text'
    cta_primary_link: '#download'
    cta_secondary: 'Secondary CTA Text'
    cta_secondary_link: '#features'
    image: '/images/projects/product-hero.png'
  features:
    - title: 'Feature Name'
      description: 'Feature description'
      icon: 'fas fa-fire'
  gallery_type: 'mobile | web'
  screenshots:
    - '1.png'
  testimonials:
    - quote: 'Quote text'
      author: 'Author Name'
      role: 'Role'
  faq:
    - question: 'Question?'
      answer: 'Answer.'
  tech:
    - 'Technology'

  # ---- NEW fields for branded pages ----
  brandName: 'Product Name'            # Displayed in app bar (can differ from name)
  brandLogo: '/images/brands/product-logo.svg'  # Logo image for app bar (optional)
  navItems:                             # Product-specific app bar navigation
    - label: 'Home'
      url: '#home'
    - label: 'Features'
      url: '#features'
    - label: 'Download'                # OR 'Demo' depending on product
      url: '#download'
    - label: 'Contact'
      url: '#contact'
  bgEffect: 'leaves'                   # Background renderer: leaves | paper-notes | kitchen | shopping | grid | clouds
  bgFallbackGradient: 'linear-gradient(180deg, #E8F5E9 0%, #C8E6C9 40%, #A5D6A7 100%)'
```

**Validation Rules**:
- `layout` MUST be `branded` for branded pages, `single` (or omitted) for standard pages
- `project.brandName` REQUIRED when `layout: branded`
- `project.navItems` REQUIRED when `layout: branded`, MUST contain 3-5 items
- `project.bgEffect` REQUIRED when `layout: branded`, MUST be one of the defined effect names
- `project.slug` MUST be unique across all project content files
- `project.color` MUST be a valid hex color

**Relationships**:
- Links to homepage "Our Products" section via `data/home/projects.yaml` slug matching
- Background effect determined by `bgEffect` field → loads corresponding JS renderer
- App bar navigation driven by `navItems` field → consumed by shared header partial

---

### 2. Standard Project (content/projects/<slug>.md)

Uses existing schema WITHOUT the branded-specific fields. `layout: single` (or omitted).

**Existing pages**: photorestore-ai, medical-education-app, bd-railway-automated-timetable, nss-virtual-education-fair, malaysian-business-websites

**No schema changes** — these pages continue using the current `project:` front matter and `layouts/projects/single.html`.

---

### 3. Client Entry (data/clients.yaml)

Renamed from `data/customers.yaml`.

```yaml
enable: true

title: "Our Clients"
subtitle: "Success Stories"
description: "See how businesses achieve results with our solutions."

clients:                               # Renamed from "customers"
  - id: "portia-grid"                  # Renamed from "fleetops"
    name: "Portia Grid"               # Renamed from "FleetOps"
    logo: ""
    industry: "Logistics & Data Intelligence"
    service_type: "Internal Tool"
    color: "#2563EB"
    tagline: "Intelligent Fleet & Data Management"
    short_description: "..."
    full_description: "..."
    challenge: "..."
    solution: "..."
    results:
      - metric: "30%"
        label: "Reduction in breakdowns"
      - metric: "2hrs"
        label: "Saved daily on admin"
      - metric: "100%"
        label: "Fleet visibility"
    features:
      - "Feature 1"
    technologies:
      - "React"
      - "Node.js"
    testimonial:
      quote: "Most devs just build what you tell them; this team actually thinks through the logic with you. Building Portia Grid required a lot of tactical intelligence and complex data handling, and Mohamed, Asad, and Ariyan absolutely nailed it. They've got great energy, they know their tech inside out, and they held my hand through the entire process. If you want a team that takes ownership of the outcome, this is it."
      author: "Hassan"
      role: "CEO & Founder of Portia Grid"
    screenshots: []

  - id: "iyat"
    name: "Iyat"
    logo: ""
    industry: "Digital Marketing & Creative"
    service_type: "Website"
    color: "#8B5CF6"
    tagline: "Digital Agency Portfolio"
    short_description: "A modern, visually rich website for Iyat, a digital agency showcasing their creative portfolio and services."
    full_description: "We designed and built a premium portfolio website for Iyat, a digital agency specializing in creative marketing solutions."
    challenge: "Iyat needed a professional online presence that would showcase their creative work and attract new clients."
    solution: "We built a sleek, modern portfolio website with smooth animations, responsive design, and an engaging user experience."
    results:
      - metric: "100%"
        label: "Custom design"
      - metric: "< 2s"
        label: "Load time"
    features:
      - "Custom portfolio design"
      - "Responsive layout"
      - "Smooth animations"
      - "Modern UI/UX"
    technologies:
      - "HTML/CSS"
      - "JavaScript"
    testimonial:
      quote: ""
      author: ""
      role: ""
    link: "https://iyat-site.mohameda-elobaid.workers.dev/portfolio"
    screenshots: []
```

**Validation Rules**:
- `id` MUST be unique across all client entries
- `name` REQUIRED
- `testimonial.quote` may be empty (template handles fallback)
- `link` is optional — when present, displayed as "View Project" button

---

### 4. Homepage Products Section (data/home/projects.yaml)

Add `type` field to categorize products and new entries for ChopShop and Matrix.

```yaml
enable: true
title: '<span class="gradient-heading">Our Products</span>'
subtitle: 'In-House Apps Built with Love'

items:
  - name: 'Nomu'
    slug: 'numu'
    type: 'branded'                    # NEW — determines link target and display
    # ... existing fields ...

  - name: 'Money Box'
    slug: 'money-box'
    type: 'branded'
    # ... existing fields ...

  - name: 'DeshiKitchen'
    slug: 'deshikitchen'
    type: 'branded'
    # ... existing fields ...

  - name: 'ChopShop'                  # NEW
    slug: 'chopshop'
    type: 'branded'
    tagline: 'Your Shop, Everywhere'
    description: 'A B2C shopping platform for vendors to sell their products online and reach a wider audience. Includes a delivery app and customizable customer-facing app.'
    iconClass: 'fas fa-shopping-bag'
    platforms:
      - name: 'Web'
        icon: 'fas fa-globe'
        link: '#'
      - name: 'iOS'
        icon: 'fab fa-apple'
        link: '#'
      - name: 'Android'
        icon: 'fab fa-android'
        link: '#'
    features:
      - 'Vendor storefront management'
      - 'Custom-branded customer app'
      - 'Delivery app & tracking'
      - 'Payment processing'
    color: '#E11D48'
    gradient: 'linear-gradient(135deg, #E11D48 0%, #FB7185 100%)'
    status: 'Ready to Deliver'

  - name: 'Matrix'                     # NEW
    slug: 'matrix'
    type: 'branded'
    tagline: 'Manage Everything, Miss Nothing'
    description: 'A task management tool for teams — take docs, run meetings, and manage projects all in one place.'
    iconClass: 'fas fa-th-large'
    platforms:
      - name: 'Web'
        icon: 'fas fa-globe'
        link: '#'
    features:
      - 'Task management'
      - 'Meeting notes & docs'
      - 'Project boards'
      - 'Team collaboration'
    color: '#0891B2'
    gradient: 'linear-gradient(135deg, #0891B2 0%, #22D3EE 100%)'
    status: 'Coming Soon'

  - name: 'PhotoRestore AI'
    slug: 'photorestore-ai'
    type: 'standard'                   # NEW — link to standard project page
    # ... existing fields ...

  - name: 'Medical Education App (MAI)'
    slug: 'medical-education-app'
    type: 'standard'
    # ... existing fields ...

  - name: 'NSS Virtual Education Fair'
    slug: 'nss-virtual-education-fair'
    type: 'standard'
    # ... existing fields ...

  - name: 'BD Railway Timetable System'
    slug: 'bd-railway-automated-timetable'
    type: 'standard'
    # ... existing fields ...

  - name: 'Malaysian Corporate Websites'
    slug: 'malaysian-business-websites'
    type: 'standard'
    # ... existing fields ...
```

**Validation Rules**:
- `type` MUST be `branded` or `standard`
- `slug` MUST match a content file in `content/projects/`
- Branded items displayed first in the homepage section, standard items after

---

### 5. Background Effect Configuration

Each effect is defined by its JavaScript renderer file. No separate data entity needed — the effect is selected by the content page's `bgEffect` front matter field.

**Effect Registry** (implemented in the Hugo partial, not a data file):

| bgEffect Value | JS File | Renderer Class | Theme |
|--------|---------|---------------|-------|
| `clouds` | `assets/js/clouds.js` | `CloudsRenderer` | Volumetric clouds (existing) |
| `leaves` | `assets/js/leaves.js` | `LeafRenderer` | Floating leaves, Nomu green |
| `paper-notes` | `assets/js/paper-notes.js` | `PaperNotesRenderer` | Drifting paper, Money Box gold |
| `kitchen` | `assets/js/kitchen.js` | `KitchenRenderer` | Rising steam/spice, Desi Kitchen orange |
| `shopping` | `assets/js/shopping.js` | `ShoppingRenderer` | Package/bag outlines, ChopShop rose |
| `grid` | `assets/js/grid.js` | `GridRenderer` | Pulsing grid lines, Matrix cyan |

---

### 6. App Bar Navigation Context

Driven entirely by page front matter — no separate data entity. The shared header partial reads:

| Field | Source | Fallback |
|-------|--------|----------|
| Logo text | `.Page.Params.project.brandName` | `{{ i18n "logo_text" }}` (Baseet Studio) |
| Logo image | `.Page.Params.project.brandLogo` | None (text-only) |
| Nav items | `.Page.Params.project.navItems` | `site.Menus.main` |
| Back link | Automatic on branded pages | Not shown on studio pages |
| Language switcher | Always shown | Always shown |

---

## State Transitions

### Product Status Lifecycle

```
Draft → Coming Soon → Live / Ready to Deliver → Completed
```

- **Coming Soon**: Page exists, content shown, CTAs are placeholder (#)
- **Live**: Fully functional, real links
- **Ready to Deliver**: Product built, seeking vendors/clients
- **Completed**: Past project, archived

### Branded Page Rendering Flow

```
Content request → Hugo layout lookup
  ├── layout: branded → layouts/projects/branded.html
  │     ├── baseof.html base template
  │     ├── Conditional background (bgEffect → load specific JS)
  │     ├── Adaptive app bar (brandName, navItems)
  │     ├── Branded sections (hero, features, download/demo, contact)
  │     └── Footer (studio branding)
  └── layout: single (or omitted) → layouts/projects/single.html
        ├── baseof.html base template
        ├── Default clouds background
        ├── Studio app bar (site.Menus.main)
        ├── Standard project sections
        └── Footer (studio branding)
```
