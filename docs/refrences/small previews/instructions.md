Here's the spec, ready to copy into your repo's docs.

---

# Interactive project previews — implementation spec

## Goal
Three self-contained, lightweight interactive demos (Matrix, Money Box, Habit tracker) embedded in existing preview squares on the projects page. Each demo runs an idle "ghost cursor" autoplay loop and hands control to the real cursor on hover. No new page, no new layout — drop into the square containers that already exist in the design.

## 1. Fit existing squares, don't invent new ones
Don't hardcode `212px` anywhere in the real implementation — that was just the prototype's canvas size. In the real site:

- Each preview component takes `width: 100%; height: 100%` of whatever container/grid cell the design already defines for these squares.
- All internal layout math (card widths, chart viewBox, ghost cursor coordinates) must be computed from `getBoundingClientRect()` of the container at mount time and on resize — never from literal pixel constants.
- Use a `ResizeObserver` on the container to recompute chart/SVG viewBoxes and ghost-cursor waypoints when the square's size changes (responsive breakpoints, container queries, etc).
- If the squares are already responsive via CSS Grid/Flexbox in your Astro layout, the preview components should be `display: block; inline-size: 100%; block-size: 100%;` and do nothing that assumes a fixed aspect ratio unless the design square itself is fixed-aspect (in which case set `aspect-ratio` at the container level, not inside the component).

## 2. Where this lives in Astro
```
src/
  components/
    previews/
      PreviewStage.astro        (shared shell: mounts a client island, owns hover state)
      MatrixPreview.tsx         (or .astro + vanilla JS island)
      MoneyBoxPreview.tsx
      HabitPreview.tsx
      lib/
        ghostCursor.ts          (shared autoplay/hover-takeover engine)
```
Each preview is its own **client island**, not a monolithic page bundle. This is the single biggest performance lever available in Astro.

## 3. Hydration strategy — the main performance decision
These are decorative, below-the-fold-ish interactive widgets. They should **never** hydrate on page load by default.

- Use `client:visible` on each preview island. Astro won't ship or execute their JS until the square scrolls into the viewport (via `IntersectionObserver` under the hood).
- If the projects page is long and these squares are far down, this alone avoids paying any JS cost for users who never scroll there.
- Do **not** use `client:load` for these — there's no reason three toy animations should compete with critical page JS at first paint.
- Each preview's JS/CSS should be its own chunk (Astro does this automatically per-island) so a user who never triggers `client:visible` on the Habit square never downloads its code, even if Matrix and Money Box already hydrated.

## 4. Pause everything that isn't visible or focused
This is the part that's easy to get wrong and turn into a battery/CPU drain across a whole marketing site.

- Wrap each preview's autoplay loop start in the same `IntersectionObserver` that triggers hydration (or a second lightweight one) and **stop the loop's `setTimeout` chain** when `entry.isIntersecting === false`. Resume on re-entry.
- Add a `document.visibilitychange` listener: pause all three loops when `document.hidden === true` (tab backgrounded). This matters a lot if someone leaves the tab open.
- Never use bare `setInterval` for the "random incoming transaction" feed or any looping animation — use `requestAnimationFrame` for anything visual, and clear/cancel it on unmount (`Astro` islands do get torn down on client-side navigation if you're using View Transitions).
- Respect `prefers-reduced-motion: reduce` — if set, skip the ghost-cursor movement animation entirely (snap directly to state changes, no tweening) and slow or disable the autoplay loop, still allowing manual interaction on hover/click.

## 5. The shared "ghost cursor" engine
Extract the logic from the prototype into one small reusable module (`lib/ghostCursor.ts`) instead of duplicating it three times:

```ts
export function createGhostCursor(container: HTMLElement) { ... }
// returns { moveTo(el), click(), show(), hide() }

export function createAutoLoop(container: HTMLElement, stepFn, delay) { ... }
// handles: hover-pause, visibility-pause, reduced-motion, cleanup()
```

Each preview only supplies its own `stepFn` (what the ghost does per tick) and its own render/state functions. This keeps the three demos visually distinct while sharing the one piece of infrastructure that's actually reusable — the idle/hover state machine.

- Hover takeover: `pointerenter`/`pointerleave` (not `mouseenter`/`mouseleave` — better for touch/pen) on the container toggles a `live` flag the loop checks before each step, exactly like the prototype.
- On touch devices there's no hover. Treat a `pointerdown`/`touchstart` inside the square as "taking control" for that interaction, and resume autoplay after a short idle timeout (e.g. 4s of no touch activity) rather than relying on `pointerleave`, which won't fire the same way.

## 6. Performance rules per preview
- **Matrix (kanban):** native HTML5 drag-and-drop is fine and cheap. Avoid a drag library (dnd-kit, react-beautiful-dnd) for something this small — it's unnecessary weight for three cards.
- **Money Box (chart + queue):** rebuild the SVG polyline only on state change, not on a timer. The queue re-render should touch only the DOM nodes that changed (or accept a full innerHTML rebuild of just the small `reqList` node — it's cheap at this scale, no virtual DOM needed).
- **Habit tracker:** same — direct DOM writes, no framework state management needed for two habit cards and seven day-cells each.
- None of these three need React/Vue/Svelte state machines. Vanilla JS islands (Astro supports plain `<script>` islands via a thin custom element or just inline hydration) keep the bundle near-zero. If your codebase already standardizes on React for islands, a single `useEffect`-driven version is fine too — just don't reach for global state libraries here.

## 7. Fonts
Each preview's distinct typography (mono for Matrix, comic/display for Money Box, rounded sans for Habit) should load via `font-display: swap` and be **subset or preloaded only for the squares that are actually likely to hydrate** — i.e. don't block the page's primary font loading on these. If using Google Fonts, self-host via `@fontsource` packages and only import the specific weights used (e.g. `@fontsource/bangers`, not the whole family range) to keep the CSS payload small.

## 8. Accessibility
- Each preview container gets an `aria-label` describing what it is ("Interactive preview: Matrix task board").
- Ghost cursor is purely decorative — `aria-hidden="true"` on that element.
- All real interactive elements (buttons, draggable cards, checkboxes) need normal keyboard access: draggable cards should also support a keyboard-operable status-cycle fallback (e.g. focus + Enter cycles to next column) since drag-and-drop alone isn't keyboard accessible.
- Respect `prefers-reduced-motion` as noted above.

## 9. Cleanup checklist
On unmount (or before re-hydration during client-side nav):
- Cancel any pending `requestAnimationFrame` / `setTimeout` chains.
- Disconnect `IntersectionObserver` and `ResizeObserver` instances.
- Remove `pointerenter`/`pointerleave`/`visibilitychange` listeners.

## 10. Quick perf budget target
- Each preview's JS (excluding shared `ghostCursor.ts`, loaded once): **under ~3KB gzipped**.
- Shared engine: **under ~1.5KB gzipped**.
- Zero third-party runtime dependencies (no chart libs, no DnD libs, no animation libs) — everything here is small enough for vanilla SVG/DOM/CSS.
- No preview should cause layout thrash: batch DOM reads (`getBoundingClientRect`) before writes, same as the ghost-cursor positioning already does in the prototype.