# Research: Fix RTL Mobile Layout

**Feature**: 001-fix-rtl-mobile-layout  
**Date**: 2026-02-11

## Research Task 1: Mobile Menu Slide-in Direction for RTL

**Context**: The mobile menu is currently positioned with physical properties (`right: 0; transform: translateX(100%)`) and slides in from the right. In RTL, it should slide from the left.

### Decision: Use `inset-inline-end` + `[dir="rtl"]` selector to flip `translateX`

### Rationale

CSS logical properties (`inset-inline-end: 0`) correctly map to `right: 0` in LTR and `left: 0` in RTL — so positioning works automatically. However, `translateX()` is a **physical** transform with no logical equivalent. In RTL, where the menu is at `left: 0`, `translateX(100%)` pushes it to the right (into the viewport). We need `translateX(-100%)` in RTL.

The resulting pattern:

```css
.mobile-menu {
  position: fixed;
  top: 0;
  inset-inline-end: 0;        /* right:0 in LTR, left:0 in RTL */
  transform: translateX(100%); /* hides off-screen right in LTR */
}
[dir="rtl"] .mobile-menu {
  transform: translateX(-100%); /* hides off-screen left in RTL */
}
.mobile-menu.open {
  transform: translateX(0);     /* same in both directions */
}
```

### Alternatives Considered

| Alternative | Verdict |
|---|---|
| Pure logical properties only | **Rejected** — `translateX` has no logical equivalent |
| Transition `inset-inline-end` instead of `transform` | **Rejected** — transitioning layout properties triggers reflow; much worse perf than composited `transform` |
| CSS custom property `--dir: 1/-1` with `calc()` | Same complexity as `[dir]` selector with no benefit |
| Keep physical `right: 0` and use `[dir="rtl"]` to swap to `left: 0` | Works but forgoes logical properties; less future-proof |

### Browser Support

`inset-inline-end`: Chrome 87+, Edge 87+, Firefox 63+, Safari 14.1+ — **96.46% global coverage**. No concerns.

---

## Research Task 2: Flexbox Auto-Mirroring in RTL

**Context**: The app bar uses `display: flex; justify-content: space-between`. Currently `dir="ltr"` is hardcoded. If we remove it and let `dir="rtl"` inherit, does flexbox mirror automatically?

### Decision: Let `dir` inherit naturally. Do NOT add `flex-direction: row-reverse`.

### Rationale

Per the CSS Flexbox specification: flex items flow along the inline axis, and the inline axis direction is determined by the `dir` attribute. With `display: flex; flex-direction: row; justify-content: space-between`:

- **LTR**: first child → left, last child → right
- **RTL**: first child → right, last child → left

This is exactly the desired behavior. The logo (first child) goes to the "start" side and nav (last child) goes to the "end" side.

Adding `flex-direction: row-reverse` would **double-reverse** in RTL, putting items back in the LTR order — wrong.

### Alternatives Considered

| Alternative | Verdict |
|---|---|
| `flex-direction: row-reverse` in RTL | **Rejected** — cancels out the RTL reversal |
| Keep `dir="ltr"` and manually reposition | **Rejected** — defeats purpose of proper bidi support |
| Use CSS `order` property | **Rejected** — unnecessary complexity |

### Browser Support

Flexbox respecting `dir` is part of the core specification. Supported in all browsers since flexbox was shipped. No known issues in Safari, Firefox, or Chrome.

### Gotchas

- `justify-content: space-between` is direction-aware — correct, no action needed
- Child elements with `margin-left` / `margin-right` will NOT auto-flip — must convert to `margin-inline-start` / `margin-inline-end`
- Asymmetric padding, border-radius, or shadows may need manual adjustment

---

## Research Task 3: Tailwind CSS 4.x RTL Support

**Context**: The project uses Tailwind CSS v4.1.17. Need to understand built-in RTL utilities.

### Decision: Use Tailwind's logical property utilities as primary approach; `rtl:`/`ltr:` variants for physical properties; custom CSS `[dir="rtl"]` for complex multi-property overrides.

### Rationale

Tailwind CSS v4 has three layers of RTL support:

1. **Logical property utilities** (preferred): `ms-*`/`me-*` (margin-inline-start/end), `ps-*`/`pe-*` (padding-inline-start/end). These auto-flip based on `dir` with zero variant overhead.

