---
description: "Task list for Site 2 Round 3 — Content, Icons & Navigation Hardening"
---

# Tasks: Site 2 Round 3 — Content, Icons & Navigation Hardening

**Input**: Design documents from `/specs/003-round-3-migration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md
**Tests**: Tests are OPTIONAL per the workflow — no automated test framework exists in this repo, manual verification is the pattern. No test tasks are generated.

**Organization**: Tasks are grouped by user story (US1..US7) to enable independent implementation and testing of each story. Foundational infra (SVG copy, AR mirror tree, scripts directory) is in Phase 2 because it blocks multiple stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, …)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `scripts/`, `public/icons/` at `baseetstudiosite2/` root
- Adjust per `plan.md` Source Code section

## User Story Map (from spec.md)

| ID | Title | Priority | Phase |
|---|---|---|---|
| US1 | Migrate team, project, social link data | P1 | Phase 3 |
| US2 | Fix project subpage 404 + content offset | P1 | Phase 4 |
| US3 | Fix language switcher | P1 | Phase 5 |
| US4 | Visitor auto-detect in footer | P2 | Phase 6 |
| US5 | Complete Phosphor icon coverage + clover logo | P1 | Phase 7 |
| US6 | Recover missing CSS | P2 | Phase 8 |
| US7 | Project details use suitable Phosphor icons | P3 | Phase 9 |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare directory structure, scripts, and tooling for the round.

- [x] T001 Create `baseetstudiosite2/scripts/` directory (one-time `mkdir -p`)
- [x] T002 Create `baseetstudiosite2/src/scripts/` directory for client-side TS modules
- [x] T003 Create `baseetstudiosite2/src/pages/ar/` mirror tree: `src/pages/ar/`, `src/pages/ar/projects/`, `src/pages/ar/projects/[slug]/`
- [x] T004 [P] Add `prebuild` script to `baseetstudiosite2/package.json` that runs `node scripts/verify-icons.mjs` to fail the build on missing icons
- [x] T005 Create `baseetstudiosite2/scripts/copy-phosphor-icons.mjs` per [contracts/icon-copier.md](./contracts/icon-copier.md) (parses `iconMappings.ts`, copies SVGs from `phosphor-icons/SVGs/` to `public/icons/`, always copies `clover-bold.svg`)
- [x] T006 Run `node baseetstudiosite2/scripts/copy-phosphor-icons.mjs` — produces ~116 SVG files across `public/icons/{regular,bold,fill}/` (use a temp workdir if repo is read-only)
- [x] T007 Create `baseetstudiosite2/scripts/verify-icons.mjs` (read-only check that every mapping in `iconMappings.ts` resolves to a local SVG file; exit 1 on missing)
- [x] T008 [P] Extend `baseetstudiosite2/src/components/icons/iconMappings.ts` with new entries per [research.md §6](./research.md#6-icon-component-polish) (clover, translate, status icons, section icons)
- [x] T009 [P] Update `baseetstudiosite2/src/components/icons/Icon.astro` to emit `import.meta.env.DEV && console.warn(...)` when the SVG is missing in both primary and fallback variant (per [research.md §6](./research.md#6-icon-component-polish))

**Checkpoint**: Foundation ready — `npm run build` should succeed with all icon mappings resolving. Run `node scripts/verify-icons.mjs` to confirm zero missing icons.

---

## Phase 3: User Story 1 — Migrate Team, Project, Social Link Data (Priority: P1) 🎯 MVP

**Goal**: Replace `"#"` placeholders in `links.json` and `team.json` with real URLs from the old Hugo site. Apply the hide-if-missing rule (FR-032/033/034) so no icon is rendered for a missing URL.

**Independent Test**: Load `/` → count `<a>` elements inside the team section. Should match the count of non-`"#"` URLs across all members' social blocks. Open any project page → count platform badges — should match the count of non-`"#"` URLs in `links.json.projects[slug]`. No `<a href="#">` anywhere inside any social/team/platform container.

### Implementation for User Story 1

- [x] T010 [US1] Remove the `_linksSource` placeholder comment from the top of `baseetstudiosite2/src/content/data/team.json`
- [x] T011 [P] [US1] Verify `baseetstudiosite2/src/content/data/links.json` `social.*` keys match the 8 platforms in `footer.json` `social` array; no edits to values (per hide-if-missing rule, `"#"` values remain as-is)
- [x] T012 [P] [US1] Verify `baseetstudiosite2/src/content/data/links.json` `projects.*.{ios,android,web}` matches the old Hugo `baseetStudioWebSIte/data/shared/links.yaml` `projects` section (already mirrored — no value change)
- [x] T013 [P] [US1] Verify `baseetstudiosite2/src/content/data/links.json` `team.*.{github,linkedin,twitter}` matches the 4 members in `team.json` (already mirrored — no value change)
- [x] T014 [US1] Edit `baseetstudiosite2/src/pages/index.astro` team section: for each member, render only social platforms where `member.social[platform]` is truthy and not `"#"`. Use the per-platform conditional pattern: `{member.social.github && member.social.github !== '#' && (<a href={member.social.github} aria-label="GitHub"><Icon name="github-logo-fill" variant="fill" size={16} /></a>)}` — apply to github, linkedin, twitter per member
- [x] T015 [P] [US1] Edit `baseetstudiosite2/src/components/nav/AppBar.astro`: in the frontmatter `socialLinks` array, filter entries with `url && url !== '#'`. Use the same Phosphor `Icon` (variant `fill`) pattern. Verify Twitter is omitted when studio-level `links.json.social.twitter` is `"#"`
- [x] T016 [P] [US1] Edit `baseetstudiosite2/src/components/shared/Footer.astro`: confirm the existing `.filter(item => url && url !== '#')` still works for the 8 social platforms. If not present, add the filter in the frontmatter (per [data-model.md](./data-model.md) "Rendering" section)
- [x] T017 [P] [US1] Edit `baseetstudiosite2/src/components/project/ProjectCTA.astro` (or wherever platform badges render): for each platform, render the badge only if `links.json.projects[slug][platform]` is truthy and not `"#"`. Apply to ios, android, web
- [x] T018 [US1] Add a top-of-file comment in `baseetstudiosite2/src/content/data/links.json` documenting the hide-if-missing rule: `// Per FR-032: social icons hide when URL is "#" or missing. No URL invention required.`

