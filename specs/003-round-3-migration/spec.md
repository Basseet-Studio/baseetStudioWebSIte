# Feature Specification: Site 2 Round 3 — Content, Icons & Navigation Hardening

**Feature Branch**: `003-round-3-migration`
**Created**: 2026-06-03
**Status**: Draft
**Input**: User description: "Migrate worker/team social media links, project links, project content from old site to new site. Fix 404 on /projects/zaryn/features/demo/ when navigating between project subpages. Push project page content down so it sits below nav bar consistently. Recover missing CSS from old site. Fix language switcher. Implement visitor auto-detect (device + country) in footer matching old site. Replace broken/empty footer icons with Phosphor SVG icons throughout the app — copy needed SVGs from /phosphor-icons/SVGs/ into /baseetstudiosite2/public/icons/. Use clover-bold.svg as the main Baseet logo. Add suitable Phosphor icons for home, app bar, projects, language switcher, and project detail sections. Use Phosphor icons for these too. Ignore the Twitter URLs — do not show social icons for any platform when the link is missing or '#'."

## Context

This is round 3 of the Hugo → Astro migration tracked in `baseetstudiosite2/specs/`. Round 1 (`001-ui-studio-site-updates`) and round 2 (`002-site2-ui-enhancements`) established the layouts, data files, and component shells. Round 3 closes the gaps the user found when clicking through the live build: data parity with the old Hugo site, broken project sub-navigation, inconsistent page offsets, broken language switching, missing visitor detection, and a sparse Phosphor icon set that leaves most UI elements empty (the `Icon.astro` component silently renders an empty span when the SVG is missing).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Migrate Team, Project, and Social Link Data (Priority: P1)

As a visitor, I want every team member's social links, every project's app download links, and the studio's full social link set to display correctly across the site so the new site matches the old site and visitors can actually contact the team or download apps.

**Why this priority**: Links are the conversion point. Empty or "#" hrefs in the team and footer kill leads. Project download CTAs with placeholder links defeat the purpose of having a portfolio.

**Independent Test**: Load `/`, open the team section, hover each member's social icon — each opens the correct GitHub/LinkedIn/X profile (not "#"). Load any project page, click the platform CTA (iOS/Android/Web) — the link resolves to the actual App Store / Play Store / site URL stored in the old site.

**Acceptance Scenarios**:

1. **Given** the team section on the home page, **When** I click a member's social icon, **Then** it opens the exact URL from `links.json.team.{member}` (any icon whose URL is `"#"` or empty is **hidden** — not rendered as a disabled icon, not rendered as a link, simply not in the DOM)
2. **Given** any project page, **When** I view the platform/download section, **Then** the iOS/Android/Web links resolve to the URLs in `links.json.projects.{slug}.{platform}` (any platform whose URL is `"#"` or missing is **hidden** — not rendered as a disabled badge)
3. **Given** the footer, **When** I view the social icon row, **Then** only the studio's social platforms with real (non-empty, non-`#`) URLs in `links.json.social` are rendered (Facebook, YouTube, Dribbble are `"#"` in current data → hidden)
4. **Given** the app bar social row, **When** the app bar renders, **Then** only social platforms with real URLs in `links.json.social` are rendered (Twitter is `"#"` for the studio in old Hugo data → hidden in app bar)
5. **Given** the team data, **When** a new member is added to `team.json`, **Then** their social block auto-filters: only platforms with real URLs appear

---

### User Story 2 — Fix Project Subpage 404 and Consistent Content Offset (Priority: P1)

As a visitor clicking through a project's subpages (home / features / demo / terms), I want every nav click to land on a real page and every page's first content block to sit at the same vertical offset below the floating app bar.

**Why this priority**: A 404 on the second nav click breaks trust. Inconsistent offsets look like a bug. Both are immediately visible on the most-trafficked pages of the site.

**Independent Test**: Open `/projects/zaryn/`, click "Features" → "Demo" → "Terms" → "Home" in sequence. Every click lands on a 200 page (no 404). The hero/section heading on each subpage starts at the same Y coordinate (within 4px tolerance) below the app bar.

**Acceptance Scenarios**:

