# Numu Morph — How It Works (June 25 2026)

## What you have to give me (per project, just like numu)

For every project you want in the home grid, drop two SVG files into `source svgs/figma-exports/`:

- `yourbrand-figma-logo.svg`  — just the icon. Tightly framed, no wordmark, no background.
- `yourbrand-figma-name.svg`  — just the wordmark. Tightly framed, no icon, no background.

That's it. Both files go straight from Figma → that folder. No transformation, no cleanup, no design work on my end.

## Figma export settings (the only thing you have to remember)

When you click **Export** in Figma:

- Format: **SVG**
- ✅ Include fill
- ❌ Include stroke (the "outline" stroke — leave it OFF; my code handles strokes)
- ✅ **Outline text** (critical — text must become paths, not `<text>` tags)
- ❌ Simplify
- ❌ Use multiple paths
- ❌ Responsive

Before exporting, **select only the thing you want** (just the icon, or just the wordmark) — not the whole artboard. Figma uses the selection's bounding box for the viewBox automatically. Tight crop, no padding, no extra layers.

## The framing rule (this is the part that matters)

**The icon's viewBox and the wordmark's viewBox should be the same dimensions.** They don't have to match in content — the icon will be a swoosh, the wordmark will be letters — but the **frame around them should be identical** in Figma before you export.

For numu:
- Icon source: `0 0 185 192` (square-ish, ratio ~1:1)
- Name source: `0 0 186 73` (wide, ratio ~2.55:1)
- They're **different** — that's why my code has to matrix-fit one into the other

If you can, **frame them the same.** Easiest way:
1. In Figma, draw a frame at the size you want (e.g. 200×60 for a wide wordmark)
2. Drop the icon inside, centered, scaled to fit
3. Drop the wordmark inside, centered, scaled to fit
4. Export selection for each one separately

The viewBox becomes the frame size. Both exports = same viewBox. My code doesn't have to do any math.

## What I do on my end (don't worry about this)

1. **Build script** (`scripts/build-project-name-svgs.mjs`) reads your wordmark source, copies the path data into `public/projects/names/{slug}.svg` with `fill="currentColor"` so it tints with the tile's color.
2. **Home page component** (`src/components/home/ProximityProjects.astro`) reads your icon source, injects it into the tile's SVG, sized to match the wordmark's viewBox.
3. **Morph script** (`src/scripts/morph-projects.ts`) animates the icon's main path into the wordmark's path on hover using GSAP's `morphSVG`.

No transformations, no cleanups, no "fixing" your files. Whatever you export is what gets used.

## Current numu state (it's working)

- Source: `source svgs/figma-exports/numu-figma-logo.svg` (185×192)
- Source: `source svgs/figma-exports/numu-figma-name.svg` (186×73)
- Built: `public/projects/names/numu.svg` (copy of the name source, with `fill="currentColor"`)
- Tile on home: 87×87px square, but the icon SVG inside has viewBox `0 0 186 73` so it renders as a wide strip
- Color: purple `#9333EA`
- Hover: the swoosh morphs into "NUMU"

## When you add more projects

Add the entry to `SOURCE_SVGS` in `src/lib/sourceSvgs.ts`:

```ts
matrix: {
  logo: "source svgs/figma-exports/matrix-figma-logo.svg",
  name: "source svgs/figma-exports/matrix-figma-name.svg",
},
```

The home page (`src/pages/index.astro`) auto-filters projects to only show ones with SOURCE_SVGS entries. Drop in the two files + one line of config = the project shows up in the grid.

## FAQ

**Q: My icon and wordmark have different aspect ratios. Will it still work?**
Yes. My code matrix-fits the icon into the wordmark's viewBox. The icon will look slightly squished if the ratios are very different, but it works.

**Q: Can I just have one file with both?**
No. They need to be two files because morphSVG tweens one path into another path. If you give me one file with both, I have to split them, which I can't do reliably from your Figma layers.

**Q: Why do you have a build script at all?**
To make the wordmark render in the browser. The morph target needs to be a separate SVG file the browser can fetch. The build script just copies your source and adds `fill="currentColor"` so the tile color cascades in.

**Q: What if I update the Figma file and re-export?**
Drop the new file over the old one. Run `npm run names:build -- --force` to rebuild. Or just delete `public/projects/names/{slug}.svg` and re-run `npm run build` (it runs `prebuild` which calls the build script).
