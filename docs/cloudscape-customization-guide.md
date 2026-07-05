# Cloudscape Customization Guide

How to configure the volumetric cloud background, scroll-driven camera, 3D objects, and sky/lighting on each page of the Baseet Studio site.

This guide is for engineers editing **code only**. The live site has no runtime sliders or editor UI. Use the separate `tool-craft/clouds-playground` project to preview values, then paste tuned numbers into scene config files here.

---

## Architecture

```text
Base.astro
  ├─ resolveSceneConfig(pathname)     → SceneConfig for this route
  ├─ data-scene-renderer="cloudscape"
  ├─ data-scene-config={JSON}
  └─ CloudscapeBg.astro
        └─ cloudscape-boot.ts
              └─ cloudscape-runtime.ts
                    ├─ camera-controller.ts   (scroll anchors → camera/clouds/lighting)
                    ├─ scroll-driver.ts       (window scroll → progress 0–1)
                    ├─ object-registry.ts     (GLB load + behind/middle/in_front depth)
                    ├─ page-transition-bridge.ts (Astro view transitions)
                    ├─ sky-theme.ts           (time-of-day + OS theme + manual toggle)
                    └─ cloud-shader.ts        (Toolcraft/Vanta raymarch shader)
```

**Data flow on scroll:**

1. `scroll-driver` computes `progress` (0–1) from page scroll.
2. `camera-controller.evaluateAtProgress(progress)` interpolates between `scrollAnchors`.
3. `cloudscape-runtime` applies camera, clouds, lighting, and object visibility each frame.
4. `sky-theme` updates base sky colors on a timer and when OS dark/light mode changes.

---

## Adding a scene config for a new page

### 1. Create a scene file

Add `src/content/data/scenes/<page-id>.ts`:

```typescript
import type { SceneConfig } from '../../../lib/scene/types'
import { editorDefaultCamera, editorDefaultClouds, editorDefaultLighting } from './editor-default'

export const myPageSceneConfig: SceneConfig = {
  schemaVersion: 1,
  pageId: 'my-page',
  renderer: 'cloudscape',       // required for WebGL clouds
  durationSeconds: 10,
  scrollMode: 'global',
  entryCamera: { ...editorDefaultCamera },
  exitCamera: { ...editorDefaultCamera },
  clouds: { ...editorDefaultClouds },
  lighting: { ...editorDefaultLighting },
  scrollAnchors: [
    {
      id: 'hero',
      atScrollProgress: 0,
      camera: { ...editorDefaultCamera },
    },
  ],
  objects: [],
}
```

### 2. Register the route

Edit `src/lib/scene/resolve-scene-config.ts`:

```typescript
import { myPageSceneConfig } from '../../content/data/scenes/my-page'

const routeMap: Record<string, SceneConfig> = {
  '/': homeSceneConfig,
  '/my-page': myPageSceneConfig,
  // ...
}
```

`Base.astro` automatically injects the resolved config into `<body data-scene-config="...">`.

---

## SceneConfig field reference

Defined in `src/lib/scene/types.ts`.

| Field | Type | Purpose |
|-------|------|---------|
| `pageId` | string | Identifier for debug logs |
| `renderer` | `'cloudscape' \| 'vanta' \| 'none'` | Use `'cloudscape'` for the new renderer |
| `durationSeconds` | number | Legacy timeline duration (scroll uses `atScrollProgress` directly) |
| `scrollMode` | `'global' \| 'section-weighted'` | `'global'` = full-page scroll |
| `entryCamera` | `CameraPose` | Camera on first paint / page entry |
| `exitCamera` | `CameraPose` | Camera when leaving the page |
| `clouds` | `CloudSettings` | Page-level cloud defaults |
| `lighting` | `LightingSettings` | Page-level sun/fog defaults |
| `scrollAnchors` | `ScrollAnchor[]` | Key camera/cloud/light/object beats along scroll |
| `objects` | `SceneObject[]` | GLB models with depth layer |
| `transition` | object | Entry/exit camera lerp on Astro navigation |

### CameraPose

```typescript
{
  position: [x, y, z],   // camera world position
  target: [x, y, z],     // look-at point
  fov: 50,               // field of view in degrees
}
```

### CloudSettings

```typescript
{
  skyColor?: string,          // hex, e.g. '#6FA8DC'
  cloudColor?: string,        // hex
  density?: number,           // 0.1–1.4 (Toolcraft default 0.6)
  speed?: number,             // drift speed multiplier
  noise?: number,             // 0–1 surface detail
  verticalSpread?: number,    // 0.1–1 cloud band height
  syncTheme?: boolean,        // true = follow time-of-day sky colors (default)
}
```

