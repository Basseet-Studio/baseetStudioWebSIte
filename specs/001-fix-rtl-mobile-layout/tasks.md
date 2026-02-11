# Tasks: Fix RTL Mobile Layout

**Input**: Design documents from `/specs/001-fix-rtl-mobile-layout/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Hugo static site**: `layouts/` for templates, `assets/css/` for stylesheets
- All paths relative to repository root

---

## Phase 1: Setup

**Purpose**: Ensure feature branch is ready and dev server works in both languages

- [ ] T001 Verify feature branch `001-fix-rtl-mobile-layout` is checked out and `npm run dev` starts without errors
- [ ] T002 Verify current broken state: open `/ar/` at 375px viewport in Chrome DevTools and document the horizontal overflow and mobile menu mispositioning

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Remove hardcoded `dir="ltr"` from both header partials — this MUST happen before any CSS work can take effect, because the hardcoded attribute overrides all `[dir="rtl"]` CSS selectors.

**⚠️ CRITICAL**: No user story CSS work can function until this phase is complete.

- [ ] T003 [P] Remove `dir="ltr"` from `<header>` element (line 4) and `<nav id="mobile-menu">` element (line 74) in `layouts/partials/header.html`
- [ ] T004 [P] Remove `dir="ltr"` from `<header>` element (line 4) and `<nav id="shared-mobile-menu">` element (line 51) in `layouts/partials/shared/header.html`

**Checkpoint**: Both headers now inherit `dir` from `<html>`. The app bar will already start mirroring on Arabic pages (flexbox auto-reversal). However, the mobile menu CSS still uses physical properties, so it may slide from the wrong side until Phase 3 is complete.

---

## Phase 3: User Story 1 — Arabic Mobile Page Content Stays On-Screen (Priority: P1) 🎯 MVP

**Goal**: Eliminate horizontal overflow on all Arabic mobile pages so content stays within viewport.

**Independent Test**: Open `/ar/` at 375px width — no horizontal scrollbar should appear on any page.

### Implementation for User Story 1

- [ ] T005 [US1] Replace `.app-bar { left: 0; }` with `.app-bar { inset-inline-start: 0; }` in `assets/css/app-bar.css` (line 8) to prevent the fixed app bar from contributing to overflow in RTL
- [ ] T006 [US1] Replace the overly broad `[dir='rtl'] { text-align: right; }` rule (line 456–458) in `assets/css/app-bar.css` with a scoped selector `[dir='rtl'] .app-bar { text-align: right; }` to prevent side-effects on other page sections
- [ ] T007 [US1] Remove the duplicate dead CSS blocks for `[dir='rtl'] .mobile-nav-links` (lines 466–483 — two identical blocks) in `assets/css/app-bar.css` and replace with a single correctly scoped block that will now work because `dir="ltr"` override was removed in T003/T004
- [ ] T008 [US1] Verify no horizontal overflow at 320px, 375px, 768px, and 1280px on `/ar/`, `/ar/services/`, `/ar/projects/`, `/ar/customers/`, and `/ar/contact/`

**Checkpoint**: Arabic mobile pages display all content within viewport. No horizontal scrollbar at any tested width.

---

## Phase 4: User Story 2 — Mobile Menu Opens in the Correct Position (Priority: P1)

**Goal**: Mobile menu slides from the left edge on RTL pages and from the right edge on LTR pages.

**Independent Test**: On 375px width in Arabic, tap hamburger — menu slides in from the left. In English, menu still slides from the right.

### Implementation for User Story 2

- [ ] T009 [US2] Replace `.mobile-menu { right: 0; }` with `.mobile-menu { inset-inline-end: 0; }` in `assets/css/app-bar.css` (line 163) so menu anchors to the correct edge based on document direction
- [ ] T010 [US2] Add `[dir="rtl"] .mobile-menu { transform: translateX(-100%); }` rule in `assets/css/app-bar.css` after the `.mobile-menu` block to hide the menu off-screen to the left in RTL (default `translateX(100%)` remains for LTR)
- [ ] T011 [US2] Replace `.mobile-menu { box-shadow: -2px 0 10px rgba(0,0,0,0.1); }` with a logical equivalent and add `[dir="rtl"] .mobile-menu.open { box-shadow: 2px 0 10px rgba(0,0,0,0.1); }` in `assets/css/app-bar.css` so the shadow appears on the correct edge
- [ ] T012 [US2] Update the RTL `.mobile-nav-links` rules (consolidated in T007) to use `text-align: right` and correct padding (`padding-inline-end: 1.5rem; padding-inline-start: 1rem;`) in `assets/css/app-bar.css`
- [ ] T013 [US2] Verify at 375px: (a) Arabic — menu slides from left, links right-aligned, tap link closes menu, tap backdrop closes menu, Escape closes menu; (b) English — menu slides from right (no regression)

**Checkpoint**: Mobile menu is fully functional in both language directions.

---

## Phase 5: User Story 3 — App Bar Mirrors for RTL (Priority: P2)

**Goal**: App bar layout flips for RTL — logo on right, nav/controls on left.

**Independent Test**: At 1280px on `/ar/`, logo is on the right side and nav links on the left. At 375px, hamburger and language toggle are on the left.

### Implementation for User Story 3

- [ ] T014 [US3] Replace `.language-switcher { margin-left: 1.5rem; }` with `.language-switcher { margin-inline-start: 1.5rem; }` in `assets/css/app-bar.css` (line 290) so the switcher spacing flips with direction
- [ ] T015 [US3] Replace `.lang-dropdown { right: 0; }` with `.lang-dropdown { inset-inline-end: 0; }` in `assets/css/app-bar.css` (line 340) so the language dropdown anchors to the correct edge in RTL
- [ ] T016 [US3] Replace `.skip-to-content { left: -9999px; }` and `:focus { left: 0; }` with `.skip-to-content { inset-inline-start: -9999px; }` and `:focus { inset-inline-start: 0; }` in `assets/css/app-bar.css` (lines 426–438)
- [ ] T017 [US3] Update the RTL comment block (lines 442–455) in `assets/css/app-bar.css` to document the new approach: "App bar and mobile menu now inherit direction from `<html>`. Flexbox automatically mirrors layout in RTL."
- [ ] T018 [US3] Verify at 1280px: Arabic — logo right, nav left, language dropdown anchors left. English — logo left, nav right (no regression). At 375px: Arabic — hamburger/lang toggle on left. English — on right.

**Checkpoint**: App bar fully mirrors in both directions on all viewports.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and full verification across all stories

- [ ] T019 Remove any remaining CSS comments referencing the old "forced LTR by user choice" design decision in `assets/css/app-bar.css`
- [ ] T020 Run `npm run lint` and fix any formatting issues introduced by CSS changes
- [ ] T021 Run `npm run build` and verify clean production build with no errors
- [ ] T022 Run full quickstart.md validation: all 5 test scenarios (Arabic mobile content, mobile menu position, English regression, app bar mirroring, desktop language switcher)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories** (removing `dir="ltr"` is prerequisite for all CSS fixes)
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2)
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) — can run **in parallel** with US1 (different CSS properties)
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) — can run **in parallel** with US1 and US2 (different CSS properties)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent after Phase 2 — fixes overflow issues
- **User Story 2 (P1)**: Independent after Phase 2 — fixes menu positioning. T012 depends on T007 (consolidated RTL nav rules)
- **User Story 3 (P2)**: Independent after Phase 2 — fixes app bar mirroring

### Within Each User Story

- CSS property changes before verification tasks
- Each story's verification is the final task in its phase

### Parallel Opportunities

- T003 and T004 can run in parallel (different files)
- After Phase 2, all three user stories (Phases 3–5) can proceed in parallel:
  - US1 touches: `.app-bar` positioning, global RTL selector, dead CSS cleanup
  - US2 touches: `.mobile-menu` positioning, transform, box-shadow, nav link padding
  - US3 touches: `.language-switcher`, `.lang-dropdown`, `.skip-to-content`, comments
- T020 and T021 can run in parallel (lint vs build)

---

## Parallel Example: All User Stories

```text
# After Phase 2 completes, launch all three stories simultaneously:

# Story 1 (overflow fixes):
T005: Replace .app-bar left → inset-inline-start
T006: Scope [dir='rtl'] text-align rule
T007: Consolidate dead RTL nav rules
T008: Verify no overflow

# Story 2 (menu positioning):
T009: Replace .mobile-menu right → inset-inline-end
T010: Add RTL translateX(-100%) rule
T011: Fix box-shadow direction
T012: Update nav link padding (depends on T007)
T013: Verify menu behavior

# Story 3 (app bar mirroring):
T014: Replace margin-left → margin-inline-start
T015: Replace dropdown right → inset-inline-end
T016: Fix skip-to-content positioning
T017: Update CSS comments
T018: Verify app bar mirroring
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T004) — **CRITICAL**
3. Complete Phase 3: US1 — overflow fixes (T005–T008)
4. Complete Phase 4: US2 — menu positioning (T009–T013)
5. **STOP and VALIDATE**: Arabic mobile is now fully usable
6. Deploy/demo if ready — app bar mirroring (US3) can follow as enhancement

### Full Delivery

1. Setup → Foundational → US1 → US2 → US3 → Polish
2. Each story adds value without breaking previous stories
3. Total: 22 tasks across 6 phases

---

## Notes

- All changes are in 3 files: `layouts/partials/header.html`, `layouts/partials/shared/header.html`, `assets/css/app-bar.css`
- No JavaScript changes required — menu open/close logic uses CSS class toggles
- No i18n key changes — no content files modified
- No new dependencies — pure CSS logical properties (96%+ browser support)
- Commit after each phase for clean git history
- T012 has a soft dependency on T007 (uses the consolidated RTL nav rules block)