2. **`rtl:` / `ltr:` variants**: Generate selectors using `:dir()` pseudo-class and `[dir]` attribute fallback. Use for physical properties with no logical equivalent (transforms, border-radius).

3. **Custom `[dir="rtl"]` CSS**: For complex multi-property overrides where many properties change together (mobile menu transform + box-shadow direction).

### Alternatives Considered

| Alternative | Verdict |
|---|---|
| Only `rtl:`/`ltr:` variants | **Rejected** — doubles utility class count; logical properties are cleaner |
| Only custom `[dir="rtl"]` CSS | **Rejected** — loses utility-first benefit |
| Third-party RTL plugin | **Rejected** — unnecessary in v4; built-in is comprehensive |

### Key Detail: `px-*` changed in v4

In Tailwind v3, `px-4` generated `padding-left` + `padding-right`. In v4, it generates `padding-inline`, which is direction-aware. This is beneficial for this change — existing `px-*` utilities already handle RTL correctly.

### Browser Support

- `rtl:` variant uses `:dir()` (Chrome 120+, Firefox 49+, Safari 16.4+) with `[dir="rtl"]` attribute fallback for older browsers.
- Logical properties: Baseline Widely Available (Chrome 87+, Firefox 66+, Safari 15+).

---

## Research Task 4: Horizontal Overflow Root Cause

**Context**: Arabic pages on mobile have content pushed off the right edge, causing horizontal scrollbar.

### Decision: The root cause is the hardcoded `dir="ltr"` on the app bar header conflicting with `dir="rtl"` on `<html>`.

### Rationale

When `<html dir="rtl">` is set but `<header dir="ltr">` is hardcoded:

1. The page body content flows RTL (text-align right, flex start on right)
2. The header flows LTR independently
3. Some sections set their own `dir="rtl"` explicitly (services, customers, contact)
4. Other sections inherit RTL from `<html>` but may have elements with conflicting expectations

The overflow is most likely caused by:
- Elements positioned with `left: 0` or `right: 0` that don't account for the RTL context
- The `.app-bar` itself being `position: fixed; left: 0; width: 100%` — this is fine regardless of direction
- Content in sections using physical margins/paddings (from theme CSS) that add up beyond viewport width in RTL

### Fix approach

1. Remove `dir="ltr"` from header elements (they inherit `dir` from `<html>`)
2. Convert physical properties to logical properties in `app-bar.css`
3. Add `overflow-x: hidden` on `<html>` or `<body>` as a safety net (but only after fixing the root cause — not as a band-aid)
4. Test at 320px, 375px, 768px, 1280px in both directions

---

## Research Task 5: Impact on Shared Header Partial

**Context**: There are two header partials — `layouts/partials/header.html` and `layouts/partials/shared/header.html`. Both have `dir="ltr"` hardcoded.

### Decision: Apply identical changes to both header partials.

### Rationale

The shared header has the same structure and the same hardcoded `dir="ltr"` on both the `<header>` and `<nav>` elements. The mobile menu in the shared header has id `shared-mobile-menu` (vs `mobile-menu` in the main header) and includes `data-lang` attribute but is otherwise identical in structure. CSS changes in `app-bar.css` target class names (`.app-bar`, `.mobile-menu`) which both headers use.

### Action items

- Remove `dir="ltr"` from both `<header>` and `<nav>` in both files
- Ensure CSS selectors work for both `#mobile-menu` and `#shared-mobile-menu`
- Since CSS targets classes (`.mobile-menu`), no ID-specific changes needed

---

## Summary of All Decisions

| # | Topic | Decision | Key Reason |
|---|-------|----------|------------|
| 1 | Menu slide direction | `inset-inline-end` + `[dir="rtl"]` for transform | `translateX` has no logical equivalent |
| 2 | Flex mirroring | Let `dir` inherit; flexbox reverses automatically | Built-in per CSS spec |
| 3 | Tailwind RTL | Logical utilities + `rtl:` variants + custom CSS | Three-layer approach covers all cases |
| 4 | Horizontal overflow | Remove hardcoded `dir="ltr"` + convert physical properties | Root cause is direction conflict |
| 5 | Shared header | Apply identical changes to both partials | Same structure, same issues |
