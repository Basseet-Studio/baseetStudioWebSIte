# Home page SVG assets

> Source: setup notes for the **ProximityProjects** grid
> (`src/components/home/ProximityProjects.astro` +
> `src/scripts/morph-projects.ts`).
> Covers the two asset slots the grid consumes — icons and morph-target names.

---

## TL;DR

You can drop hand-crafted SVGs in two folders and the grid picks them up. The
build-time auto-generators **skip any file that already exists** (unless you
pass `--force`), so manual assets are preserved.

```sh
public/icons/{regular|bold|fill}/<iconName>.svg   # grid icons
public/projects/names/<slug>.svg                   # morph targets (one path each)
npm run build                                      # generators no-op your files
```

---

## Icons

**Path:** `public/icons/{variant}/<iconName>.svg` where `variant ∈ {regular, bold, fill}`.
The Astro component reads the file at build time and inlines its inner shapes
into `svg.px__icon`.

### Required

- `viewBox="0 0 256 256"` (must match the morph target for 1:1 interpolation)
- Shapes as **direct children** of `<svg>`, no wrapping `<g>` / `<defs>` / `<use>`
- Allowed shape tags: `<path>`, `<line>`, `<rect>`, `<circle>`, `<ellipse>`,
  `<polygon>`, `<polyline>`
- Stroke is forced to `currentColor` by CSS, so set `fill="none"` on strokes
  or use fills you want tinted by the per-tile `--px-color`

### What happens at runtime

1. `MorphSVGPlugin.convertToPath()` rewrites every non-`<path>` shape to a
   `<path>` automatically.
2. If any path has bbox `x ≤ 1, y ≤ 1, w ≥ 254, h ≥ 254` (a full-viewBox
   backdrop), it's permanently set to `opacity: 0` and excluded from the
   leave-tween. Safe to include or omit.
3. The path with the **longest `d` attribute** is chosen as the morph source.
   If you have several paths and want a specific one used, give it the most
   commands/segments.

### Won't work

- Gradients, masks, filters, clip paths (the pipeline only handles stroked
  outlines).
- CSS animations / SMIL inside the SVG.
- Nested `<svg>` or `<symbol>` references.

---

## Names (morph targets)

**Path:** `public/projects/names/<slug>.svg` — one file per project in
`src/content/data/home.json`.

### Required format

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"
     fill="none" stroke="currentColor"
     stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
  <path d="..."/>
</svg>
```

- `viewBox="0 0 256 256"` — **must** match the icon viewBox.
- `stroke="currentColor"` — picks up the tile's `--px-color` tint.
- `stroke-width="14"` — matches the auto-generator default; change here for
  a different visual weight without touching anything else.
- The runtime extracts **only the first `<path d="…">`** via regex
  (`src/scripts/morph-projects.ts`). Multiple paths → put the morph target
  first, or merge into a single `<path>`.
- `stroke-linecap="round"` and `stroke-linejoin="round"` keep curves smooth
  at small scales.

### Auto-generator behaviour

`scripts/build-project-name-svgs.mjs` renders each project name with
`opentype.js` + Arial Bold (Liberation Sans / DejaVu fallback) into a single
outlined path. It writes only when the file is missing. To regenerate:

```sh
npm run names:build           # skips files that already exist
npm run names:build -- --force   # overwrites everything
```

Three knobs in that script control the rendered output:

| Line | Knob        | Effect                                                   |
| ---- | ----------- | -------------------------------------------------------- |
| 79   | `FONT_SIZE` | Bigger = more path detail / sharper curves (max ~256).   |
| 94   | `0.88`      | How much of the 256×256 box the text fills.              |
| 143  | `stroke-width="14"` | Visual weight baked into the generated SVG.       |

---

## Worked example

You want a hand-crafted **Medev** glyph that doesn't match the Phosphor
`hospital` outline.

1. Create `public/icons/regular/medev.svg` with viewBox `0 0 256 256` and a
   `<path d="…your glyph…"/>`.
2. (Optional) Hand-craft `public/projects/names/medev.svg` with your
   preferred letterforms as a single `<path>`.
3. Map the icon name in `src/components/icons/iconMappings.ts` so
   `home.json`'s `iconClass` resolves to `medev`.
4. `npm run build` — both files survive; generators no-op.

## Validation

After a build, check that the morph target was picked up: open the page,
hover a tile, and watch the console for `[morph] got path d, length=…` —
non-zero means your `<path d="…">` was found and parsed.
