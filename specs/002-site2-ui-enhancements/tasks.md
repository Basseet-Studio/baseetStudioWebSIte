# Tasks: Site 2 UI Enhancements

**Input**: Design documents from `/specs/002-site2-ui-enhancements/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Manual visual verification at 375px, 768px, 1280px breakpoints. `npm run build` for build validation. No automated test tasks — not requested in spec.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to: `baseetstudiosite2/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare icon assets and project structure needed by all user stories

- [x] T001 Copy required Phosphor SVG files from `../phosphor-icons/SVGs/regular/` into `public/icons/regular/` (60+ icons listed in research.md mapping table)
- [x] T002 [P] Copy required Phosphor SVG files from `../phosphor-icons/SVGs/bold/` into `public/icons/bold/` (for bold variant icons: apple-logo-bold, android-logo-bold, etc.)
- [x] T003 [P] Copy required Phosphor SVG files from `../phosphor-icons/SVGs/fill/` into `public/icons/fill/` (for social brand logos that need fill variant)
- [x] T004 [P] Create directory structure: `src/components/icons/`, `src/styles/projects/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core components and styles that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

### Icon System

- [x] T005 [P] Create `src/components/icons/iconMappings.ts` — Font Awesome to Phosphor SVG name mapping table (60+ entries covering all project features, platforms, social media, navigation icons per research.md §3)
- [x] T006 Create `src/components/icons/Icon.astro` — generic Phosphor SVG icon component accepting props: name, size (default 24), color (default currentColor), variant (regular/bold/fill), class, ariaLabel — reads SVG from `/icons/{variant}/{name}.svg` at build time per contracts/components.md §1, with fallback empty span if file missing

### Shared Project Components

- [x] T007 [P] Create `src/components/project/ProjectFeatureCard.astro` — reusable feature card with Phosphor icon in gradient circle, title, description, hover translateY animation, animate-fade-in-up with stagger delay via index prop, projectColor and projectGradient applied per data-model.md
- [x] T008 [P] Create `src/components/project/ProjectTestimonial.astro` — reusable testimonial block with quote, author, role, projectColor accent, left border with project color, decorative quote mark per contracts/components.md §4
- [x] T009 [P] Create `src/components/project/ProjectFAQ.astro` — reusable FAQ accordion (details/summary), project-color chevron SVG, content padded below summary per contracts/components.md §4

### Mobile Sidebar Component

- [x] T010 Create `src/components/nav/MobileSidebar.astro` — glassmorphic sidebar panel rendering backdrop overlay and sidebar nav, accepting links array and lang prop, with IDs for toggle/menu/backdrop per contracts/components.md §2

### Styles

- [x] T011 [P] Add mobile sidebar styles to `src/styles/nav.css` — `.mobile-sidebar` (fixed position, right edge, 280px/85vw, transform translateX, backdrop-filter blur, glass background, z-index), `.mobile-sidebar-backdrop` (fixed inset, rgba black, opacity transition), `.open` state (translateX 0), `.mobile-sidebar__links` and `.mobile-sidebar__link` styling, 0.3s ease transition, RTL support when `[dir="rtl"]` (slide from left)
- [x] T012 [P] Create `src/styles/projects/zaryn.css` — Zaryn bento grid layout styles (`.bento-grid`, `.bento-card`, `.bento-large`), dashboard mockup styling, feature carousel styles
- [x] T013 [P] Create `src/styles/projects/numu.css` — Numu floating icon animations (`.floating-icon`, keyframes), centered hero, feature carousel styles
- [x] T014 [P] Create placeholder style files for remaining branded projects: `src/styles/projects/matrix.css`, `moneybox.css`, `deshikitchen.css`, `chopshop.css`, `medev.css` — each with at minimum the `--project-color`/`--project-gradient` custom property setup and project-specific hero/feature variations

**Checkpoint**: Foundation ready — Icon system, shared components, and sidebar component exist. User story implementation can now begin in parallel.

---

## Phase 3: User Story 1 — Individual Project Layouts (Priority: P1)

**Goal**: Replace the shared generic project template with 12 unique project page layouts — 7 branded with distinct hero designs, 5 standard with case-study format

**Independent Test**: Navigate to any two project pages (e.g., `/projects/chopshop` and `/projects/zaryn`) and verify they have different hero layouts, content ordering, and visual treatments

### Branded Project Pages (7)

- [x] T015 [P] [US1] Rewrite `src/pages/projects/zaryn.astro` — branded layout: split-screen hero with dashboard mockup (POS terminal, quick stats, mini chart per reference Hugo `zaryn.html`), bento grid features using ProjectFeatureCard, screenshot gallery, testimonials, FAQ accordion, gradient CTA, inject `zaryn.css`, Space Grotesk+Inter fonts via Google Fonts link in head, tech stack pills section
- [x] T016 [P] [US1] Rewrite `src/pages/projects/numu.astro` — branded layout: centered hero with floating habit icons (fire, check-circle, chart-bar, bell), gallery BEFORE features, horizontal scroll feature carousel using ProjectFeatureCard, testimonials, gradient CTA, inject `numu.css`, Quicksand+Nunito fonts
- [x] T017 [P] [US1] Rewrite `src/pages/projects/matrix.astro` — branded layout: dark-themed hero with glow effects, premium styling, feature grid, gallery, testimonials, FAQ, gradient CTA, inject `matrix.css`
- [x] T018 [P] [US1] Rewrite `src/pages/projects/medev.astro` — branded layout: medical-themed hero, healthcare sector styling, feature grid, gallery, testimonials, FAQ, gradient CTA, inject `medev.css`
- [x] T019 [P] [US1] Rewrite `src/pages/projects/chopshop.astro` — branded layout: e-commerce themed hero, retail/store styling, feature grid, gallery, testimonials, FAQ, gradient CTA, inject `chopshop.css`
- [x] T020 [P] [US1] Rewrite `src/pages/projects/deshikitchen.astro` — branded layout: restaurant-themed hero, food-service styling, feature grid, gallery, testimonials, FAQ, gradient CTA, inject `deshikitchen.css`
- [x] T021 [P] [US1] Rewrite `src/pages/projects/moneybox.astro` — branded layout: finance-themed hero, savings/banking styling, feature grid, gallery, testimonials, FAQ, gradient CTA, inject `moneybox.css`

### Standard/Case Study Project Pages (5)

- [x] T022 [P] [US1] Rewrite `src/pages/projects/photorestore-ai.astro` — standard layout: case-study hero (back-to-projects link, project icon, name+tagline, title+subtitle, CTA), challenge section, solution section, results section, technology stack pills, CTA section, all using `--project-color`/`--project-gradient`
- [x] T023 [P] [US1] Rewrite `src/pages/projects/medical-education-app.astro` — standard case-study layout, same structure as T022
- [x] T024 [P] [US1] Rewrite `src/pages/projects/nss-virtual-education-fair.astro` — standard case-study layout, same structure as T022
- [x] T025 [P] [US1] Rewrite `src/pages/projects/bd-railway-automated-timetable.astro` — standard case-study layout, same structure as T022
- [x] T026 [P] [US1] Rewrite `src/pages/projects/malaysian-business-websites.astro` — standard case-study layout, same structure as T022

### Project Sub-Pages — Icon Updates

- [x] T027 [P] [US1] Update `src/pages/projects/[slug]/features.astro` — replace all `<i class="fas fa-*">` with `<Icon name="*">` using iconMappings, replace arrow-left FA class with Phosphor arrow arrow-left SVG via Icon
- [x] T028 [P] [US1] Update `src/pages/projects/[slug]/demo.astro` — replace platform icons (globe, apple, android) with Phosphor `<Icon>`, replace rocket/play/external-link FA classes with Phosphor equivalents
- [x] T029 [P] [US1] Update `src/pages/projects/[slug]/terms.astro` — replace any remaining FA icons with Phosphor equivalents

### Projects Index Page

- [x] T030 [P] [US1] Update `src/pages/projects/index.astro` — replace platform icons (`<i class={p.icon}>`) with `<Icon name={resolveIcon(p.icon)}>` using iconMappings

**Checkpoint**: All 12 project pages have unique layouts. Project sub-pages use Phosphor icons. Navigate between any two projects to verify distinct hero designs and content ordering.

---

## Phase 4: User Story 2 — Footer, Contact Page, Mobile Navigation (Priority: P1)

**Goal**: Redesigned footer with 8 social icons and WhatsApp CTA, polished contact page with two-column layout, glassmorphic mobile sidebar with backdrop overlay

**Independent Test**: Open site on mobile (under 768px), tap hamburger → sidebar slides in with links and backdrop. Scroll to footer → all social icons, nav links, contact info present.

### Footer Redesign

- [x] T031 [US2] Rewrite `src/components/shared/Footer.astro` — redesign to match reference footer layout: Row 1 (logo Baseet Studio + description, nav links from footer.json, WhatsApp CTA button with `whatsapp-logo` icon), Row 2 (8 social icon links using `<Icon>` — instagram-logo, linkedin-logo, x-logo, github-logo, dribbble-logo, facebook-logo, youtube-logo, tiktok-logo — only render those with valid URLs in links.json, copyright, email + phone), dark background per contracts/components.md §3, support `lang` prop for RTL `/ar/` prefix

### Contact Page Redesign

- [x] T032 [US2] Redesign `src/pages/contact.astro` — add hero badge ("Get in Touch" pill badge with `--project-color`), large heading, response time subtitle ("We'll get back to you within 24 hours"), keep existing two-column layout, replace emoji icons (✉ → `envelope.svg`, 📞 → `phone.svg`, 📍 → `map-pin.svg`) via `<Icon>`, add WhatsApp CTA sidebar card with `whatsapp-logo` icon, add response time notice per contracts/components.md §6
- [x] T033 [US2] Review `src/components/shared/ContactForm.astro` — ensure client-side validation covers required fields (name, email, message) with clear error messaging per FR-008 and contracts/components.md §6, add red border + inline error text on invalid fields

### Mobile Sidebar Integration

- [x] T034 [US2] Integrate MobileSidebar into `src/components/nav/AppBar.astro` — import MobileSidebar component, pass default nav links (Home, Work, Services, Clients, Contact) with `lang` prop, connect hamburger toggle `id="mobile-toggle"` to sidebar's `mobile-sidebar` and `mobile-backdrop` IDs per contracts/components.md §2
- [x] T035 [US2] Update `src/components/nav/AppBar.ts` — add mobile sidebar open/close logic: `openSidebar()` adds `.open` class to sidebar and backdrop, sets `aria-expanded="true"`, `overflow:hidden` on body; `closeSidebar()` reverses; wire events: toggle click, backdrop click, all sidebar link clicks, Escape key, window resize above 768px; ensure RTL slide direction when `document.body.dataset.lang === 'ar'`

**Checkpoint**: Footer visible on all pages with 8 social platforms. Contact page has redesigned layout. Mobile hamburger opens glassmorphic sidebar with full navigation, closes on link/backdrop/Escape.

---

## Phase 5: User Story 4 — Fix Duplicate App Bar on Mobile (Priority: P1)

**Goal**: Identify and remove the duplicate app bar appearing behind the visible one on mobile viewports

**Independent Test**: Open site on mobile viewport (375px - 768px), scroll to top of any page, verify exactly one app bar visible — no ghost/duplicate behind it

### Investigation & Fix

- [x] T036 [US4] Investigate duplicate app bar root cause — inspect DOM on mobile viewport, check for duplicate `<nav class="app-bar">` elements, verify no unexpected rendering paths in Base.astro or page layouts that could produce a second AppBar instance
- [x] T037 [US4] Add ViewTransitions cleanup in `src/components/nav/AppBar.ts` — in `astro:before-swap` event handler, remove any lingering `.app-bar` elements from the previous page to prevent morph overlap per research.md §4
- [x] T038 [US4] Add `transition:name="app-bar"` attribute to the `<nav>` in `src/components/nav/AppBar.astro` so Astro ViewTransitions can correctly identify and handle the app bar during page transitions
- [x] T039 [US4] Remove unused `src/components/project/ProjectHeader.astro` — confirmed via grep no imports exist, this orphan component is dead code that could contribute to confusion during debugging

**Checkpoint**: Exactly one app bar visible on all viewports. No duplicate appears during page transitions. Inspect DOM to confirm single `<nav class="app-bar">` per page.

---

## Phase 6: User Story 3 — Phosphor Icon Migration (Priority: P2)

**Goal**: Complete removal of all Font Awesome dependencies — replace every remaining `<i class="fa*">` across the site, remove external.font_awesome from links.json

**Independent Test**: Open Network tab, load any page, verify zero external icon requests (no fontawesome, no Phosphor CDN, no third-party icon service)

### Remaining Icon Replacements

- [x] T040 [P] [US3] Replace all `<i class="fa*">` in `src/pages/index.astro` — home page hero, features, highlights, team, clients sections — with `<Icon>` components using iconMappings
- [x] T041 [P] [US3] Replace all `<i class="fa*">` in `src/pages/services.astro` — service category icons — with Phosphor `<Icon>` components
- [x] T042 [P] [US3] Replace all `<i class="fa*">` in `src/pages/clients.astro` — client card icons — with Phosphor `<Icon>` components
- [x] T043 [P] [US3] Replace all `<i class="fa*">` in `src/pages/404.astro` — any icons in 404 page — with Phosphor `<Icon>` components
- [x] T044 [P] [US3] Replace all `<i class="fa*">` in `src/components/home/*.astro` — Hero, Features, ProjectsCarousel, Clients, Highlights, Team components — with Phosphor `<Icon>` components
- [x] T045 [P] [US3] Replace all `<i class="fa*">` in `src/components/project/ProjectGallery.astro` and `src/components/project/ProjectCTA.astro` — gallery arrows, CTA platform icons — with Phosphor `<Icon>` components
- [x] T046 [P] [US3] Replace all `<i class="fa*">` in `src/components/shared/ContactForm.astro` — any form icons — with Phosphor `<Icon>` components
- [x] T047 [P] [US3] Replace all `<i class="fa*">` in `src/animations/*.ts` — any icon references in animation files — with updated Phosphor icon names if icon selectors are used

### Font Awesome Cleanup

- [x] T048 [US3] Remove `external.font_awesome` entry from `src/content/data/links.json`
- [x] T049 [US3] Verify no `<i class="fa` or `fa-` string references remain in any `.astro`, `.ts`, or `.json` file in `src/` — run grep to confirm zero matches
- [x] T050 [US3] Run `npm run build` — confirm clean build with no Font Awesome reference errors or missing icon warnings

**Checkpoint**: Zero external icon requests in Network tab. All pages render icons from local SVG files. `npm run build` succeeds with no icon-related errors.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, validation, and verification across all user stories

- [x] T051 [P] Validate all 12 project pages render unique layouts at 375px, 768px, 1280px widths — visual inspection checklist per quickstart.md
- [x] T052 [P] Validate footer appears on all pages (home, /services, /clients, /contact, /projects, all 12 project pages, /404) with correct social links and contact info
- [x] T053 [P] Validate mobile sidebar behavior: opens on hamburger tap, closes on link click/backdrop/Escape, body scroll lock, RTL slides from left when Arabic locale
- [x] T054 [P] Validate duplicate app bar fix: confirm single app bar on mobile at all scroll positions, verify across page transitions
- [x] T055 [P] Validate zero external icon requests in Network tab on any page, and confirm Phosphor SVGs render at correct sizes and colors
- [x] T056 Run `npm run build` — verify clean production build with no errors
- [x] T057 Verify all i18n strings have `{/* TODO: localise this later */}` comments on hardcoded English text strings across all modified files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) for SVG copies — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) — needs Icon.astro, ProjectFeatureCard, ProjectTestimonial, ProjectFAQ
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) — needs Icon.astro, MobileSidebar.astro
- **User Story 4 (Phase 5)**: Depends on Foundational (Phase 2) — needs AppBar.astro/AppBar.ts access; runs in parallel with US1/US2
- **User Story 3 (Phase 6)**: Depends on all other user stories being complete (does final sweep of remaining icon references)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — NO dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational — NO dependencies on other stories (independent of US1)
- **User Story 4 (P1)**: Can start after Foundational — NO dependencies on other stories (independent of US1/US2)
- **User Story 3 (P2)**: Depends on US1 and US2 being complete (needs all pages rewritten first so remaining FA references are isolated)

### Within Each User Story

- Project pages (US1): 12 pages can be written in parallel (different files)
- Sub-pages (US1): 3 pages can be updated in parallel
- Footer + Contact + Sidebar (US2): Footer and Contact are independent files; Sidebar depends on AppBar.ts changes
- Icon replacements (US3): All 8 files can be updated in parallel

### Parallel Opportunities

- All Setup tasks T001-T004 can run in parallel
- All Foundational tasks T005-T014 can run in parallel within Phase 2 (T005-T006 icon system, T007-T009 shared components, T010 sidebar, T011-T014 styles)
- Once Foundational completes, US1, US2, and US4 can ALL start in parallel
- Within US1: T015-T021 (7 branded projects) all run parallel; T022-T026 (5 standard) all run parallel; T027-T030 (sub-pages + index) all run parallel
- Within US2: T031 (footer) and T032-T033 (contact) can run parallel; T034-T035 (sidebar integration) depends on MobileSidebar.astro from foundation
- Within US3: T040-T047 (8 file replacements) all run parallel

---

## Parallel Example: User Story 1 (Branded Projects)

```bash
# Launch all 7 branded project rewrites together:
Task: "Rewrite src/pages/projects/zaryn.astro — branded layout with dashboard mockup"
Task: "Rewrite src/pages/projects/numu.astro — branded layout with floating icons"
Task: "Rewrite src/pages/projects/matrix.astro — branded layout with glow effects"
Task: "Rewrite src/pages/projects/medev.astro — branded layout with medical theme"
Task: "Rewrite src/pages/projects/chopshop.astro — branded layout with e-commerce theme"
Task: "Rewrite src/pages/projects/deshikitchen.astro — branded layout with restaurant theme"
Task: "Rewrite src/pages/projects/moneybox.astro — branded layout with finance theme"

