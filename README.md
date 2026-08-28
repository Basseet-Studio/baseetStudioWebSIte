# Baseet Studio website

Astro 5 static site. Requires **Node.js 22.12+**.

From the repo root (`baseetStudioWebSIte/`):

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # output: dist/
npm run preview      # serve the production build
```

`npm run build` already runs `prebuild` (icon check + project-name SVGs). Do not use `npx run build`.

If `astro build` / `astro dev` fails on `mkdir .../Library/Preferences/astro`, telemetry is writing to the Mac boot volume (not this repo). Skip it:

```bash
ASTRO_TELEMETRY_DISABLED=1 npm run dev
ASTRO_TELEMETRY_DISABLED=1 npm run build
```

`ENOSPC: no space left on device` means the **home disk** is full (`~/.npm`, `~/Library`). npm and Astro write there even when the project lives on an external volume. Free space on Macintosh HD, then retry.

Workers (forms / booking) are separate: see [`workers/README.md`](workers/README.md).
