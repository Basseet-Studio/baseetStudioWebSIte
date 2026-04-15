# Tasks: Project Pages Redesign — Unique Layouts, Standalone Pages & Smart Navigation

**Input**: Design documents from `/specs/003-project-pages-redesign/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not requested in spec. No test tasks generated.

**Organization**: Tasks grouped by user story. Each story = independently testable increment.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[US#]**: Which user story this task belongs to
- Exact file paths included in every task

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Migrate content to section bundles, add i18n keys, update base template for header block override

- [X] T001 Add all new i18n keys (project nav, features, demo, terms, footer detector) to i18n/en.yaml per contracts/i18n-keys.md
- [X] T002 [P] Add all corresponding Arabic i18n keys to i18n/ar.yaml per contracts/i18n-keys.md
- [X] T003 Migrate content/projects/money-box.md to content/projects/money-box/_index.md (move file, update layout field from "branded" to "moneybox", add new front matter fields: layoutVariant, fontHeading, fontBody, fontWeights, gsapAnimation, appType, enhanced navItems and navMetaItems per contracts/front-matter-schema.md)
- [X] T004 [P] Migrate content/projects/money-box.ar.md to content/projects/money-box/_index.ar.md (same front matter updates, Arabic title)
- [X] T005 [P] Migrate content/projects/numu.md to content/projects/numu/_index.md (update layout to "numu", add new fields: fontHeading="Quicksand", fontBody="Nunito", gsapAnimation="elastic-bounce", appType="mobile")
- [X] T006 [P] Migrate content/projects/numu.ar.md to content/projects/numu/_index.ar.md (same front matter updates)
- [X] T007 [P] Migrate content/projects/matrix.md to content/projects/matrix/_index.md (update layout to "matrix", add new fields: fontHeading="JetBrains Mono", fontBody="IBM Plex Sans", gsapAnimation="typewriter-glitch", appType="web")
- [X] T008 [P] Migrate content/projects/matrix.ar.md to content/projects/matrix/_index.ar.md (same front matter updates)
- [X] T009 [P] Migrate content/projects/chopshop.md to content/projects/chopshop/_index.md (update layout to "chopshop", add new fields: fontHeading="Outfit", fontBody="DM Sans", gsapAnimation="slide-edges", appType="web")
- [X] T010 [P] Migrate content/projects/chopshop.ar.md to content/projects/chopshop/_index.ar.md (same front matter updates)
- [X] T011 [P] Migrate content/projects/deshikitchen.md to content/projects/deshikitchen/_index.md (update layout to "deshikitchen", add new fields: fontHeading="Playfair Display", fontBody="Source Sans 3", gsapAnimation="parallax-masonry", appType="web")
- [X] T012 [P] Migrate content/projects/deshikitchen.ar.md to content/projects/deshikitchen/_index.ar.md (same front matter updates)
- [X] T013 Verify Hugo dev server builds successfully with migrated section bundles — all 5 existing project URLs still resolve (run `npm run dev` and check /projects/money-box/, /projects/numu/, /projects/matrix/, /projects/chopshop/, /projects/deshikitchen/)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Base template header block override and project app bar partial — MUST complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T014 Modify layouts/baseof.html — replace direct `{{ partial "header.html" . }}` call with `{{ block "header" . }}{{ partial "header.html" . }}{{ end }}` to enable layout-level header override (per research R-006)
- [X] T015 Create layouts/partials/project-header.html — project-specific app bar partial that reads project.navItems and project.navMetaItems from front matter context; includes project brandName as logo in project color, desktop nav with active link detection (compare .RelPermalink suffix to nav item URLs), "Baseet" link to /, "Contact Us" link to /contact/, language switcher (reuse existing partial), mobile hamburger menu, RTL support (per research R-006 and data-model App Bar State)
- [X] T016 Verify header block override works — visit homepage (main header shows), visit any migrated project page (project header shows with correct project name and links)

**Checkpoint**: Foundation ready — header switches between main/project mode. Content migrated to section bundles.

---

## Phase 3: User Story 1 — Unique Project Landing Pages (Priority: P1) 🎯 MVP

**Goal**: Each of the 5 projects has a completely distinct landing page layout with unique section order, component types, fonts, and preserved background effects.

**Independent Test**: Open all 5 project pages side-by-side. No two share same layout, fonts, or component arrangement. Background effects work.

### Implementation for User Story 1

- [X] T017 [P] [US1] Create assets/css/project-moneybox.css — Google Fonts import (Space Grotesk 700, Inter 400/500) with preconnect links, heading/body font-family declarations scoped to .project-page, project-specific utility classes for bento grid layout
- [X] T018 [P] [US1] Create assets/css/project-numu.css — Google Fonts import (Quicksand 600/700, Nunito 400/500), heading/body font-family declarations, utility classes for horizontal scroll carousel
- [X] T019 [P] [US1] Create assets/css/project-matrix.css — Google Fonts import (JetBrains Mono 700, IBM Plex Sans 400/500), heading/body font-family declarations, dark theme utilities, tabbed panel styles
- [X] T020 [P] [US1] Create assets/css/project-chopshop.css — Google Fonts import (Outfit 600/700, DM Sans 400/500), heading/body font-family declarations, alternating row layout utilities
- [X] T021 [P] [US1] Create assets/css/project-deshikitchen.css — Google Fonts import (Playfair Display 700, Source Sans 3 400/500), heading/body font-family declarations, masonry grid utilities, warm gradient helpers
- [X] T022 [US1] Create layouts/projects/moneybox.html — unique Money Box landing layout: defines "header" block with project-header partial, defines "main" block with split-screen hero (text left + phone mockup right), bento grid features (mixed card sizes), gallery section, FAQ accordion, gradient CTA; loads project-moneybox.css, branded-effects.css, preserves bgEffect "paper-notes" background; includes GSAP CDN script tags (defer) and gsap-moneybox.js; full RTL support
- [X] T023 [P] [US1] Create layouts/projects/numu.html — unique Numu landing layout: centered hero with floating habit icons, horizontal scroll feature carousel, gallery, testimonials, gradient CTA; loads project-numu.css, preserves bgEffect "leaves"; GSAP CDN + gsap-numu.js; full RTL support
- [X] T024 [P] [US1] Create layouts/projects/matrix.html — unique Matrix landing layout: dark-themed diagonal split hero, tabbed feature panels, integrations grid, FAQ, gradient CTA; loads project-matrix.css, preserves bgEffect "grid"; GSAP CDN + gsap-matrix.js; full RTL support
- [X] T025 [P] [US1] Create layouts/projects/chopshop.html — unique Chopshop landing layout: full-width hero with food imagery overlay, step-by-step "How It Works" flow, alternating left-right feature rows, platforms section, gradient CTA; loads project-chopshop.css, preserves bgEffect "shopping"; GSAP CDN + gsap-chopshop.js; full RTL support
- [X] T026 [P] [US1] Create layouts/projects/deshikitchen.html — unique Deshi Kitchen landing layout: warm gradient hero with spice illustrations, masonry card feature grid, gallery, social proof ticker mockup, gradient CTA; loads project-deshikitchen.css, preserves bgEffect "kitchen"; GSAP CDN + gsap-deshikitchen.js; full RTL support
- [X] T027 [US1] Verify all 5 project landing pages render with distinct layouts, correct fonts loading (check Network tab), background effects working, responsive at 375px/768px/1280px

**Checkpoint**: All 5 landing pages visually distinct. MVP deliverable.

---

## Phase 4: User Story 2 — Project-Specific App Bar Navigation (Priority: P1)

**Goal**: App bar transforms to project-specific nav (Home | Features | Download/Demo | Terms | Baseet | Contact Us | Language) when inside any project section, with correct branding and active link detection.

**Independent Test**: Click into each project → app bar shows project nav. Click "Baseet" → homepage. Click "Contact Us" → /contact/. Switch language → labels update. Mobile menu works.

### Implementation for User Story 2

- [X] T028 [US2] Enhance layouts/partials/project-header.html — add CSS styling for project app bar: project brandName displayed in project color (read from .Params.project.color or parent project color), active link highlighting based on .Params.activeNav or URL suffix matching, hover states using project color, mobile responsive hamburger menu matching main site pattern but with project nav items
- [X] T029 [US2] Add app-bar CSS for project mode in assets/css/app-bar.css — add .project-app-bar styles: project logo color via CSS variable --project-color, active link underline in project color, transition animation between states if navigating from main site
- [X] T030 [US2] Handle sub-page header context — in layouts/projects/features.html, demo.html, and terms.html (once created), ensure they also define the "header" block to use project-header.html so sub-pages get the project app bar; sub-pages read project data from parent via {{ .Parent.Params.project }}
- [X] T031 [US2] Handle "Download" vs "Demo" label — project-header.html reads project.appType from front matter; if "mobile" show "Download" label (i18n key project_nav_download), if "web" show "Demo" label (i18n key project_nav_demo); both link to "demo/" sub-page
- [X] T032 [US2] Verify app bar behavior across all 5 projects — test: homepage shows main nav, each project shows project nav with correct brandName/color, "Baseet" links to /, "Contact Us" links to /contact/, language switcher works in project mode, active link highlights correctly on landing page, mobile menu opens/closes

**Checkpoint**: App bar context-switching works on all project pages with correct links and branding.

---

## Phase 5: User Story 3 — Standalone Features Pages (Priority: P2)

**Goal**: Each project has a standalone Features page at /projects/<slug>/features/ showing project features in project-branded style.

**Independent Test**: Navigate to each project's /features/ URL → page loads, features display, project app bar shows with "Features" active.

### Implementation for User Story 3

- [ ] T033 [US3] Create layouts/projects/features.html — shared features sub-page template: defines "header" block with project-header.html, defines "main" block that reads features from {{ .Parent.Params.project.features }}, renders features in a grid styled with project CSS variables (--project-color, --project-gradient), loads parent project's CSS file based on project.layoutVariant, shows empty state with i18n "project_features_empty" if no features defined; full RTL support
- [ ] T034 [P] [US3] Create content/projects/money-box/features.md with front matter: title="Money Box Features", layout=features, type=projects, activeNav=features
- [ ] T035 [P] [US3] Create content/projects/money-box/features.ar.md with front matter: title in Arabic, layout=features, type=projects, activeNav=features
- [ ] T036 [P] [US3] Create content/projects/numu/features.md and content/projects/numu/features.ar.md (same pattern, Numu titles)
- [ ] T037 [P] [US3] Create content/projects/matrix/features.md and content/projects/matrix/features.ar.md (same pattern, Matrix titles)
- [ ] T038 [P] [US3] Create content/projects/chopshop/features.md and content/projects/chopshop/features.ar.md (same pattern, Chopshop titles)
- [ ] T039 [P] [US3] Create content/projects/deshikitchen/features.md and content/projects/deshikitchen/features.ar.md (same pattern, Deshi Kitchen titles)
- [ ] T040 [US3] Verify all 5 features pages render correctly — check: features display from parent data, project colors applied, app bar shows project nav with "Features" active, RTL version works at /ar/projects/<slug>/features/

**Checkpoint**: All 5 features pages live with correct branding and navigation.

---

## Phase 6: User Story 4 — Standalone Demo Pages (Priority: P2)

**Goal**: Each project has a standalone Demo page. Mobile apps show download links. Chopshop shows live demo link. Matrix and Deshi Kitchen show "Coming Soon" placeholder.

**Independent Test**: Navigate to each project's /demo/ URL → correct content type displayed (download links vs placeholder).

### Implementation for User Story 4

- [ ] T041 [US4] Create layouts/projects/demo.html — shared demo sub-page template: defines "header" block with project-header.html, defines "main" block that reads project.appType and project.platforms from parent; if appType="mobile" and platforms exist → render platform download cards (iOS/Android links); if appType="web" and project.status != "Coming Soon" → render live demo link/embed area; otherwise → render branded "Coming Soon" placeholder with i18n keys project_demo_coming_soon and project_demo_coming_soon_text; style with project CSS variables; full RTL support
- [ ] T042 [P] [US4] Create content/projects/money-box/demo.md and content/projects/money-box/demo.ar.md (front matter: title, layout=demo, type=projects, activeNav=demo)
- [ ] T043 [P] [US4] Create content/projects/numu/demo.md and content/projects/numu/demo.ar.md (same pattern)
- [ ] T044 [P] [US4] Create content/projects/matrix/demo.md and content/projects/matrix/demo.ar.md (same pattern)
- [ ] T045 [P] [US4] Create content/projects/chopshop/demo.md and content/projects/chopshop/demo.ar.md (same pattern)
- [ ] T046 [P] [US4] Create content/projects/deshikitchen/demo.md and content/projects/deshikitchen/demo.ar.md (same pattern)
- [ ] T047 [US4] Verify all 5 demo pages — check: Money Box/Numu show platform download links, Chopshop shows live demo CTA, Matrix/Deshi Kitchen show branded "Coming Soon" placeholder, app bar shows "Download" or "Demo" as active link correctly

**Checkpoint**: All 5 demo pages live with correct content type per project.

---

## Phase 7: User Story 5 — Standalone Terms & Conditions Pages (Priority: P2)

**Goal**: Each project has a Terms page with identical structural template (7 section headings) but project-branded visuals and placeholder content only.

**Independent Test**: Navigate to each project's /terms/ URL → page loads, 7 sections visible with placeholder text, project branding applied.

### Implementation for User Story 5

- [ ] T048 [US5] Create layouts/projects/terms.html — shared terms sub-page template: defines "header" block with project-header.html, defines "main" block with 7 structural sections (Introduction, Terms of Use, Privacy Policy, Data Collection & Usage, User Rights, Limitations of Liability, Contact Information) using i18n keys project_terms_intro through project_terms_contact; each section has h2 heading + placeholder div with dashed border showing i18n "project_terms_placeholder"; style with project CSS variables; load parent project CSS file; full RTL support
- [ ] T049 [P] [US5] Create content/projects/money-box/terms.md and content/projects/money-box/terms.ar.md (front matter: title="Money Box Terms & Conditions", layout=terms, type=projects, activeNav=terms)
- [ ] T050 [P] [US5] Create content/projects/numu/terms.md and content/projects/numu/terms.ar.md (same pattern)
- [ ] T051 [P] [US5] Create content/projects/matrix/terms.md and content/projects/matrix/terms.ar.md (same pattern)
- [ ] T052 [P] [US5] Create content/projects/chopshop/terms.md and content/projects/chopshop/terms.ar.md (same pattern)
- [ ] T053 [P] [US5] Create content/projects/deshikitchen/terms.md and content/projects/deshikitchen/terms.ar.md (same pattern)
- [ ] T054 [US5] Verify all 5 terms pages — check: 7 section headings rendered, placeholder text visible, project colors/fonts applied, app bar shows "Terms" as active link, all 5 follow identical structure but differ in branding

**Checkpoint**: All 5 terms pages live. All 20 project pages (5×4) now exist.

---

## Phase 8: User Story 6 — GSAP Scroll Animations Per Project (Priority: P3)

**Goal**: Each project landing page has 1-2 unique GSAP scroll-triggered animations. No two projects share same effect. GSAP only loads on project pages.

**Independent Test**: Scroll through each project page → unique animations trigger. Check main homepage → no GSAP loaded.

### Implementation for User Story 6

- [ ] T055 [P] [US6] Create assets/js/gsap-moneybox.js — staggered card flip (feature cards flip in sequentially via ScrollTrigger) + counter roll-up (numbers animate 0→target); check prefers-reduced-motion, register ScrollTrigger, target elements by class selectors within .project-page
- [ ] T056 [P] [US6] Create assets/js/gsap-numu.js — elastic bounce-in (elements enter with spring physics easing via ScrollTrigger on feature carousel items); check prefers-reduced-motion
- [ ] T057 [P] [US6] Create assets/js/gsap-matrix.js — typewriter reveal (hero text types in character-by-character with cursor blink) + glitch shift (horizontal displacement on section h2 headers via ScrollTrigger); check prefers-reduced-motion
- [ ] T058 [P] [US6] Create assets/js/gsap-chopshop.js — slide-from-edges (alternating feature rows slide in from left/right via ScrollTrigger); check prefers-reduced-motion
- [ ] T059 [P] [US6] Create assets/js/gsap-deshikitchen.js — parallax depth layers (hero background/foreground at different scroll speeds) + scale-in masonry (feature cards scale 0→1 with stagger via ScrollTrigger); check prefers-reduced-motion
- [ ] T060 [US6] Verify GSAP animations — scroll through each project page, confirm unique animations trigger; check Network tab on homepage confirms no GSAP loaded; test with prefers-reduced-motion: reduce → animations skipped; check 60fps on throttled CPU in DevTools

**Checkpoint**: All 5 project pages have unique GSAP animations. Main site unaffected.

---

## Phase 9: User Story 7 — Country & Device Detector in Footer (Priority: P3)

**Goal**: Every page displays visitor's detected country and device type in footer. Lightweight, graceful fallback.

**Independent Test**: Load any page, scroll to footer → see "Visiting from: [Country] · Device: [Type]". Disable network → shows "Unknown".

### Implementation for User Story 7

- [ ] T061 [US7] Create assets/js/visitor-detect.js — client-side country detection via fetch to ipapi.co/json/ with 3s timeout, fallback to ip-api.com, cache result in sessionStorage; device detection via navigator.userAgent parsing (Mobile/Tablet/Desktop per data-model rules); sanitize API response before DOM insertion (textContent not innerHTML); inject results into #visitor-info element; fallback to "Unknown" on error
- [ ] T062 [US7] Modify layouts/partials/shared/footer.html — add a small text line element with id="visitor-info" at bottom of footer showing placeholder "Visiting from: ... · Device: ..." using i18n keys footer_visiting_from, footer_device, footer_unknown; style as muted small text; RTL support
- [ ] T063 [US7] Add visitor-detect.js script tag to layouts/baseof.html — load with defer attribute so it runs on all pages (main site and project pages)
- [ ] T064 [US7] Verify footer detector — check on homepage, project landing page, and project sub-page; verify correct device type on desktop browser; verify "Unknown" fallback when network blocked; verify no layout shift from late injection; verify Arabic footer line renders correctly in RTL

**Checkpoint**: Footer detector works site-wide with graceful degradation.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, production build, cross-cutting fixes

- [ ] T065 [P] Run `npm run lint` — fix any ESLint errors in new JS files (gsap-*.js, visitor-detect.js)
- [ ] T066 [P] Run `npm run format` — format all new and modified files with Prettier
- [ ] T067 Run `npm run build` — verify clean production build with all 40 URLs generated (20 EN + 20 AR); check `find public/projects -name "index.html" | wc -l` outputs at least 30
- [ ] T068 Verify out-of-scope projects unchanged — check /projects/photorestore-ai/, /projects/medical-education-app/ still render with branded.html layout, no regressions
- [ ] T069 Run quickstart.md validation — follow all verification steps in specs/003-project-pages-redesign/quickstart.md to confirm end-to-end functionality
- [ ] T070 Responsive spot-check — verify 3 representative pages (one landing, one features, one terms) at 375px, 768px, and 1280px in both EN and AR

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on T001-T002 (i18n keys) and T003-T012 (content migration)
- **Phase 3 (US1 — Unique Layouts)**: Depends on Phase 2 completion (T014-T016)
- **Phase 4 (US2 — App Bar)**: Depends on Phase 2 (T015 project-header.html exists)
- **Phase 5 (US3 — Features Pages)**: Depends on Phase 2 + at least one project layout (T022+) existing for styling reference
- **Phase 6 (US4 — Demo Pages)**: Depends on Phase 2 + at least one project layout
- **Phase 7 (US5 — Terms Pages)**: Depends on Phase 2 + at least one project layout
- **Phase 8 (US6 — GSAP)**: Depends on US1 layouts being complete (T022-T026) since GSAP scripts target elements in those layouts
- **Phase 9 (US7 — Detector)**: Depends on Phase 2 only (modifies footer — independent of project layouts)
- **Phase 10 (Polish)**: Depends on all desired stories being complete

### User Story Dependencies

- **US1 (P1) + US2 (P1)**: Both depend on Phase 2. US2 refines the header created in Phase 2; can overlap with US1.
- **US3 (P2), US4 (P2), US5 (P2)**: All independent of each other. All depend on Phase 2. Can run in parallel.
- **US6 (P3)**: Depends on US1 layouts being complete (GSAP targets elements in those layouts).
- **US7 (P3)**: Independent of all user stories. Only depends on Phase 2.

### Within Each User Story

- CSS files before layout templates (fonts must load)
- Layout templates before content files (template must exist for Hugo to render)
- Content files before verification tasks
- EN content + AR content can be parallel

### Parallel Opportunities

**Phase 1**: T003-T012 content migrations all [P] — different project directories, no conflicts.

**Phase 3 (US1)**: T017-T021 CSS files all [P]. T023-T026 layouts all [P] (after T022 Money Box establishes the pattern). 

**Phases 5-7 (US3/US4/US5)**: Content files within each phase all [P]. Phases 5, 6, 7 can run in parallel since they create different templates (features.html, demo.html, terms.html).

**Phase 8 (US6)**: T055-T059 GSAP JS files all [P] — different files, no shared state.

---

## Parallel Example: Phase 3 (User Story 1)

```
# All CSS files can be created simultaneously:
T017: assets/css/project-moneybox.css
T018: assets/css/project-numu.css
T019: assets/css/project-matrix.css
T020: assets/css/project-chopshop.css
T021: assets/css/project-deshikitchen.css