# Launch all 5 standard project rewrites together:
Task: "Rewrite src/pages/projects/photorestore-ai.astro — standard case-study layout"
Task: "Rewrite src/pages/projects/medical-education-app.astro — standard case-study layout"
Task: "Rewrite src/pages/projects/nss-virtual-education-fair.astro — standard case-study layout"
Task: "Rewrite src/pages/projects/bd-railway-automated-timetable.astro — standard case-study layout"
Task: "Rewrite src/pages/projects/malaysian-business-websites.astro — standard case-study layout"
```

---

## Parallel Example: User Story 3 (Icon Migration)

```bash
# Launch all icon replacement tasks together:
Task: "Replace Font Awesome in src/pages/index.astro"
Task: "Replace Font Awesome in src/pages/services.astro"
Task: "Replace Font Awesome in src/pages/clients.astro"
Task: "Replace Font Awesome in src/pages/404.astro"
Task: "Replace Font Awesome in src/components/home/*.astro"
Task: "Replace Font Awesome in src/components/project/ProjectGallery.astro and ProjectCTA.astro"
Task: "Replace Font Awesome in src/components/shared/ContactForm.astro"
Task: "Replace Font Awesome in src/animations/*.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 4)

1. Complete Phase 1: Setup (copy SVGs)
2. Complete Phase 2: Foundational (Icon.astro, shared components, sidebar)
3. Complete Phase 3: User Story 1 (all 12 project pages)
4. Complete Phase 5: User Story 4 (fix duplicate app bar)
5. **STOP and VALIDATE**: Projects have unique layouts, no duplicate app bar
6. Deploy/demo if ready — projects showcase different branding

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (Project layouts) → Test independently → Projects are unique and branded
3. US2 (Footer, Contact, Sidebar) → Test independently → Mobile nav works, footer complete
4. US4 (Duplicate app bar) → Test independently → Single app bar verified
5. US3 (Icon migration complete) → Test independently → Zero external icon requests
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (12 project pages — big effort)
   - Developer B: User Story 2 (footer + contact + sidebar)
   - Developer C: User Story 4 (duplicate app bar — small, quick fix)
3. After US1 and US2 complete:
   - Developer A + B: User Story 3 (final icon sweep across all pages)

---

## Notes

- [P] tasks = different files, no dependencies — can run in parallel
- [US?] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All hardcoded English text strings must include `{/* TODO: localise this later */}` comment
- Reference Hugo site files at `../baseetStudioWebSIte/layouts/projects/*.html` for layout patterns
- Use `resolveIcon()` function from `iconMappings.ts` to convert old FA classes to Phosphor names
- `npm run build` must succeed after every phase
