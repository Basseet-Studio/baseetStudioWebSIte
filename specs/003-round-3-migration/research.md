# Research: Site 2 Round 3 — Content, Icons & Navigation Hardening

**Phase**: 0 — Outline & Research
**Date**: 2026-06-03
**Feature**: [spec.md](./spec.md)

## 1. Project Subpage 404 Root Cause

### Decision: Fix the project nav URL builder in `AppBar.astro`; do NOT create nested routes

**Investigation**:

Current `AppBar.astro` builds project nav links via two code paths:

1. **In the link list (`navLinks` constant, line ~20)**:
   ```ts
   { label: item.label, url: `/${lang === 'ar' ? 'ar/' : ''}projects/${slug || ''}/${item.url}` }
   ```
   This produces `/projects/zaryn/features/` for `item.url = "features/"` — **correct**.

2. **In the link rendering (`<ul class="app-bar__links">`, line ~70)**:
   ```astro
   <a href={item.url || '#'} class="app-bar__link" data-page={item.i18nKey || ''}>
   ```
   This uses `item.url` directly — `"features/"` — which Astro resolves as a **relative URL** to the current page. So when the user is on `/projects/zaryn/features/` and clicks "Demo", the browser navigates to `/projects/zaryn/features/demo/` (404). When the user is on `/projects/zaryn/` and clicks "Features", the browser navigates to `/projects/zaryn/features/` (200). The bug only triggers on **non-root subpages**.

**Fix**: replace the relative `item.url` with the absolute `/${lang}projects/${slug}/${item.url}` form in the `<ul>` render block — matching the `navLinks` constant construction. Optionally collapse the two code paths into one shared helper to prevent future drift.

**Why not create nested routes** (e.g. `[slug]/features/demo.astro`):

- Astro's file-based routing cannot match `/projects/zaryn/features/demo/` from `[slug]/features.astro` (would need a 3-segment dynamic route)
- Adds a third route to maintain for every project × locale
- Does not fix the underlying class of bug (any other relative URL in the codebase would still be wrong)

**Alternatives considered**:
- `transition:persist` on the AppBar to keep it across ViewTransitions: rejected — does not fix the link target
- Removing the nav from subpages: rejected — degrades UX
- Setting `<base href="/">` in `<head>`: rejected — affects all other relative URLs in unpredictable ways

## 2. Language Switcher — No AR Routes Built

### Decision: Create a mirror `src/pages/ar/` tree with one file per EN page

**Investigation**: The current `LanguageSwitcher.astro` prepends `/ar` to the current path. But there is **no `src/pages/ar/` directory** in the Astro project — so every AR URL returns 404. The `Base.astro` layout supports `lang="ar"` and `dir="rtl"`, and `i18n/utils.ts` provides `addLangPrefix` / `stripLangPrefix` helpers. The build never produces `dist/ar/...` HTML files.

**Confirmed by**: `ls baseetstudiosite2/src/pages/` — no `ar/` directory exists. The `<link rel="alternate" hreflang>` tags in `Base.astro` reference URLs that don't exist after build.

**Fix**: create `src/pages/ar/` with one file per existing EN page:
- `ar/index.astro` → `dist/ar/index.html`
- `ar/services.astro` → `dist/ar/services/index.html`
- `ar/clients.astro`, `ar/contact.astro`, `ar/404.astro`
- `ar/projects/index.astro`, `ar/projects/{slug}.astro` (12 files), `ar/projects/[slug]/index.astro`, `ar/projects/[slug]/features.astro`, `ar/projects/[slug]/demo.astro`, `ar/projects/[slug]/terms.astro`

Each AR file is a thin wrapper that imports the same layout/components as its EN sibling and passes `lang="ar"`. For text strings, the existing `i18n/utils.ts → t(lang, key)` function looks up the right string. Per the active rule, we are not adding new localisations — we are re-using the shipped `en.json` / `ar.json`.

**Why not single-file locale switching** (Astro middleware):
- The site is `output: 'static'` per `astro.config.mjs`. Locale-switching middleware requires `output: 'server'` or `output: 'hybrid'`.
- Switching the output mode would force SSR for the entire site, breaking the SSG model used in production.
- Static mirror routes are a standard Astro i18n pattern (`docs/astro.build/en/recipes/i18n/`).

