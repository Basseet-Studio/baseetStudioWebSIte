# Tasks: Branded Project Showcase & Site Restructuring

**Input**: Design documents from `/specs/002-branded-project-showcase/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Global rename (Customers→Clients), new i18n keys, data file restructuring, and content scaffolding that multiple user stories depend on.

- [x] T001 Rename `content/customers/` directory to `content/clients/` and add `aliases: ["/customers/"]` in `content/clients/_index.md` front matter for redirect
- [x] T002 Rename `layouts/customers/` directory to `layouts/clients/` (move `layouts/customers/list.html` → `layouts/clients/list.html`)
- [x] T003 Rename `data/customers.yaml` to `data/clients.yaml`, change root key `customers:` → `clients:`, rename FleetOps entry to Portia Grid (id, name, tagline), add Portia Grid testimonial, add Iyat client entry per data-model.md
- [x] T004 [P] Update menu entries in `hugo.yaml` — rename "Customers" → "Clients" in both English and Arabic menu blocks, change `url: '/customers/'` → `url: '/clients/'` for main and footer menus
- [x] T005 [P] Add new i18n keys to `i18n/en.yaml` — `back_to_baseet`, `nav_features`, `nav_download`, `nav_demo`, `nav_back_to_baseet`, `client_portia-grid_*` keys, `client_iyat_*` keys, `project_chopshop_*` keys, `project_matrix_*` keys, branded nav labels
- [x] T006 [P] Add new i18n keys to `i18n/ar.yaml` — Arabic translations for all keys added in T005
- [x] T007 [P] Update all `customer_` i18n key references to `client_` in `i18n/en.yaml` (rename existing `customer_fleetops_*` keys to `client_portia-grid_*`)
- [x] T008 [P] Update all `customer_` i18n key references to `client_` in `i18n/ar.yaml` (rename existing Arabic customer keys to client equivalents)
- [x] T009 [P] Create `content/projects/chopshop.md` with branded front matter (layout: branded, brandName, navItems, bgEffect: shopping, color: #E11D48) per data-model.md schema
- [x] T010 [P] Create `content/projects/chopshop.ar.md` with Arabic branded front matter matching T009
- [x] T011 [P] Create `content/projects/matrix.md` with branded front matter (layout: branded, brandName, navItems, bgEffect: grid, color: #0891B2, status: Coming Soon) per data-model.md schema
- [x] T012 [P] Create `content/projects/matrix.ar.md` with Arabic branded front matter matching T011

**Checkpoint**: Data files restructured, i18n keys in place, new content files scaffolded. Hugo build should succeed with existing layouts.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core layout and template infrastructure that ALL user stories depend on — the branded layout, adaptive app bar, and background effect system.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T013 Create `layouts/projects/branded.html` — new layout extending baseof.html that defines `main` block with branded page sections (hero, features, download/demo, gallery, testimonials, FAQ, contact), injects CSS variables (`--project-color`, `--project-gradient`, `--bg-fallback`) from front matter, loads branded-effects.css per contracts/branded-layout.md
- [x] T014 Modify `layouts/partials/shared/header.html` — add conditional logic: if `.Page.Params.project.brandName` exists AND `.Page.Layout == "branded"`, render branded mode (product logo with brand color, iterate `.Page.Params.project.navItems`, add "Back to Baseet" link); else render studio mode (existing behavior). Apply to both desktop nav and mobile menu per contracts/adaptive-app-bar.md
- [x] T015 Add branded app bar CSS styles to `assets/css/app-bar.css` — `.app-bar-logo.branded` class with dynamic color via `var(--project-color)`, "Back to Baseet" link styling with arrow icon, active nav underline using `var(--project-gradient)`
- [x] T016 Modify `layouts/partials/shared/clouds-background.html` — add conditional JS loading: read `.Page.Params.project.bgEffect` (default "clouds"), load the matching JS renderer file (leaves.js, paper-notes.js, kitchen.js, shopping.js, grid.js, or clouds.js) via Hugo resources.Get with minify/fingerprint, pass `--bg-fallback` CSS variable per contracts/background-effects.md
- [x] T017 [P] Create `assets/css/branded-effects.css` — shared CSS for branded backgrounds: fallback gradient via `var(--bg-fallback)`, `prefers-reduced-motion` handling (hide canvas, show static gradient), responsive height adjustments matching clouds.css pattern

**Checkpoint**: Foundation ready — branded layout renders, app bar adapts based on page context, background system conditionally loads correct effect. User story implementation can now begin.

---

## Phase 3: User Story 1 — Branded Product Landing Pages (Priority: P1) 🎯 MVP

**Goal**: All 5 branded product pages (Nomu, Money Box, Desi Kitchen, ChopShop, Matrix) render with their own identity, branded app bar, and placeholder backgrounds at their designated URLs.

**Independent Test**: Navigate to `/projects/numu/`, `/projects/money-box/`, `/projects/deshikitchen/`, `/projects/chopshop/`, `/projects/matrix/` — each should display product-specific hero, features, contact section, branded app bar with correct nav items, and "Back to Baseet" link.

### Implementation for User Story 1

- [x] T018 [US1] Update `content/projects/numu.md` front matter — add `layout: branded`, `project.brandName: 'Nomu'`, `project.navItems` (Home, Features, Download, Contact), `project.bgEffect: 'leaves'`, `project.bgFallbackGradient` (green nature gradient)
- [x] T019 [P] [US1] Update `content/projects/numu.ar.md` front matter — add same branded fields as T018 with Arabic nav labels
- [x] T020 [P] [US1] Update `content/projects/money-box.md` front matter — add `layout: branded`, `project.brandName: 'Money Box'`, `project.navItems` (Home, Features, Download, Contact), `project.bgEffect: 'paper-notes'`, `project.bgFallbackGradient` (gold/warm gradient)
- [x] T021 [P] [US1] Update `content/projects/money-box.ar.md` front matter — add same branded fields as T020 with Arabic nav labels
- [x] T022 [P] [US1] Update `content/projects/deshikitchen.md` front matter — add `layout: branded`, `project.brandName: 'Desi Kitchen'`, `project.navItems` (Home, Features, Demo, Contact), `project.bgEffect: 'kitchen'`, `project.bgFallbackGradient` (warm orange gradient)
- [x] T023 [P] [US1] Update `content/projects/deshikitchen.ar.md` front matter — add same branded fields as T022 with Arabic nav labels
- [x] T024 [US1] Verify `content/projects/chopshop.md` (created in T009) renders correctly with branded layout — confirm hero, features, demo CTA, contact section, "Ready to Deliver" status badge
- [x] T025 [US1] Verify `content/projects/matrix.md` (created in T011) renders correctly with branded layout — confirm hero, features, "Coming Soon" status badge, contact section
- [x] T026 [US1] Add contact section integration in `layouts/projects/branded.html` — include `{{ partial "contact-form.html" }}` with product-specific params (title, pageName from project.slug)

**Checkpoint**: All 5 branded pages accessible at their URLs, displaying product identity, branded app bar, contact sections. Background effects are fallback-only at this stage (WebGL renderers come in US3).

---

## Phase 4: User Story 2 — Unified Adaptive App Bar (Priority: P2)

**Goal**: The app bar seamlessly transitions between studio branding (main site) and product branding (branded pages), with full mobile menu support and language switching on all pages.

**Independent Test**: Navigate from homepage → any branded page → click "Back to Baseet" → verify app bar logo/nav changes correctly at each step. Test mobile hamburger menu on branded pages.

### Implementation for User Story 2

- [x] T027 [US2] Add "Back to Baseet" link with arrow icon (← or `fas fa-arrow-left`) in `layouts/partials/shared/header.html` desktop nav — only visible when branded mode is active, links to `{{ "/" | relLangURL }}`
- [x] T028 [US2] Add "Back to Baseet" link in mobile menu sidebar in `layouts/partials/shared/header.html` — styled distinctly at bottom of mobile nav list, with `{{ i18n "back_to_baseet" }}` text
- [x] T029 [US2] Update language switcher behavior in `layouts/partials/shared/header.html` — ensure `.AllTranslations` works on branded pages and preserves branded context when switching en↔ar
- [x] T030 [US2] Test and fix mobile menu JavaScript in `layouts/partials/shared/header.html` — verify hamburger toggle, backdrop, escape key, and body scroll lock work with branded nav items (not just `site.Menus.main`)
- [x] T031 [US2] Update `assets/css/app-bar.css` — style ".back-to-baseet" nav link with distinct visual (outlined pill, left arrow, subtle animation on hover), ensure correct spacing in both desktop and mobile layouts

**Checkpoint**: App bar correctly shows studio branding on main pages and product branding on branded pages. "Back to Baseet" works. Mobile menu functions on all pages. Language switching preserves context.

---

## Phase 5: User Story 3 — Unique Background Effects Per Site (Priority: P3)

**Goal**: Each branded product page displays a unique animated WebGL background effect that reinforces the product's visual identity, with CSS fallback and reduced-motion support.

**Independent Test**: Load each branded page and verify a visually distinct animated background. Enable "prefers-reduced-motion" in DevTools and verify fallback gradient. Disable WebGL and verify CSS fallback.

### Implementation for User Story 3

- [x] T032 [P] [US3] Create `assets/js/leaves.js` — LeafRenderer class (WebGL shader) with floating leaf particle effect, green/nature tones (#AF52DE Nomu palette), following CloudsRenderer interface per contracts/background-effects.md (~300 lines)
- [x] T033 [P] [US3] Create `assets/js/paper-notes.js` — PaperNotesRenderer class (WebGL shader) with drifting paper/currency rectangles, warm gold tones (#34C759 Money Box palette), following CloudsRenderer interface (~300 lines)
- [x] T034 [P] [US3] Create `assets/js/kitchen.js` — KitchenRenderer class (WebGL shader) with rising steam/spice wisps, warm orange tones (#F97316 Desi Kitchen palette), following CloudsRenderer interface (~300 lines)
- [x] T035 [P] [US3] Create `assets/js/shopping.js` — ShoppingRenderer class (WebGL shader) with floating package/bag outlines, rose accents (#E11D48 ChopShop palette), following CloudsRenderer interface (~300 lines)
- [x] T036 [P] [US3] Create `assets/js/grid.js` — GridRenderer class (WebGL shader) with pulsing grid lines and data-rain effect, cyan tones (#0891B2 Matrix palette), following CloudsRenderer interface (~300 lines)
- [x] T037 [US3] Verify each background effect loads correctly on its designated branded page — confirm canvas renders, animations are smooth, auto-pause on tab hidden, resize handling works
- [x] T038 [US3] Verify `prefers-reduced-motion` fallback for all 5 effects — confirm canvas is hidden and static gradient background is displayed via `var(--bg-fallback)` in `assets/css/branded-effects.css`

**Checkpoint**: All 5 branded pages have visually distinct animated backgrounds. Fallback works for reduced-motion and non-WebGL browsers. Existing cloud effect on main site is unchanged.

---

## Phase 6: User Story 4 — Standard Project Pages (Priority: P4)

**Goal**: Photo Restore AI, Medical Education App, BD Railway, NSS Virtual Education Fair, and Malaysian Corporate Websites render as standard project pages within the studio framework (NOT branded layout), retaining the studio app bar.

**Independent Test**: Navigate to `/projects/photorestore-ai/`, `/projects/medical-education-app/`, etc. — each should show the studio app bar (not product-specific), use the default single.html layout, and display correct project content.

### Implementation for User Story 4

- [x] T039 [P] [US4] Verify `content/projects/photorestore-ai.md` uses `layout: single` (or has no layout override) — confirm it renders with `layouts/projects/single.html` and studio app bar
- [x] T040 [P] [US4] Verify `content/projects/medical-education-app.md` uses standard layout and displays "Coming Soon" status correctly
- [x] T041 [P] [US4] Verify `content/projects/bd-railway-automated-timetable.md` renders with standard layout
- [x] T042 [P] [US4] Verify `content/projects/nss-virtual-education-fair.md` renders with standard layout
- [x] T043 [P] [US4] Verify `content/projects/malaysian-business-websites.md` renders with standard layout
- [x] T044 [US4] Ensure app bar shows studio branding (not branded mode) on all standard project pages — verify `.Page.Params.project.brandName` is absent or `layout` is not `branded` in their front matter

**Checkpoint**: All standard project pages render correctly within the studio framework. The adaptive app bar correctly identifies them as non-branded and shows studio navigation.

---

## Phase 7: User Story 5 — Homepage Restructuring & Client Section (Priority: P5)

**Goal**: Homepage "Our Products" section categorizes and links products correctly to branded or standard pages. "Clients" section (renamed from Customers) displays Portia Grid with testimonial and Iyat with portfolio link.

**Independent Test**: Load homepage — verify products link to correct page types, "Clients" label everywhere (not "Customers"), Portia Grid testimonial visible, Iyat entry with working link.

### Implementation for User Story 5

- [x] T045 [US5] Update `data/home/projects.yaml` — add `type: branded` to Nomu, Money Box, DeshiKitchen entries; add `type: standard` to PhotoRestore AI, Medical Education App, NSS Virtual Education Fair, BD Railway, Malaysian Corporate Websites; add full ChopShop and Matrix entries with `type: branded` per data-model.md
- [x] T046 [US5] Update `layouts/partials/blocks/home/projects.html` — modify the projects loop to check `type` field: branded items link to `/projects/{{ .slug }}/` (landing page), standard items link to `/projects/{{ .slug }}/` (same URL pattern but different display treatment — e.g., branded gets prominent cards, standard gets compact list)
- [x] T047 [US5] Update `layouts/clients/list.html` (moved from customers in T002) — change all `site.Data.customers` references to `site.Data.clients`, update `customer_` i18n key prefix to `client_`, add "View Project" link button when `.link` field is non-empty (for Iyat), ensure testimonial section renders for Portia Grid
- [x] T048 [US5] Update `content/clients/_index.md` — set `title: 'Clients'`, add `aliases: ["/customers/"]` for redirect from old URL
- [x] T049 [P] [US5] Update `content/clients/_index.ar.md` — set Arabic title for Clients section, add `aliases: ["/ar/customers/"]`
- [x] T050 [US5] Update `layouts/home.html` — replace `site.Data.home.clients` reference (if clients section is shown on homepage) or add a clients preview section; ensure the homepage sections reflect the new structure
- [x] T051 [US5] Verify Portia Grid renders with correct name, testimonial quote ("Most devs just build what you tell them..."), author (Hassan), and role (CEO & Founder of Portia Grid) in `layouts/clients/list.html`
- [x] T052 [US5] Verify Iyat entry renders with name, description, and "View Project" link to `https://iyat-site.mohameda-elobaid.workers.dev/portfolio` in `layouts/clients/list.html`