`cloudShadowColor` exists in types but the shader derives shadows from `cloudColor` internally.

### LightingSettings

```typescript
{
  azimuth?: number,      // 0–360°, sun compass direction
  elevation?: number,    // 5–85°, sun height above horizon
  intensity?: number,    // 0–2, sun brightness on clouds + GLB lights
  fogDensity?: number,   // 0–1, distance haze
  color?: string,        // hex sunlight tint (uLightColor in shader)
}
```

### ScrollAnchor

```typescript
{
  id: 'home-team',
  label: 'Team section',
  atScrollProgress: 0.85,          // 0 = top, 1 = bottom of page
  easing: 'easeInOutCubic',          // optional between this and next anchor
  camera: { position: [...], target: [...], fov: 40 },
  clouds: { density: 0.15 },         // optional override at this beat
  lighting: { fogDensity: 0.42 },    // optional override
  objects: {
    show: ['team-skyline'],
    hide: ['other-object'],
    animateIn: ['team-skyline'],
  },
}
```

### SceneObject

```typescript
{
  id: 'team-skyline',
  url: '/models/home/team-skyline.glb',
  scope: 'page',                    // 'page' = unload on navigation; 'persistent' = keep
  cloudDepth: 'middle',             // 'behind' | 'middle' | 'in_front'
  transform: {
    position: [-13.5, 0.8, 0],
    rotationY: 0,
    scale: 1.2,
  },
  normalize: true,                  // auto-fit GLB to ~2 unit bounding box
  bindAnchor: 'home-team',
  loadAt: {
    type: 'anchor',
    anchorId: 'home-team',
    when: 'enter',
    preloadMargin: 0.06,            // start loading 6% scroll before anchor
  },
}
```

Place GLB files under `public/models/...`.

---

## Worked example: home page anchor

From `src/content/data/scenes/home.ts`:

```typescript
{
  id: 'home-team',
  atScrollProgress: 0.85,
  easing: 'easeOutQuad',
  camera: {
    position: [0, 0.7, 4],
    target: [0, 0.15, 0],
    fov: 40,
  },
  lighting: { fogDensity: 0.42 },
  objects: {
    show: ['team-skyline'],
    animateIn: ['team-skyline'],
  },
}
```

At 85% scroll the camera drops low, fog increases slightly, and the skyline GLB (configured as `cloudDepth: 'middle'`) loads and appears **inside** the cloud layer.

---

## Camera points and scroll interpolation

- **`entryCamera`** — used at scroll progress ≤ first anchor, and as the page entry pose after navigation.
- **`exitCamera`** — stored on navigation away; next page can lerp from it via `transition.entry.from: 'exit-camera'`.
- **`scrollAnchors`** — sorted by `atScrollProgress`. Between two anchors, `camera-controller` lerps position, target, and FOV using the **next** anchor's `easing` (default `easeInOutCubic`).

Easing options: `linear`, `easeInOutCubic`, `easeOutQuad`, `easeInQuad`.

**Tip:** Match `atScrollProgress` to real section positions. Add `data-scroll-anchor="home-team"` on the corresponding HTML section for debug highlighting (`?sceneDebug=1`).

---

## Clouds and lighting: merge precedence

When scroll progress is evaluated, values are merged in this order (later wins):

1. **Page defaults** — `scene.clouds` / `scene.lighting` from the scene config file
2. **Sky theme** — `sky-theme.ts` overwrites sky/cloud colors (and may set light `color`) when `clouds.syncTheme !== false`
3. **Scroll anchor overrides** — `scrollAnchors[].clouds` / `.lighting` at the active or interpolating anchor

Example: home page sets `density: 0.1` globally; anchor `home-team` can add `lighting: { fogDensity: 0.42 }` without touching density.

### Disabling automatic sky colors on a page

```typescript
clouds: {
  density: 0.1,
  skyColor: '#146BC2',
  cloudColor: '#FFFFFF',
  syncTheme: false,   // keeps your hardcoded colors; ignores time-of-day
}
```

---

## Time-of-day, manual theme, and OS dark mode

Handled by `src/lib/scene/sky-theme.ts` + `src/lib/theme.ts`.

| Input | Effect |
|-------|--------|
| Real clock hour | Continuous sky/cloud color interpolation (dawn → day → dusk → night) |
| Theme switcher (localStorage `baseet-theme`) | Pins sky to day or night anchor hour; sets `data-theme` on `<html>` |
| `prefers-color-scheme: dark` | Nudges UI night threshold ±0.05 luminance (sky color still time-driven) |
| `clouds.syncTheme: false` | Page opts out entirely |