**Why not generate AR routes via `getStaticPaths`**:
- Astro's `getStaticPaths` works **inside** a single page file (e.g. `[slug].astro` generating 12 pages). It cannot duplicate an entire route tree.
- The mirror tree approach is more explicit and easier to maintain file-by-file.

**Alternatives considered**:
- Client-side locale swapping (JS rewrites text in DOM): rejected — would break SEO, require re-implementing the i18n lookup, and not produce a real AR URL
- Disabling the language switcher on non-existent AR pages: rejected — explicitly user-requested to be functional

## 3. Phosphor SVG Coverage Audit

### Decision: Copy every referenced icon (and the clover logo) from `phosphor-icons/SVGs/{variant}/` into `public/icons/{variant}/` via a one-shot build script

**Current state** (verified via `ls`):

| Variant | Source files | In `public/icons/` | Missing |
|---|---|---|---|
| regular | 1512 | 93 | 1419 |
| bold | 1512 | 4 | 1508 |
| fill | unknown (~100) | 9 | ~91 |
| light | 1512 | 0 | 1512 (not used) |
| thin | 1512 | 0 | 1512 (not used) |
| duotone | 1512 | 0 | 1512 (not used) |

**Variants actually used** (per `iconMappings.ts` and component scan):
- `regular` — most icons (cash-register, hospital, fork-knife, etc.)
- `bold` — brand logos (apple-logo, android-logo, github-logo, linkedin-logo, plus future `clover-bold`)
- `fill` — social brand fills (instagram, linkedin, github, dribbble, facebook, youtube, tiktok, whatsapp, x)

**Variants NOT used**: light, thin, duotone — skip copying.

**`FA_TO_PHOSPHOR` analysis**: ~80 unique target names. Adding the new icons needed for project details (clover, translate, rocket, wrench, check-circle, code, question, caret-down, arrow-right, arrow-left, arrow-square-out, list, x, gear, info, star, heart, share, download, upload, user, circle, printer, tag, percent, paint-brush, cloud, lock) and languages/nav (~15 more) brings the unique target set to **~95 names across regular/bold/fill**.

**Copy strategy**: a one-shot Node.js script `scripts/copy-phosphor-icons.mjs` that:
1. Reads every `FA_TO_PHOSPHOR*` value in `iconMappings.ts`
2. For each name + variant, copies `/phosphor-icons/SVGs/{variant}/{name}[-bold|-fill].svg` to `public/icons/{variant}/{name}[-bold|-fill].svg` (idempotent — skip if exists)
3. Also copies `clover-bold.svg` (main logo) to `public/icons/bold/`
4. Logs the count of icons copied and skipped
5. Exits with code 0 on success, 1 on missing source file

The script runs **manually once** (or in CI) to seed the repo. After that, the icons are committed source files. No runtime/build step depends on the script — Astro just reads the static files at build time via `Icon.astro`.

**Repository size impact**: ~95 icons × 3 variants × ~1-3 KB each = ~200-500 KB total (well within reason for a static site). If the user wants the **full** Phosphor set copied (not just the referenced ones), that's ~4500 files × ~2 KB = ~9 MB. User said "use the actual SVGs from baseetstudiowebsite, all SVG files are in root, use those directly" → full copy is preferred for forward-proofing.

**Decision**: **Full copy of regular, bold, fill variants** (skip light/thin/duotone). This adds ~9 MB to the repo but eliminates a class of "icon missing" bugs forever.

**Alternatives considered**:
- Copy only referenced icons (~200-500 KB): rejected — user explicitly asked for full coverage so future additions don't require icon work
- Use `@phosphor-icons/web` npm package: rejected — would add an external dependency (the spec already forbids this)
- Use `@iconify-json/ph` runtime: rejected — same problem
- Lazy-fetch icons from a CDN: rejected — violates "no external" rule

## 4. Visitor Detection — Port from Hugo JS to Astro TS

### Decision: Port the existing `baseetStudioWebSIte/assets/js/visitor-detect.js` to TypeScript and wire it into `Base.astro`