**Checkpoint**: User Story 1 is fully functional. Load the home page → team section shows 3 icons for ariad/dibakar, 2 icons for mohamed/asadur (no Twitter). Footer shows 5 social icons (no Facebook, YouTube, Dribbble). App bar shows 3 social icons (no Twitter).

---

## Phase 4: User Story 2 — Fix Project Subpage 404 + Content Offset (Priority: P1)

**Goal**: Eliminate the 404 on `/projects/{slug}/features/demo/` by fixing the AppBar project nav URL builder. Push the first content section on every project subpage ≥140px below the floating app bar.

**Independent Test**: On `/projects/zaryn/features/`, click "Demo" → navigates to `/projects/zaryn/demo/` (200). Repeat for all 4 nav items. Measure Y-coordinate of the first `<h1>` on `/projects/zaryn/index/`, `/features/`, `/demo/`, `/terms/` — all within 4px of each other.

### Implementation for User Story 2

- [x] T019 [US2] Edit `baseetstudiosite2/src/components/nav/AppBar.astro` project nav `<ul>` render block: change `href={item.url || '#'}` to `href={`/${lang === 'ar' ? 'ar/' : ''}projects/${slug || ''}/${item.url}`}` (root-relative URL, matches the `navLinks` constant pattern in the same file) — this fixes the relative-URL bug
- [x] T020 [P] [US2] Edit `baseetstudiosite2/src/pages/projects/[slug]/index.astro`: find the first content `<section>` (with the colored pill badge / heading / subtitle) and change `padding: 100px 24px 64px` → `padding: 140px 24px 64px`
- [x] T021 [P] [US2] Edit `baseetstudiosite2/src/pages/projects/[slug]/features.astro`: same padding change on the first `<section>`
- [x] T022 [P] [US2] Edit `baseetstudiosite2/src/pages/projects/[slug]/demo.astro`: same padding change on the first `<section>`
- [x] T023 [P] [US2] Edit `baseetstudiosite2/src/pages/projects/[slug]/terms.astro`: same padding change on the first `<section>`
- [x] T024 [US2] Verify padding consistency: visually inspect the 8 branded project pages (`zaryn`, `medev`, `chopshop`, `deshikitchen`, `moneybox`, `numu`, `matrix`, plus any other branded pages) and confirm first-section top padding is consistent. Adjust any individual `projects/{slug}.astro` files that have their own padding

