# Cloudscape / skydome debug bundle (flat clouds investigation)

Compiled for Copilot-style debugging: git suspects, file map, uniform wiring, render order, anchors, defaults, and hero layering.

---

## 1. Git history — what likely made clouds look “flat”

There is **no dedicated “flat clouds” commit message**. These are the commits that materially changed how sky + volumetric clouds render (newest / highest impact first).

### Primary suspect: `b67de74f` — “better copy typ[e]” (2026-09-30)

**Files:** `cloud-shader.ts`, `cloudscape-runtime.ts`, new `sky-dome.ts`, `sky-dome-blend.ts`, `sky-theme.ts`

**What changed (why it can read as flat):**

1. **Procedural sky mostly replaced by equirect photos** when `uSkyMix = 1` (default in runtime). Raymarch now composites against **photo sky** (`texCol`) instead of gradient `uSkyColor`.
2. **`integrate()`** no longer mixes high-band samples toward `uSkyColor`; it mixes toward **`bgcol`** (already the photo). With high `skyMix`, volumetric depth can collapse visually into the backdrop.
3. **`uFocal`** tied to camera FOV (`bgFov = clamp(camFov * 1.5, 55, 100)`). Wrong FOV → panorama feels like a **flat pasted backdrop**.
4. **Camera target bias** in shader: `ta = uCameraTarget * uWorldScale + vec3(0.0, 2.5, 0.0)` (was `+ vec3(0.0, -1.0, 0.0)`).
5. **Skydome lighting** lerps page sun/colors toward analyzed photo (`domeMix` up to 0.85 on sun dir), which can flatten contrast.
6. **Default `uSkyMix: 1`** in material uniforms — texture sky fully on from frame one.

**Inspect locally:**

```bash
git show b67de74f -- src/lib/scene/cloud-shader.ts src/lib/scene/cloudscape-runtime.ts
```

### Secondary: `c91a440a` — band-density cloud rewrite (2026-08-28)

Replaced single `fbm()` slab with **two altitude bands** (`bandDensity`, `coverageMask`, `uSeed`, `uLowClumpScale`, `uHighClumpScale`, `uApart`). Can change perceived volume (gaps vs slab) but is not specifically “flat backdrop” behavior.

```bash
git show c91a440a -- src/lib/scene/cloud-shader.ts
```

### Tertiary: `2e4ad4cc` — device tier / `uQuality` (2026-08-15)

Raymarch step counts and octaves scale with `uQuality` (low tier = fewer steps). Can look softer/flatter on mobile, not a layering bug.

```bash
git show 2e4ad4cc -- src/lib/scene/cloud-shader.ts src/lib/scene/device-tier.ts
```

### Earlier pipeline work

| Commit     | Message              | Relevance                          |
|-----------|----------------------|------------------------------------|
| `b9388ab7` | chanegs to clouds    | Runtime compositing, scroll, types |
| `cb219f26` | clouds time of day   | `sky-theme.ts`                     |
| `f1a940f7` | cloud playground     | Scene config merge, playground     |

**Current `cloud-shader.ts` HEAD:** last touched by `b67de74f`.

**Working tree:** no uncommitted diff on `cloud-shader.ts` / `cloudscape-runtime.ts` at time this doc was generated.

---

## 2. Architecture note (no sphere mesh)

Clouds and skydome are **one fullscreen quad** in a separate `backgroundScene`, not a Three.js `SphereGeometry`.

| Piece            | Location                         | Mechanism                                      |
|------------------|-----------------------------------|------------------------------------------------|
| Geometry         | `cloudscape-runtime.ts`           | `PlaneGeometry(2,2)` + `OrthographicCamera`   |
| Volumetric clouds| `cloud-shader.ts`                 | Raymarch in `raymarch()` / `cloudDensity()`   |
| Skydome          | Same fragment shader              | `sampleEquirect()` / `sampleSkySlot()` on CPU-loaded textures |
| GLB objects      | `mainScene`                       | Separate passes into RTs for depth composite   |

---

## 3. Skydome — `src/lib/scene/sky-dome.ts`

**Role:** Load equirect JPGs, analyze placeholders, drive shader uniforms. **No** `scene.environment` / IBL.

**Manifest:** `SKY_DOME_MANIFEST_URL` → `/images/skyscapes/manifest.json`

**Default settings** (`createSkyDomeController`):

```ts
enabled: true
yawDeg: 0
mix: 1          // → uniforms.uSkyMix
pinId: ''
slotSources: {}
floor: 1        // → uSkyFloor (cloud-sea below horizon)
sunFromSky: true
```

**Texture config** (`configureSkyTexture`):