**Source file**: `baseetStudioWebSIte/assets/js/visitor-detect.js` (96 lines, IIFE pattern, vanilla JS).

**Current state in Astro**: `Footer.astro` line ~107 has an empty `<p id="visitor-info">` placeholder with data attributes, but no JS is loaded to populate it. The line never updates.

**New file**: `baseetstudiosite2/src/scripts/visitor-detect.ts` — direct TypeScript port of the Hugo source. Same logic:
- `navigator.userAgent` regex match for Mobile / Tablet / Desktop classification
- `fetch` to `https://ipapi.co/json/` with 3-second timeout, fallback to `https://ip-api.com/json/?fields=country`
- `sessionStorage` cache under `baseet_visitor_country`
- `textContent` write to `#visitor-info` element

**Wiring**: in `Base.astro`, add `<script>` tag that imports and calls `init()` on `DOMContentLoaded` AND `astro:page-load` (the ViewTransitions event that fires when navigating between Astro pages — without this, the visitor line would be empty on every page after the first).

**Why TypeScript over JS**: aligns with site2/AGENTS.md ("TypeScript 5.x, Astro 5.x: Follow standard conventions"). Also catches the `data-visiting` / `data-device` / `data-unknown` attribute reads as `string | null`.

**Why a new `src/scripts/` directory** (not inline `<script>` in Footer): the script runs once globally, not per-Footer-instance. Cleaner to import from the layout.

**Alternatives considered**:
- Inline the script in `Footer.astro` `<script>` tag: rejected — duplicates the code if Footer is included in multiple layouts, and Astro will hash/bundle it
- Use a third-party geo service (Cloudflare headers, MaxMind): rejected — adds dependency and may be inaccurate in some regions
- Server-side geo via Cloudflare Worker (the same one handling contact form): deferred — would require Worker changes; out of scope for this round

## 5. CSS Recovery — Diff Hugo vs Astro Style Trees

### Decision: Manual diff of old Hugo CSS against new Astro CSS; add missing rules

**Old Hugo CSS files** (in `baseetStudioWebSIte/assets/css/`): typically `main.css`, `app-bar.css`, `footer.css`, `animations.css`, plus Tailwind utilities.

**New Astro CSS files** (in `baseetstudiosite2/src/styles/`): `global.css`, `glass.css`, `nav.css`, `animations.css` (already shipped from round 2).

**Audit checklist** (what to verify or add):

| Pattern | Old Hugo | New Astro | Action |
|---|---|---|---|
| `:focus-visible` outline on links/buttons | likely present | missing | **Add** (FR-031) |
| Footer social icon hover (color → brand) | present | partially present | **Verify & add transition** |
| Glassmorphic panel (`backdrop-filter: blur(20px)`) | present | present | OK |
| Gradient text/borders | present | present | OK |
| Scroll-triggered fade/slide | present (GSAP) | present (CSS data-animate) | OK |
| Button hover lift (translateY) | present | inline styles only | **Add utility class** |
| Smooth scroll | present | likely missing | **Add** `html { scroll-behavior: smooth }` |
| Reduced motion (`@media prefers-reduced-motion`) | present | unknown | **Add** |

**Approach**: visually compare 3 representative pages (home / project hero / footer) between the old Hugo build (rebuilt locally for comparison) and the new Astro build. Add any rule that produces a visible regression.

**Why not a programmatic diff tool** (e.g. `css-diff`):
- The two sites use **different class names** and **different scoping** (Tailwind utilities vs CSS custom properties)
- A line-level diff would be 90% false positives
- Manual visual diff is faster and more accurate for ~10 patterns

**Alternatives considered**:
- Rebuild old Hugo site in parallel: not needed — old CSS is already extracted in `assets/css/`
- Rewrite all CSS from scratch using Tailwind: out of scope — this is a polish pass, not a refactor

## 6. Icon Component Polish

### Decision: Add dev-only `console.warn` for missing icons; extend `iconMappings.ts` with new entries

**Current behaviour** (`Icon.astro` line ~45): silently falls back to regular variant, then to empty span. No logging.