**Checkpoint**: Homepage correctly links all products. Clients section shows Portia Grid and Iyat. No remaining "Customers" references anywhere.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Bilingual parity verification, final QA, performance audit, cleanup.

- [x] T053 [P] Verify all branded pages render correctly in Arabic (`/ar/projects/numu/`, `/ar/projects/money-box/`, etc.) — RTL layout, Arabic nav labels, Arabic content, "Back to Baseet" in Arabic
- [x] T054 [P] Verify clients page renders correctly in Arabic (`/ar/clients/`) — RTL layout, Arabic content for Portia Grid and Iyat
- [x] T055 Grep entire codebase for remaining "Customers" or "customer_" references — fix any missed in templates, data files, i18n, or content (except git history)
- [x] T056 Grep entire codebase for remaining "FleetOps" or "fleetops" references — fix any missed renames to Portia Grid / portia-grid
- [x] T057 Run `npm run lint` and fix any ESLint errors in new JS files (leaves.js, paper-notes.js, kitchen.js, shopping.js, grid.js)
- [x] T058 Run `npm run build` and verify clean production build with no errors
- [x] T059 Run quickstart.md verification checklist — test all pages, app bar transitions, background effects, mobile menu, language switching
- [x] T060 Performance check — verify each branded page loads in <3s on throttled connection (DevTools 3G), background animations maintain 30+ fps on mobile simulation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion (i18n keys, data files, content files must exist) — BLOCKS all user stories
- **US1 - Branded Pages (Phase 3)**: Depends on Phase 2 (branded layout and app bar must exist)
- **US2 - Adaptive App Bar (Phase 4)**: Depends on Phase 2 (header partial must have conditional logic). Can run in parallel with US1.
- **US3 - Background Effects (Phase 5)**: Depends on Phase 2 (background loading system must exist). Can run in parallel with US1 and US2.
- **US4 - Standard Pages (Phase 6)**: Depends on Phase 2 (app bar must correctly identify non-branded pages). Can run in parallel with US1-US3.
- **US5 - Homepage & Clients (Phase 7)**: Depends on Phase 1 (data/clients.yaml must exist) and Phase 2 (clients layout must be moved). Can run in parallel with US1-US4.
- **Polish (Phase 8)**: Depends on all user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational only — can be MVP standalone
- **US2 (P2)**: Depends on Foundational only — enhances US1 experience
- **US3 (P3)**: Depends on Foundational only — enhances US1 visual identity
- **US4 (P4)**: Depends on Foundational only — no cross-story dependencies
- **US5 (P5)**: Depends on Phase 1 data restructuring — no cross-story dependencies