- `colorSpace = THREE.NoColorSpace`
- `wrapS = RepeatWrapping`, `wrapT = ClampToEdgeWrapping`
- Linear filter, **no mipmaps** (seam / atan issues)

**Loader flow** (`loadTexture`):

1. **Placeholder (lo):** `loadTexture(variant.placeholder, true)` — on load runs `analyzeSkyImage()` (128×64 canvas), logs `skydome analysed …`
2. **Full (hi):** `hiUrlFor(variant)` → `full` on high tier, else `medium ?? full`
3. Until hi ready, hi uniform may point at 1×1 `empty` data texture; `uSkyFullMixA/B` fades 0→1 over `FULL_FADE_SECONDS` (0.4s)

**Per-frame** (`tick(hour, dt)`):

- `blendForHour(variants, hour)` or pinned variant (`pinId`)
- Sets `tSkyALo/Hi`, `tSkyBLo/Hi`, `uSkyBlend` (variant cross-fade `t`)
- `uSkyFullMixA/B` = lo→hi resolution cross-fade
- Disabled or `mix <= 0` → clears blends

**Lighting export** (`getLighting()`): blends analyzed `SkyLightingSample` from placeholders A/B; runtime lerps sun/fog colors when `sunFromSky` + `domeMix > 0`.

**Day/night blending math:** `src/lib/scene/sky-dome-blend.ts` — `blendForHour`, `blendSkyLighting`, `equirectUvToDirection`, `worldDirFromTexDir`.

**Equirect in shader** (`cloud-shader.ts`):

- `equirectUv(d)` — atan/asin mapping
- Yaw rotation on XZ before sample
- Below horizon: horizon row sample + `uSkyHorizon` / `uCloudColor` “sea” when `uSkyFloor > 0`

---

## 4. Cloud shader — `src/lib/scene/cloud-shader.ts`

Ported from tool-craft Vanta-style CLOUDS raymarch + site depth compositing.

### Uniforms → runtime source (`composeFrame` in `cloudscape-runtime.ts`)

| Uniform / control   | Scene / lighting field        | Default in material init | `readNumber` fallback in compose |
|--------------------|-------------------------------|--------------------------|----------------------------------|
| `uDensity`         | `clouds.density`              | 0.6                      | 1                                |
| `uNoise`           | `clouds.noise`                | 0.5                      | 0.5                              |
| `uSpeed`           | `clouds.speed`                | 1                        | 1                                |
| `uVerticalSpread`  | `clouds.verticalSpread`       | 0.5                      | **0.78**                         |
| `uFogDensity`      | `lighting.fogDensity`         | 0.35                     | 0.35                             |
| `uSkyColor`        | `clouds.skyColor`             | `#6fa8dc`                | `#6FA8DC`                        |
| `uCloudColor`      | `clouds.cloudColor`           | `#ffffff`                | `#FFFFFF`                        |
| `uSunDir`          | `lighting.azimuth`, `elevation` | fixed vec initially    | 45°, 35°                         |
| `uLightIntensity`  | `lighting.intensity` (+ dome) | 1                        | 1                                |
| `uLightColor`      | `lighting.color`              | white                    | `#FFFFFF`                        |
| `uSeed`            | `clouds.seed`                 | 0                        | 0                                |
| `uLowClumpScale`   | `clouds.lowClumpScale`        | 0.55                     | 0.55                             |
| `uHighClumpScale`  | `clouds.highClumpScale`       | 1.15                     | 1.15                             |
| `uApart`           | `clouds.apart`                | 1                        | 1                                |
| `uQuality`         | device tier                   | tier preset              | (adaptive)                       |
| `uFocal`           | derived from `camera.fov`     | 1.5                      | `1/tan(bgFov/2)`                 |
| Skydome textures   | `skyDome.tick()`              | empty                    | manifest                         |
| `uSkyMix`          | skydome settings `mix`        | **1**                    | enabled ? mix : 0                |

**Azimuth / elevation → sun:** `sunDirectionFromAngles()` in `cloudscape-runtime.ts`:

```ts
x = sin(azimuth) * cos(elevation)
y = sin(elevation)
z = cos(azimuth) * cos(elevation)
```

**Shadow (playground “Shadow” color):** `cloudShadowColor` exists on `CloudSettings` and in Cloud Playground UI but **is not a shader uniform**. Shader uses `cloudShadowColor = uCloudColor * 0.5` inside `integrate()`. See `docs/cloudscape-customization-guide.md`.

**Density / spread in GLSL:**