**Checkpoint**: User Story 2 is fully functional. All 32 project subpage combinations (8 projects × 4 subpages) load with HTTP 200. Visual offset is consistent.

---

## Phase 5: User Story 3 — Fix Language Switcher (Priority: P1)

**Goal**: Make the EN ⇄ AR language switcher functional by creating the missing `src/pages/ar/` mirror route tree. Remove the stale `data-astro-reload` attribute. Add a Phosphor `translate` icon next to the label.

**Independent Test**: On `/projects/zaryn/`, click the language switcher → URL changes to `/ar/projects/zaryn/`, page reloads, `html[lang="ar"]` and `html[dir="rtl"]` are set, text is Arabic, project color/gradient preserved. Click again → back to EN.

### Implementation for User Story 3

- [x] T025 [US3] Create 5 root AR pages: `ar/index.astro`, `ar/services.astro`, `ar/clients.astro`, `ar/contact.astro`, `ar/404.astro` per [contracts/i18n-routing.md](./contracts/i18n-routing.md) "Per-file pattern" — each imports the same layout/components as its EN sibling, passes `lang="ar"`, wraps visible strings in `t(lang, 'key')`
- [x] T026 [P] [US3] Create `ar/projects/index.astro` (mirror of `projects/index.astro` with `lang="ar"`)
- [x] T027 [P] [US3] Create 12 AR project pages: `ar/projects/{chopshop,deshikitchen,matrix,medev,moneybox,numu,zaryn,photorestore-ai,medical-education-app,nss-virtual-education-fair,bd-railway-automated-timetable,malaysian-business-websites}.astro` — each is the EN file's content with `lang="ar"` prop
- [x] T028 [P] [US3] Create 4 AR project subpages: `ar/projects/[slug]/index.astro`, `features.astro`, `demo.astro`, `terms.astro` — each uses `getStaticPaths()` to generate 8 paths, passes `lang="ar"` to `ProjectLayout`
- [x] T029 [US3] Edit `baseetstudiosite2/src/components/shared/LanguageSwitcher.astro`: remove the `data-astro-reload` attribute (not valid in Astro 5.x — keep the real `<a href={targetPath}>`); add `<Icon name="translate" size={14} />` next to the EN/AR label
- [x] T030 [US3] Run `cd baseetstudiosite2 && npm run build` and verify `dist/ar/projects/zaryn/demo/index.html` and all other AR files are produced (per [contracts/i18n-routing.md](./contracts/i18n-routing.md) "Verification" section)

**Checkpoint**: User Story 3 is fully functional. EN ⇄ AR toggle works on every page (home, services, clients, contact, 404, all 12 project pages, all 4 subpages). Arabic text renders, `dir="rtl"` set, Noto Sans Arabic font loads.

---

## Phase 6: User Story 4 — Visitor Auto-Detect in Footer (Priority: P2)

**Goal**: Detect the visitor's device and country and display a discreet one-line indicator at the bottom of the footer.