### Within Each User Story

- Content/data updates before template work
- Template structure before CSS styling
- Core implementation before integration testing

### Parallel Opportunities

**Phase 1** (max parallelism):
- T004, T005, T006, T007, T008, T009, T010, T011, T012 can all run in parallel (different files)
- T001, T002, T003 are sequential (directory renames before data updates)

**Phase 2** (limited parallelism):
- T017 can run in parallel with T013-T016
- T013-T016 are mostly sequential (branded layout → header → CSS → background system)

**Phase 3** (high parallelism per product):
- T018-T023 can run in parallel (different content files per product)
- T024, T025 depend on T009, T011 (verify files created in Phase 1)

**Phase 5** (maximum parallelism):
- T032, T033, T034, T035, T036 can ALL run in parallel (each is an independent JS file)

**Phase 7** (moderate parallelism):
- T048, T049 can run in parallel
- T045-T047 are mostly sequential

---

## Parallel Example: Background Effects (Phase 5)

```bash
# All 5 background renderers can be built simultaneously:
Task T032: Create assets/js/leaves.js (Nomu)
Task T033: Create assets/js/paper-notes.js (Money Box)
Task T034: Create assets/js/kitchen.js (Desi Kitchen)
Task T035: Create assets/js/shopping.js (ChopShop)
Task T036: Create assets/js/grid.js (Matrix)
```

