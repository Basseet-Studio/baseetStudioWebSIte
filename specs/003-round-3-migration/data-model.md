# Data Model: Site 2 Round 3 — Content, Icons & Navigation Hardening

**Phase**: 1 — Design & Contracts
**Date**: 2026-06-03
**Feature**: [spec.md](./spec.md)

## Overview

No new persistent entities. The data model documents the JSON data files that change in this round and the new in-memory / file-system entities created by the SVG copier and visitor detection modules. All changes are additive or replacement of placeholder values.

## Modified Entities (JSON Data Files)

### `src/content/data/links.json`

**Changes**: replace `"#"` placeholders in `projects.{slug}.{platform}` with real URLs from the old Hugo `data/shared/links.yaml` (which the new file already mirrors — no functional change needed except for two outstanding Twitter URLs, see Open Questions).

**Schema** (unchanged):

```typescript
{
  social: {
    github: string
    linkedin: string
    twitter: string
    instagram: string
    tiktok: string
    facebook: string
    youtube: string
    dribbble: string
  },
  contact: {
    email: string
    email_link: string
    phone: string
    phone_link: string
    whatsapp: string
    whatsapp_link: string
    address: string
  },
  forms: {
    contact_form_url: string
  },
  projects: {
    [slug: string]: {
      ios?: string
      android?: string
      web?: string
    }
  },
  team: {
    [member_key: string]: {
      github: string
      linkedin: string
      twitter: string
    }
  },
  external: {
    google_fonts: string
    google_fonts_static: string
  }
}
```

**Validation rules**:
- No `"#"` value in `social.*` (current state: 3 of 8 platforms have `"#"` — Facebook, YouTube, Dribbble; these are hidden by the renderer per FR-032)
- No `"#"` value in `team.*.github` or `team.*.linkedin` (verified — all 4 members have real URLs)
- `team.*.twitter` may be `"#"` for members without a Twitter account (current state: 2 of 4 — Mohamed Abdallah, Asadur Rahman; these Twitter icons are hidden per FR-032)
- `projects.*.{ios,android,web}` may be `"#"` if the platform doesn't exist or the link is unknown (current state: many `"#"` values; the platform badge is hidden per FR-033)

**Rendering** (post-fix):
- `Footer.astro` filters out `social` entries with `"#"` URL — ALREADY IMPLEMENTED, verify it still works
- `AppBar.astro` filters out `social` entries with `"#"` URL — NEEDS FIX (currently renders Twitter icon, which has `"#"` at studio level in old data, so it must be hidden)
- Team section in `index.astro` filters per-platform per-member (github / linkedin / twitter) — NEEDS FIX
- Project platform badges in `ProjectCTA.astro` filter per-platform per-project (ios / android / web) — NEEDS FIX
- All filters use `if (url && url !== '#')` in Astro frontmatter, NOT CSS hiding

### `src/content/data/team.json`

**Changes**: remove the placeholder `_linksSource` stub comment. **Do NOT add a TODO for the Twitter URLs** — the user's clarification in this round is that the Twitter icons are simply hidden when the URL is `"#"`, so no URL research or fabrication is needed.

**Schema** (unchanged):

```typescript
{
  title: string
  subtitle: string
  members: Array<{
    name: string
    role: string
    bio: string
    image: string  // path under /images/home/team/
    social: {
      github: string
      linkedin: string
      twitter: string
    }
  }>
}
```

**Validation rules**: `members` array length matches the team `links.json.team` keys (4 members: `mohamed_abdallah`, `asadur_rahman`, `ariyan_rehman`, `dibakar_sutradhar`).
Per FR-032, the team section template filters per-platform per-member — only the platforms with a real (non-`"#"` non-empty) URL render.

### `src/content/data/projects.json`

**No changes**. All 12 project entries already have complete data (color, gradient, features, platforms, tech, screenshots, testimonials, FAQ, navItems, navMetaItems). The spec does not require new project data — the issue is rendering (nav URL builder bug) and missing CSS, not missing content.

## New Entities (File System)

### Phosphor SVG file

```typescript
type PhosphorSvg = {
  name: string         // e.g. "cash-register"
  variant: 'regular' | 'bold' | 'fill'
  sourcePath: string   // e.g. "/phosphor-icons/SVGs/regular/cash-register.svg"
  targetPath: string   // e.g. "public/icons/regular/cash-register.svg"
}
```