**Independent Test**: Load any page → within 4 seconds, the footer line reads `Visiting from {Country} · Device {Mobile|Tablet|Desktop}` (or `Unknown` on timeout). Reload — country reuses sessionStorage, no second network request.

### Implementation for User Story 4

- [x] T031 [US4] Create `baseetstudiosite2/src/scripts/visitor-detect.ts` per [contracts/visitor-detect.md](./contracts/visitor-detect.md) — TypeScript port of the old Hugo `baseetStudioWebSIte/assets/js/visitor-detect.js`. Export `init(): void` that reads `#visitor-info` data attrs, detects device, fetches country with 3s timeout + fallback, writes `textContent` (no XSS)
- [x] T032 [US4] Edit `baseetstudiosite2/src/layouts/Base.astro`: add a `<script>` block before `</body>` that imports `init` from `visitor-detect` and calls it on `DOMContentLoaded` AND `astro:page-load` (so view transitions re-trigger the detection)
- [x] T033 [US4] Verify `baseetstudiosite2/src/components/shared/Footer.astro` still has the `<p id="visitor-info" data-visiting data-device data-unknown>` element (already exists per the round 2 spec; do not remove)

**Checkpoint**: User Story 4 is fully functional. Visitor line populates within 4 seconds on every page load, including after view transitions.

---

## Phase 7: User Story 5 — Complete Phosphor Icon Coverage + Clover Logo (Priority: P1)

**Goal**: Every icon used in the site renders as a real Phosphor SVG (not an empty fallback). The Baseet logo is `clover-bold.svg`. No external icon/font requests.

**Independent Test**: Open DevTools Network tab on any page → zero requests to external icon CDNs. All social icons in footer, app bar, team, project platform badges, feature grids, and the clover logo render as visible SVGs. No `<span class="phosphor-icon phosphor-icon--fallback">` elements with zero dimensions.

### Implementation for User Story 5

- [x] T034 [US5] Edit `baseetstudiosite2/src/components/nav/AppBar.astro`: replace the text-only "Baseet" logo span with an `<img src="/icons/bold/clover-bold.svg" alt="Baseet" width="24" height="24" />` placed before the text label. Style to match existing logo sizing
- [x] T035 [P] [US5] Edit `baseetstudiosite2/src/components/shared/Footer.astro`: replace the text-only "Baseet Studio" footer logo with an `<img src="/icons/bold/clover-bold.svg" alt="Baseet" width="20" height="20" />`
- [x] T036 [P] [US5] Edit `baseetstudiosite2/src/components/shared/ContactForm.astro` line with `<i class="fas fa-paper-plane">`: replace with `<Icon name="paper-plane-tilt" size={16} />` (Phosphor equivalent; if the file is not present, fall back to `<Icon name="paper-plane" size={16} />` and add a comment to copy via `scripts/copy-phosphor-icons.mjs`)
- [x] T037 [P] [US5] Edit `baseetstudiosite2/src/pages/services.astro`: confirm the existing `Icon` calls in the service categories render (uses `resolveIcon(category.icon || 'fas fa-circle').name` — already wired)
- [x] T038 [US5] Run `node scripts/verify-icons.mjs` to confirm zero missing Phosphor SVG files for any icon referenced in the codebase
- [x] T039 [US5] Open the browser Network tab, load every page (home, services, clients, contact, all 12 project pages, 404, both EN and AR variants), and confirm zero requests to external icon CDNs, font CDNs (other than the configured Google Fonts preconnect), or any third-party script

**Checkpoint**: User Story 5 is fully functional. All icons render as real SVGs. Zero external icon/font requests. Clover logo appears in app bar and footer.

---

## Phase 8: User Story 6 — Recover Missing CSS (Priority: P2)

**Goal**: Diff old Hugo CSS against new Astro CSS and add missing visual patterns (focus rings, hover transitions, smooth scroll, reduced-motion). Make the new build feel as polished as the old one.