- `uDensity` → `coverageMask` edge threshold (`mix(0.88, 0.34, uDensity)`)
- `uVerticalSpread` → low/high band half-heights (`yHalfLow`, `yHalfHigh`)
- `uNoise` scales FBM detail in `detailFbm`
- `uFogDensity` → exponential fog along march distance in `integrate()`

**Raymarch bounds:** samples only while `pos.y` in `[-3, 2]` (cloud slab).

---

## 5. Scene / renderer — `src/lib/scene/cloudscape-runtime.ts`

### Renderer creation

```ts
new THREE.WebGLRenderer({ canvas, antialias, alpha: true, powerPreference })
renderer.setPixelRatio(1)
renderer.setClearColor(0x0b1b2b, 1)  // overwritten each frame to sky color
renderer.autoClear = false
```

**No explicit** `outputColorSpace` / tone mapping calls in this file (Three.js defaults apply).

### Main scene

- `PerspectiveCamera` — scroll-driven pose, near 0.1, far 200
- `FogExp2(0x6fa8dc, 0.021)` — color + density updated each frame: `fogDensity * 0.06`
- Lights: ambient + directional (sun from `uSunDir`)

### Background material

- `depthTest: false`, `depthWrite: false` (always draws as sky layer)

### `composeFrame()` render order (layering)

1. Optional **behind** GLB → `behindTarget` color → `tBackground`, `uHasBackgroundColor`
2. Optional **middle** GLB → `middleTarget` color + **depth** → `tDepth`, `uHasSceneDepth`
3. Update all cloud/sky uniforms; `skyDome.tick(hour, dt)`
4. **`renderer.render(backgroundScene, backgroundCamera)`** — full-screen raymarch (sky + clouds)
5. If **in_front** objects: `clearDepth()` then `render(mainScene, mainCamera)` on default framebuffer

**Flat-cloud layering checks:**

- Background pass is **after** behind RT but **before** in-front mesh — correct for sky behind 3D
- If `uSkyMix` is high, the **photo** dominates `bgcol` in raymarch → clouds blend into photo (flat look)
- `uHasBackgroundColor` mixes shader output with behind GLB color using `cover = skyCloud.a + 0.08`

### Render loop

- `startLoop()` → each frame: `scrollDriver.tick()` then throttled `renderFrame()` (`targetFps` from tier)
- Adaptive `currentRenderScale` steps down/up based on FPS

### Boot

- `bootCloudscapeFromDom()` — `#cloudscape-canvas`, `data-scene-config` on body
- `src/lib/scene/cloudscape-boot.ts` (not expanded here)

---

## 6. Camera anchor — home hero

### HTML scroll marker

`src/components/home/Hero.astro`:

```html
<section class="hero" data-scroll-anchor="home-hero" data-scroll-anchor-progress="0" ...>
```

`.hero { z-index: 1; }` — content above canvas.

### Scene config — `src/content/data/scenes/home.ts`

**Anchor `home-hero`** at `atScrollProgress: 0`:

| Field    | Value |
|----------|-------|
| position | `[-30, 3.5, 28.8]` |
| target   | `[3.5, -4.7, -30]` |
| fov      | **31** |
| source   | `playground:starting-home-hero` |

**Entry camera** = same as `homeStartCamera` (hero shot at scroll 0).

**Other home anchors:**

- `home-features` @ 0.5 — mid camera
- `home-end` @ 1 — end camera + `fogDensity: 0.45`, shows `team-skyline` GLB

**Playground JSON backup:** `src/content/data/scenes/playground/starting-home-hero.json` (same pose).

### Scroll driver — `src/lib/scene/scroll-driver.ts`

- Progress = `scrollY / (scrollHeight - innerHeight)`
- `createScrollDriver({ externalTick: true })` — progress updated from **render loop**, not scroll listener alone
- `baseet:section-progress` custom event for section-weighted mode (home uses `scrollMode: 'global'`)

### Camera evaluation — `src/lib/scene/camera-controller.ts`

- Catmull-Rom between sorted `scrollAnchors`
- Merges per-anchor `clouds` / `lighting` overrides
- `onScrollProgress` → `applyCamera`, `applyClouds`, `applyLighting` unless playground locked

### Editor default camera (not home production pose)

`src/content/data/scenes/editor-default.ts` — `editorDefaultCamera` pos `[12.1, 2.1, 4.7]`, fov **50** (toolcraft export). Home page **overrides** with playground snapshots above.

---

## 7. Cloud Playground defaults

**Source of truth:** `src/content/data/scenes/editor-default.ts`

### Production / customer defaults (`CUSTOMER_MODE = true`)

**Clouds (`editorDefaultClouds` / `playgroundCloudDefaults`):**