Sky theme re-syncs every 60 seconds and immediately on OS color-scheme change.

---

## Tuning values from the Toolcraft editor

1. Open `tool-craft/clouds-playground` locally.
2. Adjust clouds, lighting, camera with the editor sliders.
3. **Export Settings** → JSON file.
4. Copy relevant `values` into your scene config TypeScript (see `docs/cloudscape-editor-settings.json` for a snapshot).

**Mapping from Toolcraft export → site config:**

| Toolcraft key | Site field |
|---------------|------------|
| `camera.position.x/y/z` | `camera.position[0/1/2]` |
| `camera.target.x/y/z` | `camera.target[0/1/2]` |
| `camera.fov` | `camera.fov` |
| `clouds.density` | `clouds.density` |
| `clouds.speed` | `clouds.speed` |
| `clouds.noise` | `clouds.noise` |
| `clouds.verticalSpread` | `clouds.verticalSpread` |
| `clouds.skyColor.hex` | `clouds.skyColor` |
| `clouds.cloudColor.hex` | `clouds.cloudColor` |
| `lighting.azimuth` | `lighting.azimuth` |
| `lighting.elevation` | `lighting.elevation` |
| `lighting.intensity` | `lighting.intensity` |
| `lighting.fogDensity` | `lighting.fogDensity` |
| `scroll.progress` 0–100 | `atScrollProgress` 0–1 (divide by 100) |

Authoritative baked defaults live in `src/content/data/scenes/editor-default.ts` (sourced from `docs/cloudscape-editor-settings.json`).

---

## 3D object depth layers

The renderer uses four passes (same as Toolcraft playground):

1. **behind** — GLB rendered to offscreen buffer; clouds composite on top
2. **middle** — GLB rendered with depth; clouds raymarch with depth rejection (objects appear inside clouds)
3. **cloud raymarch** — fullscreen shader
4. **in_front** — GLB drawn on top of clouds

Set `cloudDepth` per object in the scene config. Use `objects.show` / `objects.hide` on anchors to control visibility by scroll position.

---

## What NOT to port from Toolcraft

| Toolcraft feature | Site |
|-------------------|------|
| Controls panel / sliders | Never on production site |
| Layers panel UI | Use static `objects[]` in code |
| Canvas zoom / radar | Never |
| PNG / video export | Build-time only, optional |
| Timeline play button | Scroll is the transport |
| DOM overlay headline/cards | Implement as real Astro/HTML in `<main>` |

---

## Debugging

- **Dev mode** or `?sceneDebug=1` — shows bottom-left panel (scroll %, anchor, camera, density, objects).
- **`localStorage.setItem('baseet:scene:debug', '1')`** — force debug in production builds.
- **`window.__baseetScene`** — latest debug snapshot object.
- Console logs prefixed `[cloudscape]` when debug is enabled.

---

## Fallback behavior

`CloudscapeBg.astro` shows a CSS gradient fallback when:

- Mobile viewport (`< 600px`) or mobile user-agent
- `prefers-reduced-motion: reduce`
- `data-scene-renderer` is not `cloudscape`
- WebGL boot fails

---

## File map

```text
src/
├── components/background/CloudscapeBg.astro
├── content/data/scenes/
│   ├── default.ts          # fallback scene
│   ├── home.ts             # home scroll journey + team GLB
│   └── editor-default.ts   # Toolcraft export defaults
├── lib/
│   ├── theme.ts            # hour → RGB anchors (shared with theme-boot.js)
│   └── scene/
│       ├── types.ts
│       ├── resolve-scene-config.ts
│       ├── camera-controller.ts
│       ├── scroll-driver.ts
│       ├── object-registry.ts
│       ├── page-transition-bridge.ts
│       ├── cloudscape-runtime.ts
│       ├── cloudscape-boot.ts
│       ├── cloud-shader.ts
│       └── sky-theme.ts
public/models/              # GLB assets
docs/cloudscape-editor-settings.json  # reference export (not read at runtime)
```

---

## Quick checklist for a new page

- [ ] Create `src/content/data/scenes/<id>.ts` with `renderer: 'cloudscape'`
- [ ] Register route in `resolve-scene-config.ts`
- [ ] Set `entryCamera` / `exitCamera`
- [ ] Add `scrollAnchors` aligned to page sections
- [ ] Optional: `objects[]` + GLBs in `public/models/`
- [ ] Optional: per-anchor `clouds` / `lighting` overrides
- [ ] Test desktop with `?sceneDebug=1`
- [ ] Verify mobile shows gradient fallback (expected)
