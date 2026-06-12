# Tasks: Studio Site 2 UI Updates

**Input**: Design documents from `/specs/001-ui-studio-site-updates/`
**Prerequisites**: plan.md, spec.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (No User Stories - Pure CSS Changes)

**Purpose**: Verify working environment and understand current state

- [X] T001 [P] Review current cloud colors in src/styles/global.css (--vanta-sky, --vanta-cloud, --vanta-cloud-shadow)
- [X] T002 [P] Review current app bar styling in src/styles/nav.css (position, height, radius)
- [X] T003 [P] Review current AppBar.astro component structure and link styling
- [X] T004 [P] Review ProjectHeader.astro usage in Project.astro layout and project pages

---

## Phase 2: User Story 1 - Consistent Navigation (Priority: P1) 🎯 MVP

**Goal**: Remove per-project header, use single app bar on all pages

**Independent Test**: Navigate to /projects/chopshop and verify main AppBar appears (not ProjectHeader)

### Implementation for User Story 1

- [X] T005 [US1] Remove ProjectHeader from src/layouts/Project.astro
- [X] T006 [P] [US1] Remove ProjectHeader import from src/pages/projects/chopshop.astro
- [X] T007 [P] [US1] Remove ProjectHeader import from src/pages/projects/deshikitchen.astro
- [X] T008 [P] [US1] Remove ProjectHeader import from src/pages/projects/matrix.astro
- [X] T009 [P] [US1] Remove ProjectHeader import from src/pages/projects/medev.astro
- [X] T010 [P] [US1] Remove ProjectHeader import from src/pages/projects/moneybox.astro
- [X] T011 [P] [US1] Remove ProjectHeader import from src/pages/projects/numu.astro
- [X] T012 [P] [US1] Remove ProjectHeader import from src/pages/projects/zaryn.astro
- [X] T013 [US1] Remove ProjectHeader import from src/pages/projects/index.astro

**Checkpoint**: User Story 1 complete - all project pages now use only the main AppBar

---

## Phase 3: User Story 2 - Light Blue Sky Background (Priority: P2)

**Goal**: Change cloud background from dark to light blue sky

**Independent Test**: Load home page and verify sky color is light blue (#87CEEB)

### Implementation for User Story 2

- [X] T014 [US2] Update --vanta-sky in src/styles/global.css from #0d1117 to #87CEEB
- [X] T015 [US2] Adjust --vanta-cloud-shadow if needed for contrast against light sky

**Checkpoint**: User Story 2 complete - cloud background renders with light blue sky

---

## Phase 4: User Story 3 - Compact Side-Aligned App Bar (Priority: P3)

**Goal**: Make app bar smaller and left-aligned (not centered floating pill)

**Independent Test**: View app bar on desktop - it should be left-aligned, height ~52px, not centered

### Implementation for User Story 3

- [X] T016 [P] [US3] Update nav.css: Remove left: 50%; transform: translateX(-50%) positioning
- [X] T017 [P] [US3] Update nav.css: Set --nav-height-expanded from 72px to 52px
- [X] T018 [P] [US3] Update nav.css: Set --nav-height-collapsed from 48px to 40px
- [X] T019 [P] [US3] Update nav.css: Reduce --nav-radius-expanded from 16px to 8px
- [X] T020 [P] [US3] Update nav.css: Update --nav-radius-collapsed from 50px to 8px
- [X] T021 [US3] Update nav.css: Add left alignment with max-width: 1280px and margin: 0 auto
- [X] T022 [P] [US3] Update AppBar.astro: Change link colors to match original site (#171d1c default, #496bc1 hover)
- [X] T023 [P] [US3] Update AppBar.astro: Add active state underline styling (#496bc1 primary)
- [X] T024 [US3] Update nav.css: Adjust app-bar-container padding to match original site (1rem 2rem)

**Checkpoint**: User Story 3 complete - app bar is compact, left-aligned, with matching link styles

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verify visual consistency and responsive behavior

- [ ] T025 [P] Verify mobile responsive behavior at 375px, 768px, 1280px
- [ ] T026 [P] Verify RTL handling for Arabic language (app bar stays left-aligned)
- [ ] T027 [P] Test mobile hamburger menu on project pages after ProjectHeader removal
- [ ] T028 [P] Verify app bar scroll behavior (collapse/expand) still works on all pages

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (US1)**: No blocking dependencies - can start after setup
- **Phase 3 (US2)**: No blocking dependencies - can start after setup
- **Phase 4 (US3)**: No blocking dependencies - can start after setup
- **Phase 5 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start immediately - no blocking dependencies
- **User Story 2 (P2)**: Can start immediately - no blocking dependencies
- **User Story 3 (P3)**: Can start immediately - no blocking dependencies

All user stories are independent and can be executed in parallel or any order.

---

## Parallel Execution Examples

```bash
# Phase 1 tasks can all run in parallel:
Task: "Review current cloud colors in src/styles/global.css"
Task: "Review current app bar styling in src/styles/nav.css"
Task: "Review current AppBar.astro component structure"
Task: "Review ProjectHeader.astro usage"

# User Story 1 tasks (remove ProjectHeader) can all run in parallel:
Task: "Remove ProjectHeader from src/layouts/Project.astro"
Task: "Remove ProjectHeader import from chopshop.astro"
Task: "Remove ProjectHeader import from deshikitchen.astro"
# ... etc for all project pages

# User Story 3 tasks (styling) marked [P] can run in parallel:
Task: "Update nav.css: Remove center positioning"
Task: "Update nav.css: Set --nav-height-expanded to 52px"
Task: "Update nav.css: Set --nav-radius-expanded to 8px"
Task: "Update AppBar.astro: Change link colors"
Task: "Update AppBar.astro: Add active state underline"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (review current state)
2. Complete Phase 2: User Story 1 (remove ProjectHeader)
3. **STOP and VALIDATE**: Navigate to project pages, verify main AppBar appears
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Phase 1: Setup
2. Add User Story 1 → Test independently → Deploy/Demo
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Polish phase → Final verification

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- This is pure CSS/styling work - no unit tests needed
- Visual verification at 375px, 768px, 1280px required before merge
- App bar must remain functional (mobile menu, scroll behavior)