1. **Given** I am on `/projects/zaryn/features/`, **When** I click the "Demo" nav item, **Then** the browser navigates to `/projects/zaryn/demo/` (200), not `/projects/zaryn/features/demo/` (404)
2. **Given** I am on any project subpage, **When** the page loads, **Then** the first content section begins at a consistent top padding (≥ 140px) so content is not hidden under the floating glass app bar
3. **Given** the project nav item URLs in `projects.json` are relative strings like `"features/"`, `"demo/"`, **When** the AppBar builds nav links, **Then** each link resolves to `/projects/{slug}/{item}/` (one segment deep), not nested under the current page
4. **Given** I navigate from one project to another via the AppBar logo, **When** the new project loads, **Then** the subpage offset and active nav state update correctly

---

### User Story 3 — Fix Language Switcher (EN ⇄ AR) (Priority: P1)

As a visitor, I want the language switcher in the app bar to toggle the page between English and Arabic and persist the chosen language across navigations, so I can read the site in my preferred language without manually editing the URL.

**Why this priority**: A non-functional language switcher on a bilingual site is a critical UX failure. The current implementation uses `data-astro-reload` and only swaps the URL prefix — it does not reload translations or update the HTML `lang`/`dir` attributes on the current page.

**Independent Test**: Load `/projects/zaryn/`, click the language switcher button. The URL changes to `/ar/projects/zaryn/`, the page reloads, and the rendered text is in Arabic, the HTML `dir` attribute is `rtl`, and the typography switches to a Noto Sans Arabic / similar font. Click the switcher again — page returns to English at `/projects/zaryn/`.

**Acceptance Scenarios**:

1. **Given** I am on any non-Arabic page, **When** I click the language switcher, **Then** the browser navigates to the equivalent Arabic URL (prepending `/ar` to the path) and the page renders with `lang="ar"` and `dir="rtl"` on the `<html>` element
2. **Given** I am on an Arabic page, **When** I click the language switcher, **Then** the URL strips the `/ar` prefix and the page renders with `lang="en"` and `dir="ltr"`
3. **Given** I switch language on a deep page like `/projects/zaryn/features/`, **When** the new page loads, **Then** all visible strings (nav labels, headings, CTAs) appear in the chosen language and the project hero color/gradient remains consistent
4. **Given** I switch language, **When** the page loads, **Then** no JS console errors fire and the app bar is not duplicated

---

### User Story 4 — Visitor Auto-Detect in Footer (Priority: P2)

As a visitor, I want a discreet one-line indicator at the bottom of the footer that shows the device I am on (Mobile / Tablet / Desktop) and the country I am visiting from, so the studio knows its audience without asking me.

**Why this priority**: Matches the behavior of the old Hugo site, satisfies the user's explicit request, and serves as a low-cost analytics signal. Already partially scaffolded in `Footer.astro` (empty `<p id="visitor-info">`) but no JS is wired to populate it.

**Independent Test**: Load any page, scroll to the footer bottom. After the page loads, a small (10px) text line appears reading "Visiting from {Country} · Device {Mobile|Tablet|Desktop}". If the geo API times out, it shows "Visiting from Unknown · Device {type}".

**Acceptance Scenarios**:

1. **Given** I load any page, **When** the page finishes loading, **Then** the visitor-info paragraph in the footer is populated with the device type (Mobile/Tablet/Desktop) detected from `navigator.userAgent`
2. **Given** the geo lookup succeeds (within 3 seconds), **When** the response returns, **Then** the country name is inserted into the visitor line
3. **Given** the geo lookup fails or times out, **When** 3 seconds elapse, **Then** the line falls back to "Unknown" without blocking the page
4. **Given** I refresh within the same browser session, **When** the page loads, **Then** the country is read from `sessionStorage` and not re-fetched

---

### User Story 5 — Complete Phosphor Icon Coverage (Priority: P1)

As a developer and visitor, I want every icon used in the site to render as a real Phosphor SVG (not an empty fallback) and the studio logo to be the clover-bold mark, so the visual language stays consistent and no UI element looks broken.

**Why this priority**: Most footer/app bar icons currently render as empty spans because the source SVG is not present in `/baseetstudiosite2/public/icons/{variant}/`. Only 4 bold, 9 fill, and 93 regular SVGs are present locally — but the icon mappings reference ~80+ distinct names across the site. AppBar still uses raw `<i class="fab fa-*">` Font Awesome markup that relies on a (now missing) font file.

**Independent Test**: Open the browser dev tools Network tab on any page. Confirm zero requests to external font/icon CDNs. Visually confirm the footer social row, app bar social row, language switcher, theme switcher, project platform icons, feature icons, and the Baseet logo all render as crisp SVGs.