## Parallel Example: Content Scaffolding (Phase 1)

```bash
# All new content files can be created simultaneously:
Task T009: Create content/projects/chopshop.md
Task T010: Create content/projects/chopshop.ar.md
Task T011: Create content/projects/matrix.md
Task T012: Create content/projects/matrix.ar.md
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (data restructuring, i18n keys, content scaffolding)
2. Complete Phase 2: Foundational (branded layout, adaptive app bar, background system)
3. Complete Phase 3: User Story 1 (branded pages with product identity)
4. **STOP and VALIDATE**: All 5 branded pages load with correct identity, app bar, and fallback backgrounds
5. Deploy/demo if ready — this is a fully functional MVP

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. Add US1 (branded pages) → **MVP: 5 product landing pages live** ✅
3. Add US2 (app bar polish) → Seamless navigation between products and studio
4. Add US3 (background effects) → Visual identity fully realized with unique animations
5. Add US4 (standard pages) → Complete portfolio presentation
6. Add US5 (homepage + clients) → Full site restructuring complete
7. Polish → Production-ready

### Single Developer Strategy (Recommended)

Work sequentially through phases: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8. Each phase builds on the previous and can be committed/verified independently.

---

## Notes

- [P] tasks = different files, no dependencies between them
- [Story] label maps task to specific user story for traceability
- Branded pages reuse existing project content (hero, features, FAQ, testimonials) — no content duplication
- Each background effect (~300 lines) follows the same CloudsRenderer class interface
- The `layout: branded` front matter field is the single switch that activates all branded features for a page
- Tests not included — not requested in spec. Add via separate task if needed.
