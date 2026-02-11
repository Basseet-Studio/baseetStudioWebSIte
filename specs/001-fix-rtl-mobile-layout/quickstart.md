# Quickstart: Fix RTL Mobile Layout

**Feature**: 001-fix-rtl-mobile-layout  
**Date**: 2026-02-11

## Prerequisites

- Hugo Extended v0.152.2+
- Node.js v18+ and npm
- Git

## Setup

```bash
# 1. Switch to the feature branch
git checkout 001-fix-rtl-mobile-layout

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

## Verify the Fix

### Test 1: Arabic Mobile Content (US1 — P1)

1. Open `http://localhost:1313/ar/` in Chrome DevTools
2. Set viewport to **375px width** (iPhone SE)
3. **Expected**: No horizontal scrollbar. All content fits within viewport.
4. Navigate to `/ar/services/`, `/ar/projects/`, `/ar/customers/`, `/ar/contact/`
5. **Expected**: Same — no overflow on any page.

### Test 2: Mobile Menu Position (US2 — P1)

1. Stay at 375px width on `/ar/`
2. Tap the hamburger icon (☰)
3. **Expected**: Menu slides in from the **left** edge (RTL convention)
4. Menu links should be right-aligned (Arabic text flows RTL)
5. Tap any link — menu closes, navigates correctly
6. Open menu again, tap backdrop — menu closes
7. Open menu again, press Escape — menu closes

### Test 3: English Mobile Menu (regression check)

1. Switch to `http://localhost:1313/` (English)
2. At 375px viewport, tap hamburger
3. **Expected**: Menu slides in from the **right** edge (unchanged from before)

### Test 4: App Bar Mirroring (US3 — P2)

1. Open `http://localhost:1313/ar/` at **1280px width** (desktop)
2. **Expected**: Logo ("استوديو بسيط") on the **right** side, nav links on the **left**
3. Switch to `http://localhost:1313/` (English)
4. **Expected**: Logo ("Baseet Studio") on the **left**, nav links on the **right**
5. Return to Arabic, resize to 375px
6. **Expected**: Hamburger icon and language toggle on the **left** side

### Test 5: Desktop Language Switcher (edge case)

1. At 1280px on `/ar/`, click the language globe icon
2. **Expected**: Dropdown appears anchored to the **left** (not right)
3. Switch to English, click globe
4. **Expected**: Dropdown anchored to the **right** (unchanged)

## Build Verification

```bash
# Must pass before merging
npm run lint
npm run test
npm run build
```

## Files Changed

| File | Change |
|------|--------|
| `layouts/partials/header.html` | Remove `dir="ltr"` from `<header>` and `<nav>` |
| `layouts/partials/shared/header.html` | Same as above |
| `assets/css/app-bar.css` | Replace physical → logical properties; fix RTL menu transform; remove dead CSS; scope RTL selectors |