**Acceptance Scenarios**:

1. **Given** the site is loaded, **When** I open the Network tab and filter by font/icon, **Then** there are zero external requests (no Font Awesome, no Phosphor web font, no CDN)
2. **Given** any page footer, **When** the social icon row renders, **Then** all 8 platform icons (github-logo, linkedin-logo, x-logo, instagram-logo, facebook-logo, youtube-logo, dribbble-logo, tiktok-logo) appear as solid Phosphor SVGs
3. **Given** the app bar, **When** it renders, **Then** the social row uses `<Icon>` components (not `<i class="fab fa-*">`) and shows the four social platforms, the language switcher label, and the theme switcher glyph
4. **Given** any project page feature grid, **When** each feature card renders, **Then** the icon in the gradient square is a real Phosphor SVG matching the feature's `iconClass` (e.g. `fas fa-cash-register` → `CashRegister.svg`)
5. **Given** the Baseet brand mark, **When** it renders in the app bar logo and the footer, **Then** it shows `clover-bold.svg` from the Phosphor set, sized to fit the logo slot
6. **Given** the language switcher, **When** it renders, **Then** it shows a `translate` Phosphor icon alongside the EN/AR label for visual consistency
7. **Given** any project page status badge, **When** it renders, **Then** a suitable Phosphor icon (e.g. `rocket` for "Ready to Deliver", `wrench` for "In Development", `check-circle` for "Live") accompanies the text

---

### User Story 6 — Recover Missing CSS from Old Site (Priority: P2)

As a visitor, I want the new site to look visually complete — including hover states, focus rings, glassmorphic effects, gradients, and typography rhythm from the old site — so the new build feels as polished as the old one and does not look like a half-migrated prototype.

**Why this priority**: The user reported "alot of missing CSS form the roginal to site 2". Any visible regression in polish (hover, transitions, spacing) reduces perceived quality. Recovering the patterns wholesale is faster than re-inventing them.

**Independent Test**: Compare a representative page (home hero, project hero, footer) between the old Hugo build (served at the recorded URL or via local Hugo `hugo server`) and the new Astro build. Visual diff should be limited to intentional improvements — no missing hover, no broken glass effect, no unstyled elements.

**Acceptance Scenarios**:

1. **Given** the old Hugo site CSS (in `baseetStudioWebSIte/assets/css/`), **When** I diff against the new Astro site CSS (in `baseetstudiosite2/src/styles/`), **Then** the new set contains an equivalent rule for every visual pattern used on the old site (glassmorphic panels, hover lifts, gradient borders, focus rings, animated underlines)
2. **Given** a project page on the new site, **When** I scroll, **Then** scroll-triggered fade/slide animations fire correctly (regression check on `animations.css` / `data-animate` hooks)
3. **Given** the footer, **When** I hover a social icon, **Then** the background transitions to the brand color within 200ms (matches the old site's chip-hover behavior)
4. **Given** any interactive element, **When** I focus it via keyboard, **Then** a visible focus ring appears (a11y regression check)

---

### User Story 7 — Project Details Use Suitable Phosphor Icons (Priority: P3)

As a visitor browsing a project page, I want each section heading, status badge, tech stack chip, and link type to have a relevant Phosphor icon so the page communicates structure visually instead of being a wall of text.

**Why this priority**: Visual polish, not a blocker. Improves scannability and brand feel.

**Independent Test**: Open any project page, scan top-to-bottom — every section, badge, and link has a relevant icon. The icons match the section's intent (e.g. `chart-bar` for reports, `device-mobile` for mobile platform, `globe` for web platform, `gift` for rewards).

**Acceptance Scenarios**:

1. **Given** the project tech stack list, **When** it renders, **Then** a `code` Phosphor icon prefixes the section heading
2. **Given** the project FAQ accordion, **When** each item is rendered, **Then** a `question` or `caret-down` icon indicates expandability
3. **Given** the project features grid, **When** each feature card renders, **Then** its icon matches the feature's `iconClass` mapping and is sized 28px in a 64px gradient square
4. **Given** the project CTA section, **When** it renders, **Then** a `rocket` or `arrow-right` icon accompanies the "Get in Touch" button

---

### Edge Cases

- What if `ipapi.co` and `ip-api.com` both fail? Visitor line shows "Unknown", no console error, no broken layout
- What if the Phosphor SVG for a mapped icon is missing? `Icon.astro` falls back to the regular variant, then to an empty span of the same dimensions; a console warning fires once per missing icon
- What if a project has empty `navItems`? The `[slug]/` pages short-circuit to `/404` via the existing redirect guard — no change needed
- What if the user switches language on the 404 page? They should land on the 404 in the chosen language
- What if the visitor is on a tablet with a desktop UA string? Detect via touch capability + screen width as a tiebreaker
- What if the visitor clears sessionStorage mid-session? Geo lookup re-runs on the next page load
- What if Astro view transitions drop the visitor-info JS context on page change? Re-run `init()` on `astro:page-load` event
- What if a project page is requested with both an invalid slug and the wrong language prefix? Existing 404 redirect handles it

## Requirements *(mandatory)*

### Functional Requirements

**Data Migration**

- **FR-001**: System MUST render every team member's social links (`github`, `linkedin`, `twitter`) from `links.json.team.{member_key}` — replacing any `"#"` placeholder with the real URL from the old Hugo site
- **FR-002**: System MUST render every project's platform links (`ios`, `android`, `web`) from `links.json.projects.{slug}.{platform}` — replacing any `"#"` placeholder with the real URL (TestFlight, Play Store, web app) from the old site
- **FR-003**: System MUST render the studio's 8 social platforms in the footer from `links.json.social` (currently populated — verify all 8 URLs are non-empty)
- **FR-004**: System MUST migrate the `team.json` `_linksSource` stub into a proper data file — remove the placeholder text and add the `twitter` URLs for the two members currently using `"#"`
- **FR-005**: System MUST preserve all migrated URLs across both English and Arabic paths (no link should be language-dependent unless intentionally so)

**Project Subpage Navigation & Offset**

- **FR-006**: Project nav items with `url: "features/"`, `url: "demo/"`, `url: "terms/"` MUST resolve to `/projects/{slug}/features/`, `/projects/{slug}/demo/`, `/projects/{slug}/terms/` — one segment deep — and never to a nested path like `/projects/{slug}/features/demo/`
- **FR-007**: The AppBar's project nav link builder MUST prepend the project root once, not the current subpage — fix the link construction in `AppBar.astro` to use absolute project-relative URLs
- **FR-008**: Each project subpage (`index`, `features`, `demo`, `terms`) MUST apply a top padding of at least 140px on the first content section to clear the floating glass app bar
- **FR-009**: The home project hero section MUST use the same 140px minimum top offset for visual consistency with subpages

**Language Switcher**

- **FR-010**: Language switcher MUST navigate the user to the correct language-prefixed URL (`/ar/...` or `/...`) and trigger a full page reload (intentional) to re-run the Astro static rendering with the new `lang` prop
- **FR-011**: Language switcher MUST use a real `<a href>` link (not a button) and remove the `data-astro-reload` attribute if it is not part of the current Astro version
- **FR-012**: The `<html>` element MUST always have `lang={lang}` and `dir={isRTL ? 'rtl' : 'ltr'}` set on every page (already done in `Base.astro` — verify per layout)
- **FR-013**: Arabic pages MUST load a Noto Sans Arabic (or equivalent) font when the language is Arabic
- **FR-014**: Project pages MUST preserve the project brand color, gradient, and content when switching language — only text strings and directionality change

**Visitor Detection**

- **FR-015**: Footer MUST include a `visitor-detect` module (TypeScript or JavaScript) that runs on `DOMContentLoaded` and again on `astro:page-load`
- **FR-016**: Visitor detect MUST read `navigator.userAgent` and classify the device as Mobile, Tablet, or Desktop using the regex set from the old site's `visitor-detect.js`
- **FR-017**: Visitor detect MUST fetch country from `https://ipapi.co/json/` with a 3-second timeout, falling back to `https://ip-api.com/json/?fields=country`, then to "Unknown"
- **FR-018**: Visitor detect MUST cache the resolved country in `sessionStorage` under key `baseet_visitor_country` for the duration of the session
- **FR-019**: Visitor detect MUST write the result into the existing `<p id="visitor-info">` element using `textContent` (never `innerHTML`) to prevent XSS from a malicious geo response
- **FR-020**: Visitor detect MUST NOT block the page render or fire any error in the console if both APIs fail

**Phosphor Icons & Clover Logo**

- **FR-021**: Every icon used anywhere in the site MUST be a Phosphor SVG file present in `baseetstudiosite2/public/icons/{variant}/{name}.svg` where `variant ∈ {regular, bold, fill}`
- **FR-022**: The build pipeline MUST copy missing required SVGs from the source set at `/phosphor-icons/SVGs/{variant}/{name}.svg` into `/baseetstudiosite2/public/icons/{variant}/{name}.svg` (one-time copy, then committed to the repo)
- **FR-023**: The full icon set referenced in `iconMappings.ts` MUST be present locally — verify each `FA_TO_PHOSPHOR*` entry's target filename exists in the corresponding variant folder, and add it if missing
- **FR-024**: AppBar MUST replace all remaining `<i class="fab fa-*">` markup with `<Icon name="..." variant="..." />` components — no Font Awesome dependency
- **FR-025**: The main Baseet logo (app bar + footer) MUST use `clover-bold.svg` rendered as an inline `<img>` or as a Phosphor `Icon` reference
- **FR-026**: The language switcher MUST show a `translate` Phosphor icon next to the EN/AR label
- **FR-027**: Project pages MUST include suitable Phosphor icons for: section headings (code, question, rocket), platform badges (globe, apple-logo, android-logo, desktop), status badges (rocket, wrench, check-circle), and CTAs (arrow-right)
- **FR-028**: `Icon.astro` MUST keep the existing two-tier fallback (primary variant → regular variant → empty span) and emit a one-time `console.warn` per missing icon to surface gaps in dev

**CSS Recovery**

- **FR-029**: `baseetstudiosite2/src/styles/` MUST contain a CSS rule for every visual pattern used on the old Hugo site — diff the two style trees and add any missing rules (hover, focus, glassmorphism, gradient, animation)
- **FR-030**: Footer social icon hover MUST transition `background` and `color` to the brand color within 200ms (matches old site behavior)
- **FR-031**: Every interactive element (links, buttons, inputs) MUST have a visible `:focus-visible` outline that meets WCAG 2.1 AA contrast
- **FR-032**: Any social icon (footer, app bar, team section) whose underlying URL is `"#"`, empty, undefined, or missing MUST be **omitted from the DOM entirely** — not rendered as a disabled link, not rendered with reduced opacity, not rendered with a tooltip. The hide-if-missing rule applies per-icon, not per-member/per-row. Filtering MUST happen in the component frontmatter (Astro `---` block), not via CSS
- **FR-033**: The same hide-if-missing rule MUST apply to project platform badges (iOS / Android / Web) on every project page — a platform whose URL is `"#"` or missing is not rendered
- **FR-034**: The Twitter URLs currently stored as `"#"` for two team members (Mohamed Abdallah, Asadur Rahman) and the studio-level Twitter link MUST remain as-is in `links.json`; the UI hides the icons, no URL invention required

### Key Entities

- **Team Member**: Person on the studio team with `name`, `role`, `bio`, `image`, `social { github, linkedin, twitter }`. Source: `team.json` + `links.json.team`. Rendered on home page and any future team page.
- **Project Platform Link**: Per-project app or web link for `ios`, `android`, or `web` platforms. Source: `links.json.projects.{slug}.{platform}`. Rendered in the project CTA section.
- **Studio Social Link**: Studio-level social profile for one of 8 platforms. Source: `links.json.social.{platform}`. Rendered in the footer.
- **Project Nav Item**: Per-project navigation entry with `label`, `url` (relative to project root), `i18nKey`. Source: `projects.json[].navItems`. Rendered in the app bar when on a project page.
- **Phosphor Icon**: A single SVG file at `public/icons/{variant}/{name}.svg` representing a concept (cash register, hospital, clover, etc.). Variants: `regular`, `bold`, `fill`. The `Icon.astro` component reads it at build time and inlines it.
- **Visitor Info**: A small text string displayed in the footer combining the detected country (from a geo IP API) and device type (from `navigator.userAgent`). Cached in `sessionStorage`. Not persisted across sessions.
- **Language Pair**: EN/AR — every page must render in both. The Astro build emits two routes per page (`/` and `/ar/`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every team member's social link on the home page opens the real GitHub/LinkedIn/X profile (zero `"#"` hrefs in the rendered DOM, **and** zero social icons rendered for platforms where the URL is missing) — verified by querying all `<a>` elements inside the team section
- **SC-002**: Every project platform link (iOS/Android/Web) on the 8 branded project pages resolves to a real URL or is **not rendered** (zero `"#"` hrefs visible, zero platform badges for `"#"` URLs)
- **SC-003**: All 4 project subpages (index, features, demo, terms) for the 8 branded projects (32 pages total) load with HTTP 200 — no 404 on internal nav
- **SC-004**: Language switcher toggles EN ⇄ AR on any page (including deep project subpages) in under 1 second and produces a fully translated, correctly-directed page
- **SC-005**: Visitor info line in the footer shows "Visiting from {Country} · Device {type}" within 4 seconds of page load on a normal connection, or "Unknown" after 3-second timeout
- **SC-006**: The 8 footer social icons, 4 app bar social icons, all project feature icons, the clover logo, the language switcher icon, and the project platform icons render as visible SVGs **only for icons with a real URL** — zero empty icon slots, zero icons-without-link in the rendered DOM (query: no `<a>` element whose `href` is `"#"` inside any social/team/platform container, AND no `<span class="phosphor-icon phosphor-icon--fallback">`)
- **SC-007**: Zero external requests to icon CDNs, font CDNs (other than the configured Google Fonts preconnect), or any third-party script in the Network tab on any page load
- **SC-008**: Every interactive element (link, button, input) shows a visible focus ring when focused via keyboard — verified by tabbing through the home page and capturing a screenshot at each stop
- **SC-009**: The first content section on every project subpage begins at the same Y coordinate (within 4px tolerance) below the floating app bar
- **SC-010**: The total count of missing Phosphor SVG files in `public/icons/` drops from the current ~1400 (1512 bold available − 4 present) to zero for every icon referenced anywhere in the codebase
- **SC-011**: Every social icon row (footer / app bar / team) renders exactly the number of icons that have a real URL in the source data — no placeholder icons, no disabled icons, no missing icons. Verified by counting `<a>` elements per social container and comparing to the count of non-`"#"` URLs in the source

## Assumptions

- The old Hugo site (`baseetStudioWebSIte/`) is the canonical source of truth for: team member social URLs, project app/web URLs, the visitor detection behavior, and any CSS rules missing from the new site
- Real platform URLs for projects can be sourced from `baseetStudioWebSIte/data/`, `baseetStudioWebSIte/content/{slug}/index.md`, or the worker's memory of deployed apps
- Phosphor SVG source at `/phosphor-icons/SVGs/` is the canonical icon set and is licensed for use
- The current `Icon.astro` build-time file read approach is acceptable — switching to runtime fetch is out of scope
- The `clover-bold.svg` file already exists at `/phosphor-icons/SVGs/bold/clover-bold.svg` (confirmed during exploration) and can be copied to `public/icons/bold/clover-bold.svg`
- Astro version supports static `getStaticPaths` per-page (already in use across the site)
- The user's home WiFi / IP is appropriate for testing the geo API and will return a real country (not blocked by corporate VPN)
- A 3-second geo timeout is acceptable for a footer indicator — the user explicitly asked for it to be discreet
- All missing icons in this round come from the same Phosphor set; no third-party icon family is needed
- The studio's Twitter URL is `"#"` in both the old Hugo data and the new site data, and the user has confirmed the Twitter icon should be hidden rather than the URL invented. Same applies to the two team members with `"#"` Twitter URLs. The hide-if-missing rule is the canonical way to handle this class of gap — no URL research or fabrication
- Two team members (Mohamed Abdallah, Asadur Rahman) and the studio-level Twitter link remain as `"#"` in `links.json` and `team.json`; the UI filters these out per FR-032. Resolving these URLs is no longer a blocker for this round

## Out of Scope

- A new CMS or admin UI for editing `links.json` and `team.json`
- Real IP geolocation accuracy improvements beyond `ipapi.co` + `ip-api.com` (no MaxMind, no Cloudflare headers)
- Migrating CSS that exists only in inline `style="..."` attributes in the new site (the new site already inlines them — no work needed)
- Building a new i18n routing layer beyond the existing `/ar/` prefix pattern
- Translating additional content beyond what is already in `en.json` / `ar.json`
- Performance optimization beyond fixing the missing-icon render bloat
- Dark/light theme switcher behavior (already shipped in round 2)
- New pages, sections, or major layout changes
- Researching or inventing real Twitter URLs for the two team members or the studio — the hide-if-missing rule (FR-032) means no URL is needed