# Then all layout templates (after CSS ready):
T022: layouts/projects/moneybox.html (first — establishes pattern)
T023: layouts/projects/numu.html      [P]
T024: layouts/projects/matrix.html    [P]
T025: layouts/projects/chopshop.html  [P]
T026: layouts/projects/deshikitchen.html [P]
```

## Parallel Example: Phases 5+6+7 (US3+US4+US5)

```
# Templates can be created in parallel (different files):
T033: layouts/projects/features.html
T041: layouts/projects/demo.html
T048: layouts/projects/terms.html

# Then all content files across all 3 phases in parallel:
T034-T039: features content files  [all P]
T042-T046: demo content files      [all P]
T049-T053: terms content files     [all P]
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (content migration + i18n)
2. Complete Phase 2: Foundational (baseof.html header block + project-header partial)
3. Complete Phase 3: US1 — All 5 unique landing pages
4. Complete Phase 4: US2 — App bar polish
5. **STOP and VALIDATE**: All 5 landing pages render with unique layouts + working project nav
6. Deploy/demo if ready — this is the MVP

### Incremental Delivery

1. Setup + Foundational → content migrated, header block works
2. Add US1 + US2 → 5 unique landings + project nav → **Deploy (MVP!)**
3. Add US3 + US4 + US5 → 15 sub-pages (features + demo + terms) → **Deploy**
4. Add US6 → GSAP animations per project → **Deploy**
5. Add US7 → Footer detector → **Deploy**
6. Polish → lint, format, build verification → **Final Deploy**

---

## Summary

| Metric | Value |
|--------|-------|
| **Total tasks** | 70 |
| **Phase 1 (Setup)** | 13 tasks (T001-T013) |
| **Phase 2 (Foundational)** | 3 tasks (T014-T016) |
| **US1 — Unique Layouts (P1)** | 11 tasks (T017-T027) |
| **US2 — App Bar (P1)** | 5 tasks (T028-T032) |
| **US3 — Features Pages (P2)** | 8 tasks (T033-T040) |
| **US4 — Demo Pages (P2)** | 7 tasks (T041-T047) |
| **US5 — Terms Pages (P2)** | 7 tasks (T048-T054) |
| **US6 — GSAP Animations (P3)** | 6 tasks (T055-T060) |
| **US7 — Footer Detector (P3)** | 4 tasks (T061-T064) |
| **Polish** | 6 tasks (T065-T070) |
| **Parallel opportunities** | 45+ tasks marked [P] |
| **MVP scope** | Phases 1-4 (32 tasks) → 5 unique landing pages with project nav |
| **Independent test per story** | ✅ All 7 stories independently verifiable |