**Change**: in the `try/catch` block, when the SVG is not found in either primary or fallback variant, emit a single `console.warn` (gated by `import.meta.env.DEV` so it doesn't fire in production). This surfaces gaps during dev without spamming the production console.

**New mappings to add** (per spec US5, US7):

```ts
// Main brand logo
{ key: 'clover', regular: 'clover', bold: 'clover-bold', fill: 'clover-fill' }

// Language switcher
'fas fa-language': 'translate',

// Status badges (per-project)
'Ready to Deliver': 'rocket',
'In Development': 'wrench',
'Live': 'check-circle',
'Coming Soon': 'hourglass',

// Section headings
'fas fa-code': 'code',
'fas fa-question-circle': 'question',
'fas fa-info-circle': 'info',

// Navigation/UI
'fas fa-arrow-left': 'arrow-left',
'fas fa-arrow-right': 'arrow-right',
'fas fa-bars': 'list',
'fas fa-times': 'x',
'fas fa-caret-down': 'caret-down',

// Common
'fas fa-rocket': 'rocket',
'fas fa-wrench': 'wrench',
'fas fa-check-circle': 'check-circle',
'fas fa-user': 'user',
'fas fa-circle': 'circle',
'fas fa-envelope': 'envelope',
'fas fa-phone': 'phone',
'fas fa-map-marker-alt': 'map-pin',
'fas fa-clock': 'clock',
'fas fa-globe': 'globe',
'fas fa-cog': 'gear',
```

Total: ~15 new entries.

## 7. Team Twitter URL Gap

### Decision: Hide the Twitter icon in the UI when the URL is `"#"` or missing (per FR-032); do not invent, fabricate, or research real Twitter handles

**Investigation**: the old Hugo `data/shared/links.yaml` `team` section has `twitter: '#'` for Mohamed Abdallah and Asadur Rahman. The new site `links.json.team` mirrors the same gap. The studio-level Twitter is also `"#"` in the old data.

**User clarification (received during plan review)**: "ignore the twitter urls dont show the icons for social if its link missing". The canonical solution is the **hide-if-missing rule** (FR-032, FR-033, FR-034) — do not invent URLs, do not add TODOs, do not block the round on URL research. When the JSON has a real URL, the icon appears; when `"#"`, the icon is omitted from the DOM entirely.

**Action**:
1. Keep `"#"` in `links.json.team.*.twitter` and `links.json.social.twitter` for now
2. Do not add a `// TODO:` comment (the round is no longer blocked on these URLs)
3. The team section template filters per-platform per-member — Twitter icon only renders for the 2 members with real Twitter URLs
4. The footer template filters — Twitter only renders if the studio URL is real (it's not, so Twitter is hidden in the footer)
5. The app bar template filters — same rule
6. If a real Twitter URL is added to the data in a future round, the icon will automatically reappear with zero code change

**Why this is the right solution**:
- The user explicitly chose it ("ignore the twitter urls")
- It is the lowest-coupling, most future-proof approach (data-driven, not code-driven)
- It removes a class of "should we show a disabled icon?" UX questions forever
- It applies uniformly to every social surface (footer / app bar / team / project platforms)

**No open questions remain in this round.** Spec section "Open Questions" is empty.

## 8. Resolved vs Open Questions

**Resolved (via reasonable defaults in spec.md Assumptions section):**
- AR font choice: Noto Sans Arabic (already loaded in Base.astro for `lang === 'ar'`)
- AR route structure: mirror tree under `src/pages/ar/`
- SVG copy strategy: full copy of regular/bold/fill
- Visitor detect source: port from Hugo `visitor-detect.js`
- Project nav URL fix: use root-relative URL in AppBar render block
- Padding strategy: per-page inline `padding-top: 140px` on first content section
- Icon component logging: dev-only `console.warn`
- Missing social URL handling: hide-if-missing rule (FR-032/033/034), no URL invention

**Open:** none for this round.

**Out of scope (explicitly deferred):**
- MaxMind / Cloudflare header geo lookup
- New CMS for editing links
- New i18n routing layer
- Performance optimisation beyond icon bloat
- URL research for the 3 missing Twitter handles (handled by hide-if-missing)