**Independent Test**: Tab through the home page → every interactive element shows a visible focus ring. Hover a footer social icon → background transitions to brand color within 200ms. Set `prefers-reduced-motion: reduce` in browser → all transitions disabled.

### Implementation for User Story 6

- [x] T040 [P] [US6] Add `:focus-visible` outline rules to `baseetstudiosite2/src/styles/global.css`: `a:focus-visible, button:focus-visible, input:focus-visible, [tabindex]:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }` (uses WCAG AA contrast)
- [x] T041 [P] [US6] Add `html { scroll-behavior: smooth; }` and `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; scroll-behavior: auto !important; } }` to `baseetstudiosite2/src/styles/global.css`
- [x] T042 [P] [US6] Add a `.footer-social-icon` hover transition to `baseetstudiosite2/src/styles/global.css`: `transition: background 200ms ease, transform 200ms ease;` and a `:hover` rule that changes background to the brand color (per FR-030)
- [x] T043 [P] [US6] Audit the old Hugo `baseetStudioWebSIte/assets/css/` against `baseetstudiosite2/src/styles/` — add any missing rules for: button hover lift, link underline transition, card glassmorphism consistency, gradient text utilities. Document any not-applicable patterns (e.g. Tailwind-only utilities the new site inlines)
- [x] T044 [US6] Run `cd baseetstudiosite2 && npm run build` and visually compare 3 pages (home, project hero, footer) against the old Hugo build. Add CSS rules for any visible regression

**Checkpoint**: User Story 6 is fully functional. All interactive elements have visible focus rings. Hover states transition within 200ms. Reduced-motion preference is respected.

---

## Phase 9: User Story 7 — Project Details Use Suitable Phosphor Icons (Priority: P3)

**Goal**: Every project page section (tech stack, FAQ, status, CTA) has a relevant Phosphor icon for visual structure.

**Independent Test**: Open any project page → scan top to bottom → every section heading and badge has a visible icon matching the section's intent.

### Implementation for User Story 7

- [x] T045 [P] [US7] Add `<Icon name="code" size={20} color={project.color} />` to the tech stack section heading in `baseetstudiosite2/src/pages/projects/[slug]/index.astro`
- [x] T046 [P] [US7] Add `<Icon name="question" size={20} color={project.color} />` to the FAQ section heading in `baseetstudiosite2/src/pages/projects/[slug]/index.astro`
- [x] T047 [P] [US7] Add a `statusIconMap` in `baseetstudiosite2/src/pages/projects/[slug]/index.astro` frontmatter: `const statusIconMap = { 'Ready to Deliver': 'rocket', 'In Development': 'wrench', 'Live': 'check-circle', 'Coming Soon': 'hourglass' }` — use `<Icon name={statusIconMap[project.status] || 'circle'} size={14} />` in the status badge
- [x] T048 [P] [US7] Add `<Icon name="arrow-right" size={16} />` inside the gradient CTA "Get in Touch" button in `baseetstudiosite2/src/pages/projects/[slug]/index.astro`
- [x] T049 [US7] Verify the 12 individual `projects/{slug}.astro` files (zaryn, medev, etc.) that don't use the `[slug]/index.astro` shared template — if they have their own status badge / CTA / tech stack / FAQ sections, add the same icons

**Checkpoint**: User Story 7 is fully functional. Every project page has visible section icons matching the section's intent.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, documentation, and cleanup. Affects multiple user stories.

