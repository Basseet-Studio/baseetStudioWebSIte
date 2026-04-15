# Front Matter Schema Contract: Project Pages Redesign

**Feature**: 003-project-pages-redesign  
**Date**: 2026-04-15

---

## Project Landing Page (`_index.md`)

```yaml
---
title: "Project Name"
layout: moneybox          # One of: moneybox, numu, matrix, chopshop, deshikitchen
type: projects

project:
  name: "Money Box"
  brandName: "MoneyBox"    # Short name for app bar
  slug: "money-box"
  tagline: "Smart Savings Made Simple"
  color: "#34C759"
  gradient: "linear-gradient(135deg, #34C759 0%, #30D158 100%)"
  bgEffect: "paper-notes"
  bgFallbackGradient: "linear-gradient(180deg, #f0f0f0, #e0e0e0)"
  iconClass: "fas fa-piggy-bank"
  status: "Coming Soon"     # "Coming Soon" | "Live" | "Ready to Deliver"
  galleryType: "mobile"     # "mobile" | "web"
  
  # NEW FIELDS
  layoutVariant: "moneybox"        # Maps to layouts/projects/moneybox.html
  fontHeading: "Space Grotesk"     # Google Font for headings
  fontBody: "Inter"                # Google Font for body
  fontWeights: "400,500,700"       # Weights to load
  gsapAnimation: "stagger-flip"    # Maps to assets/js/gsap-moneybox.js
  appType: "mobile"                # "mobile" → Download | "web" → Demo

  # Navigation (ENHANCED)
  navItems:
    - label: "Home"
      url: ""
      i18nKey: "project_nav_home"
    - label: "Features"
      url: "features/"
      i18nKey: "project_nav_features"
    - label: "Download"
      url: "demo/"
      i18nKey: "project_nav_download"
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

  # EXISTING (unchanged)
  hero:
    title: "..."
    subtitle: "..."
    cta_primary: "..."
    cta_secondary: "..."
    cta_primary_link: "#contact"
    cta_secondary_link: "#features"
    image: "/images/projects/moneybox-hero.png"
  features:
    - title: "Feature Name"
      description: "Feature description"
      icon: "fas fa-icon"
  screenshots: []
  faq: []
  testimonials: []
  platforms: []
  techStack: []
---
```

---

## Features Sub-Page (`features.md`)

```yaml
---
title: "Money Box Features"
layout: features
type: projects
activeNav: "features"
---
```

No body content needed. Template reads features from parent `_index.md` via `{{ .Parent.Params.project.features }}`.

---

## Demo Sub-Page (`demo.md`)

```yaml
---
title: "Money Box Demo"
layout: demo
type: projects
activeNav: "demo"
---
```

No body content needed. Template reads platforms/status from parent `_index.md`.

---

## Terms Sub-Page (`terms.md`)

```yaml
---
title: "Money Box Terms & Conditions"
layout: terms
type: projects
activeNav: "terms"
---
```

No body content needed. Template renders structural headings with placeholder content.

---

## Arabic Variants

Each file has an Arabic counterpart with `.ar.md` extension:

```yaml
# features.ar.md
---
title: "مميزات Money Box"
layout: features
type: projects
activeNav: "features"
---
```

The template handles all RTL rendering. Arabic content files only need translated `title` values.

---

## Validation Rules

| Field | Rule |
|-------|------|
| `layout` | Must match an existing file in `layouts/projects/` |
| `project.color` | Must be a valid hex color |
| `project.appType` | Must be "mobile" or "web" |
| `project.layoutVariant` | Must be one of: moneybox, numu, matrix, chopshop, deshikitchen |
| `project.gsapAnimation` | Must have a corresponding `assets/js/gsap-{slug}.js` file |
| `activeNav` | Must be one of: features, demo, terms |
| `type` | Must be "projects" for Hugo template lookup to work |
