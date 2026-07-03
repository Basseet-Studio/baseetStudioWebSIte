# Baseet Studio — clouds site environment

This document describes how the Vanta CLOUDS background actually runs in **baseetStudioWebSIte** today. Use it in Toolcraft so customizations match production — the upstream Vanta defaults and the older `docs/refrences/clouds/` folder are **not** 1:1 with the live site.

Last synced from site sources: **2026-07-03**

---

## What this Toolcraft export contains

| File | Role |
|------|------|
| `vanta.clouds.js` | Shader source + **site-tuned** `defaultOptions` (scale 2, day-anchor colors) |
| `vanta.clouds.min.js` | Production UMD bundle (same as `/vendor/vanta.clouds.min.js`, defaults patched) |
| `vanta-init.reference.js` | Plain-JS mirror of `src/components/background/vanta-init.ts` |
| `site-shell.css` | `#vanta-bg` layout + theme tokens that affect cloud readability |
| `preview.html` | Self-contained local preview — open in a browser to validate changes |
| `site-environment.md` | This file |

Site sources **not** copied here (read them when integrating back):

- `src/components/background/VantaBg.astro` — lazy load + mobile gate
- `src/components/background/vanta-init.ts` — TypeScript init (authoritative)
- `src/lib/theme.ts` — UI day/night + sky luminance
- `public/theme-boot.js` — inline theme before paint
- `src/styles/global.css` — full token set

---

## Architecture overview

```text
<head>
  theme-boot.js          → sets data-theme before first paint (localStorage or sky luminance)
  (lazy) three.min.js    → window.THREE
  (lazy) vanta.clouds.min.js → window.VANTA.CLOUDS
<body>
  #vanta-bg (fixed, 200vh, z-index 0, transition:persist)
    └── <canvas>         → WebGL clouds
  <main z-index 1>       → page content, glass cards, app bar
```

Clouds are **never** the top layer. All interactive UI sits above `z-index: 0`.

---

## DOM structure (`VantaBg.astro`)

```html
<div id="vanta-bg" transition:persist transition:name="vanta-bg" aria-hidden="true">
  <div id="vanta-cloud-fog"></div>   <!-- reserved, display:none -->
  <div id="vanta-clear-sky"></div>   <!-- reserved, display:none -->
  <div id="vanta-fallback"></div>    <!-- gradient fallback -->
</div>
```

### Critical CSS (also in `site-shell.css`)

- `#vanta-bg`: `position: fixed`, `width: 100%`, **`height: 200vh`**, `z-index: 0`, `pointer-events: none`
- Canvas fills the 200vh container (`width/height: 100% !important`)
- `#vanta-fallback`: `linear-gradient(180deg, var(--bg-page), var(--card-bg))` — shown when WebGL is skipped

The **200vh height** is intentional: scroll logic translates the whole container upward so the viewport travels through the cloud volume.

---

## VANTA.CLOUDS init options (production)

From `vanta-init.ts` — these differ from stock Vanta:

```js
VANTA.CLOUDS({
  el: document.getElementById('vanta-bg'),
  skyColor: rgbToHex(/* hour-interpolated */),
  cloudColor: rgbToHex(/* hour-interpolated */),
  cloudShadowColor: rgbToHex(/* hour-interpolated */),
  speed: 1.0,
  scale: 2,        // stock default is 3
  mouseEase: true,
})
```

Stock Vanta also exposes `sunColor`, `sunGlareColor`, `sunlightColor` — the site leaves those at shader defaults.

### Day-anchor colors (hour 14 — used by theme toggle “day”)

These are baked into `vanta.clouds.js` / `.min.js` defaults for Toolcraft:

| Token | Hex | Decimal (min bundle) |
|-------|-----|----------------------|
| skyColor | `#78acd7` | 7906519 |
| cloudColor | `#f1e5eb` | 15881259 |
| cloudShadowColor | `#4b60af` | 4939951 |

