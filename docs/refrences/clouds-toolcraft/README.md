# Baseet clouds — Toolcraft export

Accurate export of the **Vanta CLOUDS** background as implemented in baseetStudioWebSIte — not the generic upstream Vanta readme.

## Start here

1. Read **[site-environment.md](./site-environment.md)** — how clouds integrate with the Astro site (DOM, scroll journey, themes, lazy load, View Transitions, UI tokens).
2. Open **[preview.html](./preview.html)** in a browser to see the current behavior locally.
3. Edit **[vanta.clouds.js](./vanta.clouds.js)** for shader / default option experiments.

## Files

| File | Purpose |
|------|---------|
| `site-environment.md` | Full production environment spec |
| `preview.html` | Local preview with scroll + day/night toggle |
| `site-shell.css` | `#vanta-bg` + theme tokens used by preview |
| `vanta-init.reference.js` | Mirror of `src/components/background/vanta-init.ts` |
| `vanta.clouds.js` | Shader source (defaults tuned to site) |
| `vanta.clouds.min.js` | UMD bundle loaded by preview / site vendor |
| `webpack.*.js`, `package.json` | Upstream Vanta build scaffolding (partial — see below) |

## Site vs stock Vanta

Production overrides worth remembering:

- **`scale: 2`** (stock is 3)
- **`mouseEase: true`**
- Colors from **24h interpolation**, not static defaults
- Container is **`200vh`** with scroll-based `translate3d` journey
- **Mobile skipped**; **reduced-motion** → CSS gradient fallback, no WebGL
- Canvas **persists** across Astro View Transitions

Details and anchor color tables are in `site-environment.md`.

## Preview locally

```bash
# From this folder — any static server works, e.g.:
npx --yes serve .
# Then open /preview.html
```

Preview loads three.js from CDN and `vanta.clouds.min.js` from this folder.

## Rebuilding the min bundle

This folder contains only the **CLOUDS** effect source. The webpack config expects a full Vanta `src/` tree (`_shaderBase.js`, etc.) which is not vendored here. Options:

- Patch `vanta.clouds.min.js` defaultOptions directly for small changes, or
- Clone [tengbao/vanta](https://github.com/tengbao/vanta), replace `src/vanta.clouds.js`, run `npm run build`, copy `dist/vanta.clouds.min.js` back.

After rebuild, re-apply site default colors if you rely on fallbacks:

```text
skyColor: 7906519      # 0x78acd7  (hour-14 day)
cloudColor: 15881259   # 0xf1e5eb
cloudShadowColor: 4939951  # 0x4b60af
scale: 2
```

## Porting back to the site

| Toolcraft change | Site destination |
|------------------|------------------|
| Shader / Vanta options | `public/vendor/vanta.clouds.min.js` |
| Init / scroll / theme logic | `src/components/background/vanta-init.ts` + sync `vanta-init.reference.js` |
| CSS tokens | `src/styles/global.css` (`--vanta-*`, `--card-window-*`) |
| Loader / mobile gate | `src/components/background/VantaBg.astro` |

## Credits

- Vanta.js by Teng Bao — [vantajs.com](https://www.vantajs.com)
- Clouds shader from [Shadertoy XslGRr](https://www.shadertoy.com/view/XslGRr) by Inigo Quilez