- [x] T050 [P] Run `cd baseetstudiosite2 && npm run lint` and fix any lint errors introduced by the round
- [x] T051 [P] Run `cd baseetstudiosite2 && npm run build` and confirm zero build errors, all AR routes emitted, zero missing icons (via `prebuild` hook firing `verify-icons.mjs`)
- [x] T052 [P] Manual click-through verification per [quickstart.md](./quickstart.md) "End-to-End Verification" section: every footer social icon, every team social icon, every project subpage nav, the language switcher, the visitor line, the focus rings, the padding offset, the icon coverage
- [x] T053 [P] Manual network audit: open DevTools Network tab on home, project, contact, 404 (both EN and AR) → confirm zero external icon/font requests
- [x] T054 [P] Confirm `dist/ar/projects/zaryn/demo/index.html` exists (proves the 404 path is fixed and AR routes built)
- [x] T055 [P] Update `baseetstudiosite2/AGENTS.md` "Recent Changes" section with the round 3 entry (already done during plan; verify it's in place)
- [x] T056 Code cleanup: remove any dead `<i class="fab fa-*">` or `<i class="fas fa-*">` markup that was replaced by `<Icon>` (use `rg "fab? fa-" baseetstudiosite2/src` to find any remaining occurrences)
- [x] T057 Final review: re-read [spec.md](./spec.md) and verify all 11 success criteria (SC-001 through SC-011) are met. Document any unmet criteria in the spec's "Notes" section

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories** (SVG copy and AR mirror tree are required by US3, US5, US7)
- **Phase 3 (US1)**: Depends on Phase 2 — needs `iconMappings.ts` extended and SVG files copied
- **Phase 4 (US2)**: Depends on Phase 2 only (independent of US1 data migration)
- **Phase 5 (US3)**: Depends on Phase 2 (AR mirror tree is the big lift)
- **Phase 6 (US4)**: Depends on Phase 1 only (no SVG/AR dependency)
- **Phase 7 (US5)**: Depends on Phase 2 (uses the copied SVGs and extended mappings)
- **Phase 8 (US6)**: No dependencies on prior user stories
- **Phase 9 (US7)**: Depends on Phase 2 (uses the copied SVGs and extended mappings)
- **Phase 10 (Polish)**: Depends on all desired user stories

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **US2 (P1)**: Can start after Phase 2 — touches `AppBar.astro` which US1 also touches → **coordinate edits** (US1 task T015 modifies the `socialLinks` array in the same file as US2 task T019)
- **US3 (P1)**: Can start after Phase 2 — independent (creates new files in `src/pages/ar/`)
- **US4 (P2)**: Can start after Phase 1 — independent (new TS file + Base.astro edit)
- **US5 (P1)**: Can start after Phase 2 — independent of other stories (uses copied SVGs)
- **US6 (P2)**: Can start after Phase 1 — independent (CSS-only)
- **US7 (P3)**: Can start after Phase 2 — touches `projects/[slug]/index.astro` which US2 also touches (T020) — **coordinate edits**

### Within Each User Story

- Component/JSX before styles
- Data migrations before rendering changes
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Phase 1 tasks marked [P] can run in parallel
- All Phase 2 tasks marked [P] can run in parallel (after T005/T006/T007 are done — T008 and T009 are pure code edits)
- US1, US3, US4, US5, US6 can start in parallel after Phase 2 (different files, no overlap)
- US2 and US7 share `projects/[slug]/index.astro` — coordinate; do not parallelize within that file
- US1 task T015 and US2 task T019 both touch `AppBar.astro` — coordinate; do not parallelize within that file

---

## Parallel Examples

### Example 1: Phase 2 Foundational (after T005–T007 done)

```bash
# T008 and T009 are pure code edits to different files
Task: "Extend iconMappings.ts with new entries"
Task: "Add dev-only console.warn to Icon.astro"
# Both can be edited in parallel
```

### Example 2: User Story 1 (after Phase 2)

```bash
# T010 is a single-file edit; T011/T012/T013 are verification (read-only)
# T014 (team section) and T015 (app bar) and T016 (footer) and T017 (project CTA)
# each touch different files — parallelise:
Task: "Edit index.astro team section with per-platform filter"
Task: "Edit AppBar.astro socialLinks filter"
Task: "Edit Footer.astro social filter"
Task: "Edit ProjectCTA.astro platform filter"
```

### Example 3: User Story 3 (after Phase 2)

```bash
# T025 creates 5 root AR files sequentially (different files but same pattern)
# T026, T027, T028 are independent file sets:
Task: "Create ar/projects/index.astro"
Task: "Create 12 ar/projects/{slug}.astro files"
Task: "Create 4 ar/projects/[slug]/*.astro files"
# All three can run in parallel by different agents
```

### Example 4: User Story 7 (after Phase 2)

```bash
# T045, T046, T047, T048 are 4 separate edits to the same file
# (projects/[slug]/index.astro) — must run SEQUENTIALLY in the same file
# But T049 (audit the 12 individual project files) can run in parallel with T045–T048
Task: "Add code icon to tech stack heading"
Task: "Add question icon to FAQ heading"
Task: "Add status icon map to status badge"
Task: "Add arrow-right to CTA button"
Task: "Audit 12 individual projects/*.astro files"
```

---

## Implementation Strategy

### MVP First (Phases 1, 2, 3, 4, 5, 7)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 — Data migration + hide-if-missing filter
4. Complete Phase 4: US2 — Project subpage 404 fix + padding
5. Complete Phase 5: US3 — AR routes + language switcher
6. Complete Phase 7: US5 — Phosphor icons + clover logo
7. **STOP and VALIDATE**: build, lint, click-through, network audit
8. **MVP delivered**: site is fully self-contained, all icons render, AR works, project subpages navigate correctly, social icons hide when missing

### Incremental Delivery (Full Round)

1. Setup + Foundational → Foundation ready
2. Add US1 → Data + hide-if-missing (visible improvement: no broken links)
3. Add US2 → 404 fix + padding (visible improvement: nav works)
4. Add US3 → AR routes (visible improvement: bilingual site actually works)
5. Add US4 → Visitor detection (analytics signal)
6. Add US5 → Phosphor icons (visible improvement: icons render, brand mark)
7. Add US6 → CSS recovery (polish)
8. Add US7 → Project detail icons (polish)
9. Polish → final verification
10. Each story adds value without breaking previous stories

### Parallel Team Strategy (4 developers)

1. **All together**: Phase 1 (Setup) + Phase 2 (Foundational)
2. **After Phase 2**:
   - Developer A: US1 (data migration, touches `links.json`, `team.json`, `index.astro`, `AppBar.astro`, `Footer.astro`, `ProjectCTA.astro`)
   - Developer B: US2 + US3 (project pages + AR routes — mostly file creation, parallel-safe)
   - Developer C: US4 + US6 (visitor detect TS + CSS — different files)
   - Developer D: US5 + US7 (icon component polish + project detail icons — touches `projects/[slug]/index.astro` which Developer B also edits → coordinate)
3. All converge on Phase 10 (Polish)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable per the "Independent Test" criteria
- No automated tests in this repo (no Jest/Vitest/Playwright config) — manual verification per quickstart.md is the acceptance pattern
- Commit after each task or logical group (suggested granularity: one commit per user story)
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks (e.g. "fix the nav"), same-file conflicts (parallelize only across files), cross-story dependencies that break independence
- **Coordination required**:
  - `AppBar.astro`: US1 (T015 social filter) + US2 (T019 nav URL fix) + US5 (T034 clover logo) — do these sequentially in that order
  - `Footer.astro`: US1 (T016 social filter) + US5 (T035 clover logo) — sequential
  - `Base.astro`: US3 (no edits but referenced) + US4 (T032 script tag) + US6 (no edits) — T032 is the only Base.astro edit
  - `projects/[slug]/index.astro`: US2 (T020 padding) + US7 (T045–T048 icons) — sequential in that order
- Hide-if-missing rule (FR-032) is a cross-cutting pattern — every surface that renders social icons or platform badges must apply it. US1 covers the four primary surfaces (team, app bar, footer, project CTA); spot-check any remaining surfaces during Phase 10 polish