Created by `scripts/copy-phosphor-icons.mjs`. Read at build time by `Icon.astro` via `fs.readFileSync`. Not directly addressable from JSON data — the `iconMappings.ts` TypeScript constant is the source of truth for which icon is used where.

**Storage location**:
- `public/icons/regular/{name}.svg` (1,419 new files)
- `public/icons/bold/{name}.svg` and `public/icons/bold/{name}-bold.svg` (1,508 new files)
- `public/icons/fill/{name}.svg` and `public/icons/fill/{name}-fill.svg` (~91 new files)
- `public/icons/bold/clover-bold.svg` (1 file — main Baseet logo)

### Clover logo asset

**Path**: `public/icons/bold/clover-bold.svg`
**Source**: `/phosphor-icons/SVGs/bold/clover-bold.svg` (confirmed exists during exploration)
**Render usage**: in `AppBar.astro` logo slot AND in `Footer.astro` logo slot, as an inline `<img>` tag (not a Phosphor `Icon` — the clover is the studio mark, not a UI icon)

## New Entities (In-Memory / Runtime)

### VisitorInfo

```typescript
type VisitorInfo = {
  country: string        // ISO country name, e.g. "United Arab Emirates"; "Unknown" on failure
  device: 'Mobile' | 'Tablet' | 'Desktop'
  detectedAt: number     // Date.now() timestamp
}
```

**Lifecycle**:
1. Page loads → `visitor-detect.ts` `init()` runs on `DOMContentLoaded` and `astro:page-load`
2. Read `sessionStorage.baseet_visitor_country` — if present, skip geo fetch
3. Detect device from `navigator.userAgent`
4. Fetch country from `https://ipapi.co/json/` (3s timeout) → fallback `https://ip-api.com/json/?fields=country` (3s timeout) → fallback `"Unknown"`
5. Cache resolved country in `sessionStorage.baseet_visitor_country`
6. Write `<p id="visitor-info">` `textContent` = `"Visiting from {country} · Device {device}"`

**Storage**:
- `sessionStorage` (cleared when browser tab closes — country not persisted across sessions)
- DOM element `<p id="visitor-info">` in `Footer.astro`

**Failure modes**:
- Both APIs fail / timeout → `"Unknown"` country, device still detected from UA, line still renders
- `sessionStorage` unavailable (private mode in some browsers) → catch and ignore, no error
- `#visitor-info` element missing → `init()` returns early, no error

### Project Nav URL

```typescript
type ProjectNavItem = {
  label: string          // e.g. "Features"
  url: string            // e.g. "features/" (relative to project root)
  i18nKey: string        // e.g. "project_nav_features"
}
```

**Rendering rule** (after fix): the absolute URL is computed once and used in **both** the `navLinks` constant and the `<ul>` render block:

```typescript
const projectNavUrl = (item: ProjectNavItem) =>
  `/${lang === 'ar' ? 'ar/' : ''}projects/${slug}/${item.url}`
```

This guarantees the URL is always `/projects/{slug}/{item}/` regardless of the current page. Before the fix, the `<ul>` used `item.url` directly (e.g. `"features/"`) which resolved as a **relative URL** to the current page, producing `/projects/zaryn/features/demo/` (404) when clicked from the Features page.

## Key Relationships

```
team.json.members[i].social
        ↓ (uses)
links.json.team[members[i].name_slugified]
        ↓ (renders)
src/components/index.astro (home page team section)

projects.json[i].features[j].icon
        ↓ (maps via)
iconMappings.ts (FA → Phosphor name)
        ↓ (resolves to)
public/icons/regular/{name}.svg
        ↓ (inlined at build time)
src/components/icons/Icon.astro

links.json.social.{platform}
        ↓ (renders)
src/components/shared/Footer.astro (footer social row)

links.json.projects.{slug}.{platform}
        ↓ (renders)
src/components/project/ProjectCTA.astro

projects.json[i].navItems[j]
        ↓ (renders)
src/components/nav/AppBar.astro (project mode nav)
        ↓ (URL builder, FIXED in this round)
Absolute /projects/{slug}/{item}/ URLs
```

## Open Questions

**None.** Per the user's clarification in this round, all `"#"` URLs in `links.json` and `team.json` are handled by the hide-if-missing rule (FR-032). No URL research, invention, or user input is needed for the two team members or the studio-level Twitter. If real Twitter handles become available in a future round, updating the JSON will automatically make the icons reappear — no code change required.