Night toggle uses hour **0** anchor: sky `#0a1227`, cloud `#566887`, shadow `#060c1c`.

---

## Time-of-day color system

The site does **not** use Vanta’s static colors. It interpolates three channels (sky, cloud, cloudShadow) across a 24h clock.

### Anchor hours (locked palette stops)

| Anchor | Hour | Purpose |
|--------|------|---------|
| Night | 0 | Deepest night / theme toggle “night” |
| Bright shift | 4.5 | Pre-dawn warmth |
| Day | 14 | Afternoon baseline / theme toggle “day” |
| Dark shift | 20 | Late dusk |

Between anchors, colors lerp through a legacy 4-segment day curve (night → dawn → CSS day tokens → dusk → night).

### CSS tokens read at init (`:root` / `[data-theme="night"]`)

Day (`global.css`):

```css
--vanta-sky: #87ceeb;
--vanta-cloud: #ffffff;
--vanta-cloud-shadow: #496bc1;
```

Night:

```css
--vanta-sky: #1a2540;
--vanta-cloud: #6a7894;
--vanta-cloud-shadow: #0a0e18;
```

`vanta-init.ts` reads `--vanta-*` once when building the “defaultTheme” anchor. Manual theme toggle uses `setVantaTheme('day'|'night')` → hours 14 / 0, **not** the CSS vars directly.

---

## Scroll journey (“cloud descent”)

On scroll, the **container** moves, not the shader camera:

```js
const progress = scrollY / (scrollHeight - innerHeight)  // clamped 0..1
el.style.transform = `translate3d(0, ${-progress * 100}vh, 0)`
```

- At top: `translateY(0)` — upper half of 200vh canvas visible
- At bottom: `translateY(-100vh)` — lower half fills viewport
- Canvas `transition` forced to `none` to avoid jank

Re-applied on `astro:after-swap` after View Transitions navigation (content height changes).

---

## Script loading & performance gates

### Lazy load chain (`VantaBg.astro`)

1. Wait for `window.load`, then `requestIdleCallback` (or 200ms timeout)
2. Skip entirely on **mobile** (UA regex **or** `innerWidth < 600`) → show `#vanta-fallback`
3. Inject `/vendor/three.min.js`, then `/vendor/vanta.clouds.min.js`
4. Dynamic import `vanta-init.ts` → `initVanta()`
5. If `data-theme="night"` already on `<html>`, call `setVantaTheme('night')`

Session flag: `data-baseet-clouds-booted` on `<html>` prevents double boot.

### Reduced motion

If `prefers-reduced-motion: reduce` → no WebGL, fallback gradient only.

### Visibility

Tab hidden → `vantaEffect.pause()`; visible again → `resume()`.

### View Transitions (Astro)

- `#vanta-bg` has `transition:persist` — **WebGL canvas survives route changes**
- Window listeners bound once per session (`listenersAttached` flag)
- `astro:after-swap` → `resize()` + scroll transform refresh

---

## UI theme integration (separate from cloud colors)

Two related but distinct systems:

### 1. `data-theme="day"|"night"` (UI tokens)

- Set early by `public/theme-boot.js` (inline in `Base.astro` `<head>`)
- User override stored in `localStorage` key `baseet-theme`
- If no saved preference: derived from **sky luminance** at current hour (`src/lib/theme.ts`, threshold `0.42`)
- Theme switcher (`ThemeSwitcher.astro`) toggles UI + calls `setVantaTheme()`

### 2. Cloud palette (WebGL)

- Initialized from **wall-clock hour** at first paint
- Updated on manual theme toggle via `setVantaTheme` (snaps to hour 14 or 0)
- **Not** continuously animated through the day after init

When experimenting in Toolcraft: changing UI `--bg[f]-window-*` tokens affects how clouds *read* behind glass panels; changing Vanta options affects the sky itself.

---

## Z-index & “Open Sky” UI rule

From `global.css` / design intent:

| Layer | z-index | Notes |
|-------|---------|-------|
| `#vanta-bg` | 0 | Fixed, pointer-events none |
| `main`, app content | 1 | All pages |
| Project night wash | 1 | `::before` on `.project-wrapper` in night mode |
| App bar, modals | higher | Glass surfaces use `--surface-*` + backdrop blur |

**Card-as-Window** surfaces use `--card-window-bg` at **72%** opacity (day) / **62%** (night) so clouds remain visible. Do not raise opacity in Toolcraft mockups unless you intend to hide the background.

---

## Mobile & fallback behavior

| Condition | Behavior |
|-----------|----------|
| Mobile UA or width &lt; 600px | No Three/Vanta scripts; `#vanta-fallback` gradient |
| WebGL error / missing VANTA | `#vanta-fallback` |
| `prefers-reduced-motion` | `#vanta-fallback` |
| Print | `.vanta-canvas` hidden (see `animations.css`) |

---

## Differences vs `docs/refrences/clouds/` (upstream snapshot)

| Topic | Upstream reference | Live site / this export |
|-------|-------------------|-------------------------|
| `scale` | 3 | **2** |
| Default colors | Vanta stock blues | **Hour-14 day anchor** |
| Container height | 100vh typical | **200vh** + scroll translate |
| Theme | Static | **Hour interpolation + manual toggle** |
| Load timing | Immediate | **Idle after load** |
| Mobile | Often enabled | **Disabled** |
| Persistence | Re-init per page | **`transition:persist` canvas** |
| Extra DOM | None | `#vanta-cloud-fog`, `#vanta-clear-sky` (hidden placeholders) |

The GLSL shader in `vanta.clouds.js` is **unchanged** from upstream — all site customization is init, CSS, and integration.

---

## Toolcraft workflow

1. Open `preview.html` locally (needs network once for three.js CDN, or swap to a local `three.min.js`).
2. Edit shader/options in `vanta.clouds.js`. Rebuild `.min.js` only if you have the full Vanta `src/` tree; otherwise patch defaults in `.min.js` or pass options from `vanta-init.reference.js`.
3. Validate scroll journey + day/night toggle in the preview.
4. Port changes back to:
   - `src/components/background/vanta-init.ts` (integration logic)
   - `public/vendor/vanta.clouds.min.js` (if shader changed)
   - `src/styles/global.css` (if `--vanta-*` tokens change)

### Rebuild note

`webpack.config.js` / `webpack.build.js` expect a full Vanta repo `src/` directory. This folder only ships the **CLOUDS effect source** + prebuilt min bundle. For shader edits without the full repo, copy the updated `vanta.clouds.js` fragment into the upstream Vanta build, or hand-patch the minified `defaultOptions` blob.

---

## Quick reference — production file map

```text
src/components/background/VantaBg.astro    DOM + lazy script loader
src/components/background/vanta-init.ts    Init, scroll, theme, lifecycle
src/layouts/Base.astro                     VantaBg in body, theme-boot in head
src/lib/theme.ts                           UI theme + sky luminance
public/theme-boot.js                       Inline theme bootstrap
public/vendor/three.min.js                 Three.js r134 (site copy)
public/vendor/vanta.clouds.min.js          Effect bundle
src/styles/global.css                      --vanta-* + card-window tokens
src/components/shared/ThemeSwitcher.astro  Manual day/night + setVantaTheme
```

---

## Anchor palette snapshot (computed)

For Toolcraft color pickers — RGB from `getThemeForHour`:

| Anchor | Hour | Sky | Cloud | Shadow |
|--------|------|-----|-------|--------|
| Night | 0 | `#0a1227` | `#566887` | `#060c1c` |
| Bright | 4.5 | `#b9805d` | `#d5bbb1` | `#825c6c` |
| Day | 14 | `#78acd7` | `#f1e5eb` | `#4b60af` |
| Dark | 20 | `#3f4c82` | `#ab99ae` | `#363565` |

These values come from the same interpolation code in `vanta-init.reference.js`.
