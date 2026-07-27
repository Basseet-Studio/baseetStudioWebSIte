# React Bits → Baseet project backgrounds

How to port a [React Bits](https://reactbits.dev) (or similar) WebGL / canvas background into this Astro site **per project**, without remounting on every navigation.

Reference implementation: **Geeb LineWaves**

| Piece | Path |
|-------|------|
| Source snippet | [`docs/refrences/waves-orange.md`](./waves-orange.md) |
| Runtime (ogl + knobs) | [`src/lib/effects/geeb-line-waves.ts`](../../src/lib/effects/geeb-line-waves.ts) |
| Astro host | [`src/components/project/geeb/GeebLineWaves.astro`](../../src/components/project/geeb/GeebLineWaves.astro) |
| Mount gate | [`src/layouts/Project.astro`](../../src/layouts/Project.astro) — `{slug === 'geeb' && <GeebLineWaves />}` |

Use this doc the next time you add a React Bits effect to MoneyBox, Numu, Matrix, etc.

---

## Goals (what “done” looks like)

1. **Loads once** — WebGL boots on first enter of that project, not on every subpage click.
2. **Pages don’t rerender the effect** — Geeb→Geeb (features, pro, FAQ…) keeps the same canvas; only knobs lerp.
3. **Fades away leaving the project** — opacity out + GL teardown when the next route is not that project.
4. **Fades as you scroll down** — full strength at the top; more transparent as page scroll progress rises.
5. **Above the clouds, under content** — fixed layer, `pointer-events: none`, z-index under `.project-wrapper` content.
6. **Project colors only** — no generic React Bits orange unless that’s the brand.
7. **EDIT ME markers** — global knobs + per-page presets at the top of the runtime file.

---

## Architecture (iron this in first)

```text
#cloudscape-bg          fixed z:1   (persists site-wide)
#your-effect-host       fixed z:1   (persists within THIS project)
main / project content  z:2         (fades via Astro view transitions)
```

This site has **no React**. Port React Bits components to **vanilla TypeScript + the library they need** (`ogl`, Three.js, etc.).

### Why remounts felt bad (and how we fixed it)

| Bad pattern | What happens | Fix |
|-------------|--------------|-----|
| `destroy()` on every `astro:before-swap` | WebGL torn down on every Geeb→Geeb click; flash + “full rerender” feel | Only destroy when the **next** page has **no** matching host |
| Re-`init()` on every `astro:page-load` | New canvas / context every subpage | `ensureInit()` — no-op if already running |
| Effect inside fading `<main>` without persist | Canvas dies with content swap | `transition:persist` + `transition:name` on the host (same idea as CloudscapeBg) |

Astro docs (ClientRouter): elements with `transition:persist` are **kept** across navigations when the next page has a matching persist id/name. Lifecycle:

- `astro:before-swap` — inspect `event.newDocument` for the host
- `astro:page-load` — sync route knobs (lerp), do **not** remount if active

---

## Recipe: add an effect for another project

### 1. Drop the React Bits source in `docs/refrences/`

Keep the original snippet (e.g. `waves-orange.md`) so you can compare props / shaders later.

### 2. Install the dependency

```bash
npm install ogl   # or whatever the Bits variant lists
```

### 3. Port React → vanilla TS

Create `src/lib/effects/<project>-<effect>.ts`:

- Copy shaders / uniforms almost 1:1.
- Replace `useEffect` / `useRef` with `ensureInit(container)` / `destroy()` / `syncToPath(pathname)`.
- Put an **EDIT ME** block at the top for globals (speed, colors, fade ms).
- Put a **PAGE_PRESETS** map for per-subpage look (rotation, warp, brightness…).
- Lerp live uniforms toward targets each frame (`KNOB_LERP`) so Geeb→Geeb feels smooth.
- Mouse: listen on `window` (`pointermove`), keep host at `pointer-events: none` so UI stays clickable.
- Skip on mobile / `prefers-reduced-motion` (match CloudscapeBg).

### 4. Astro host component

Create `src/components/project/<project>/<Name>Bg.astro`:

```astro
<div
  id="project-effect"
  class="project-effect"
  transition:persist="project-effect"
  transition:name="project-effect"
  aria-hidden="true"
  role="presentation"
></div>

<script>
  // ensureInit once · syncToPath on page-load · destroy only when leaving project
</script>
```

CSS essentials:

- `position: fixed; inset: 0; z-index: 1; pointer-events: none`
- Beat `.project-wrapper > * { position: relative; z-index: 2 }` with a more specific selector
- Optional top mask so the effect reads as a **hero** wash, not a full-screen smear
- Opacity via CSS var for scroll fade (`--*-scroll-mul`)

### 5. Mount only for that project

In `Project.astro` (or a project-specific layout):

```astro
{slug === 'your-slug' && <YourEffectBg />}
```

Do **not** put it in `Base.astro` unless every page should get it.

### 6. Lifecycle checklist (copy this)

```ts
// page-load
if (isThisProject(pathname) && host()) {
  ensureInit(host)      // boot once
  syncToPath(pathname)  // lerp knobs for this subpage
  show()                // CSS .is-visible
} else if (isActive()) {
  hide()
  destroyAfterFade()
}

// before-swap
if (newDocument.hasMatchingHost) {
  return // stay on project — keep WebGL
}
hide()
destroy() // left the project
```

### 7. Scroll fade (straightforward)

Use **document scroll progress** (same idea as cloudscape `progress=%`):

```ts
progress = scrollY / (scrollHeight - innerHeight)  // 0 at top → 1 at bottom
// map progress through START → END, smoothstep → scrollMul (1 → 0)
// set host style --scroll-mul and multiply shader brightness by scrollMul
```

Knobs at top of the runtime:

- `SCROLL_FADE_START` — still “at the top”
- `SCROLL_FADE_END` — mostly gone
- Per-route `scrollFadeEnd` for denser pages (e.g. legal docs)

---

## Stacking & a11y

- Clouds stay under; content stays clickable.
- `aria-hidden="true"` on the host.
- No WebGL when `prefers-reduced-motion: reduce` or narrow / mobile UA (same gate as clouds).
- Prefer `transparent: true` on ogl `Program` so alpha blends over the sky.

---

## Common pitfalls

1. **Calling `resize()` before `program` exists** → TDZ `ReferenceError`. Create the program first, then resize.
2. **Delayed `destroy()` after `before-swap` when staying on-project** → kills the *next* page’s instance. Never schedule destroy across a Geeb→Geeb swap.
3. **Listening for mouse on the canvas with `pointer-events: none`** → no events. Use `window`.
4. **Leaving a CSS grid / wash that competed with the new effect** → remove old decorative grids (Geeb’s `.geeb-hero__grid`).
5. **Committing `dist/`** — don’t; source + build locally / CI.

---

## Checklist for the next project

- [ ] Reference md in `docs/refrences/`
- [ ] Dependency installed
- [ ] `src/lib/effects/<slug>-….ts` with EDIT ME + PAGE_PRESETS + lerp + scroll fade
- [ ] Astro host with `transition:persist` + `transition:name`
- [ ] Mount gated by `slug === '…'`
- [ ] before-swap only destroys when leaving the project
- [ ] Brand colors, not Bits defaults
- [ ] Mobile / reduced-motion skip
- [ ] Smoke: enter project → subpages (no remount) → leave (fade out) → scroll (fade down)

---

## Geeb LineWaves — quick edit map

All edits live in [`src/lib/effects/geeb-line-waves.ts`](../../src/lib/effects/geeb-line-waves.ts).

**Globals** (top `EDIT ME` block): `SPEED`, `WARP_INTENSITY`, `ROTATION_DEG`, `BRIGHTNESS`, `COLOR_1/2/3`, `FADE_IN_MS`, `SCROLL_FADE_START` / `SCROLL_FADE_END`, …

**Per page** (`PAGE_PRESETS`): keys are the path after `/projects/geeb/`

| Key | URL |
|-----|-----|
| `''` | `/projects/geeb/` |
| `features` | `/projects/geeb/features/` |
| `download` | `/projects/geeb/download/` |
| `pro` | `/projects/geeb/pro/` |
| `faq` | `/projects/geeb/faq/` |
| `terms` / `privacy` | hubs |
| `terms/customers`, `terms/vendors`, … | legal docs |

Each preset: `rotationDeg`, `warpIntensity`, `brightness`, `scrollFade`, optional `scrollFadeEnd`.
