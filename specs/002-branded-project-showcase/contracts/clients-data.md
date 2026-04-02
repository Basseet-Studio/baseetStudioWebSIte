# Contract: Client Data Interface (data/clients.yaml)

**Purpose**: Define the data structure for the Clients section (renamed from Customers).

## Schema

```yaml
enable: boolean              # Section visibility toggle
title: string                # Section heading ("Our Clients")
subtitle: string             # Section subheading
description: string          # Section description text

clients: []Client
```

## Client Schema

```yaml
- id: string                 # Unique identifier (kebab-case)
  name: string               # Display name
  logo: string               # Logo image path (optional)
  industry: string           # Industry category
  service_type: string       # Type of service provided
  color: string              # Brand hex color
  tagline: string            # Short tagline
  short_description: string  # Brief description
  full_description: string   # Detailed description  
  challenge: string          # Client's challenge
  solution: string           # Solution provided
  results: []Result          # Measurable results
  features: []string         # Key features delivered
  technologies: []string     # Tech stack used
  testimonial: Testimonial   # Client testimonial
  link: string               # External link (OPTIONAL — for sites we can link to)
  screenshots: []string      # Screenshot paths
```

## Result Schema

```yaml
- metric: string             # e.g., "30%"
  label: string              # e.g., "Reduction in breakdowns"
```

## Testimonial Schema

```yaml
quote: string                # Testimonial text (may be empty)
author: string               # Author name
role: string                 # Author role/title
```

## i18n Key Convention

All client-specific text MUST have i18n keys in both `en.yaml` and `ar.yaml`:

```
client_<id>_name
client_<id>_tagline
client_<id>_short_description
client_<id>_full_description
client_<id>_challenge
client_<id>_solution
client_<id>_testimonial_quote
client_<id>_testimonial_author
client_<id>_testimonial_role
client_<id>_result_<n>_metric
client_<id>_result_<n>_label
client_<id>_feature_<n>
```

## Template Contract

The `layouts/clients/list.html` template MUST:
- Iterate `site.Data.clients.clients`
- Use i18n keys with `client_` prefix (changed from `customer_`)
- Render testimonial section only when `testimonial.quote` is non-empty
- Render "View Project" link only when `link` is non-empty
- Support RTL layout for Arabic