| Key              | Value |
|------------------|-------|
| density          | 1     |
| speed            | 1.8   |
| noise            | 1     |
| verticalSpread   | 0.78  |
| syncTheme        | true  |
| seed             | 0     |
| lowClumpScale    | 0.55  |
| highClumpScale   | 1.15  |
| apart            | 1     |

**Lighting (`editorDefaultLighting`):**

| Key        | Value |
|------------|-------|
| azimuth    | 62    |
| elevation  | 59    |
| intensity  | 0     |
| fogDensity | 0.76  |

**UI sliders:** `src/components/shared/CloudPlayground.astro` — uses `playgroundCloudDefaults` for cloud shape sliders; lighting/skydome use inline defaults (e.g. sky hour 14, skyMix 1, intensity 0, fog 0.76).

**Sparse authoring mode:** set `CUSTOMER_MODE = false` → density 0.1, verticalSpread 0.6 (matches old `docs/cloudscape-editor-settings.json` export).

**Dev-only panel:** `import.meta.env.DEV`, persisted with `transition:persist`, z-index ~10010.

---

## 8. Hero HTML/CSS vs canvas layering

### Canvas container — `src/components/background/CloudscapeBg.astro`

```css
#cloudscape-bg {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: transparent;
}
.cloudscape-canvas {
  width: 100% !important;
  height: 100% !important;
  pointer-events: none;
}
```

**No opacity** on canvas wrapper — wash-out is unlikely from CSS unless page-level overlays exist above z-index 1.

### Hero content

- `Hero.astro`: `z-index: 1` on `.hero` — **same stacking level** as `#cloudscape-bg`; DOM order / stacking contexts determine who paints on top (typically main content after background in layout).

### Fallback

- `#cloudscape-fallback` — gradient `var(--bg-page)` → `var(--card-bg)` when WebGL skipped

---

## 9. Page scene resolution

- `src/lib/scene/resolve-scene-config.ts` — `/` → `homeSceneConfig`
- Config injected on `<body data-scene-config="...">` (see layout / boot scripts)

---

## 10. Quick experiments (flat clouds)

1. **Lower skydome mix:** `applySkydome({ mix: 0 })` or playground Sky Mix → 0 — restores procedural `uSkyColor` background in shader.
2. **Compare commits:** checkout parent of `b67de74f` on shader files only.
3. **FOV:** home hero fov 31 → `uFocal` wide; try mis-synced fov in playground to reproduce “pasted backdrop”.
4. **Quality tier:** emulate low tier (`shaderQuality` & step counts) via `device-tier.ts`.
5. **`uSkyFullMixA/B` still 0:** hi-res not loaded — clouds raymarch against lo-res or empty hi slot.

---

## 11. File index

| Topic              | Path |
|--------------------|------|
| Cloud + sky GLSL   | `src/lib/scene/cloud-shader.ts` |
| Runtime / renderer | `src/lib/scene/cloudscape-runtime.ts` |
| Skydome loader     | `src/lib/scene/sky-dome.ts` |
| Hour blend         | `src/lib/scene/sky-dome-blend.ts` |
| Time-of-day colors | `src/lib/scene/sky-theme.ts` |
| Types              | `src/lib/scene/types.ts` |
| Home anchors       | `src/content/data/scenes/home.ts` |
| Defaults           | `src/content/data/scenes/editor-default.ts` |
| Playground UI      | `src/components/shared/CloudPlayground.astro` |
| Canvas mount       | `src/components/background/CloudscapeBg.astro` |
| Hero section       | `src/components/home/Hero.astro` |
| Sky manifest       | `public/images/skyscapes/manifest.json` |
| Toolcraft export   | `docs/cloudscape-editor-settings.json` |
| Tests (dome blend) | `tests/sky-dome.test.ts` |

---

## 12. `b67de74f` shader diff summary (high signal)

**Added uniforms:** `tSkyA/B Lo/Hi`, `uSkyFullMixA/B`, `uSkyBlend`, `uSkyYaw`, `uSkyMix`, `uSkyHorizon`, `uSkyZenith`, `uSkyFloor`, `uFocal`

**`renderSkyClouds`:** `col = mix(procedural, texCol, skyMix)` then raymarch against `col`

**`main`:** target `+2.5` Y bias; `rd` uses `uFocal` not constant `1.5`

**`integrate`:** ambient mixes `uSkyZenith`; high band mixes to `bgcol` not `uSkyColor`

**Runtime:** `createSkyDomeController`, per-frame `skyDome.tick`, dome lighting lerp, `uFocal` from `cam.fov`

---

*Generated for debugging flat volumetric clouds / skydome integration. Re-run `git show` commands above after new commits.*
