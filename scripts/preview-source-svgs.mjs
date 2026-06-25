#!/usr/bin/env node
// preview-source-svgs.mjs
// -----------------------------------------------------------------------------
// Writes a self-contained HTML preview to /tmp/source-svgs-preview.html that
// shows, for each project slug, the source logo SVG and the source name SVG
// side-by-side at the actual on-screen tile size. Use it to confirm the
// mapping in src/lib/sourceSvgs.ts matches what you want.
//
// Run:  node scripts/preview-source-svgs.mjs
// Then: open /tmp/source-svgs-preview.html in a browser.
// -----------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SOURCE_SVGS } from "../src/lib/sourceSvgs.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUT = "/tmp/source-svgs-preview.html";

const readSvg = (rel) => {
  const full = path.join(PROJECT_ROOT, rel);
  try {
    return fs.readFileSync(full, "utf-8");
  } catch (err) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><text x="128" y="128" text-anchor="middle" fill="red" font-size="12">missing: ${rel}</text></svg>`;
  }
};

const inlineSvg = (svg) => svg.replace(/<\?xml[^>]*\?>\s*/, "").trim();

const rows = Object.entries(SOURCE_SVGS).map(([slug, files]) => {
  const logoSvg = inlineSvg(readSvg(files.logo));
  const nameSvg = inlineSvg(readSvg(files.name));
  return `
    <div class="row">
      <div class="meta">
        <div class="slug">${slug}</div>
        <div class="files">
          <div>logo: <code>${files.logo}</code></div>
          <div>name: <code>${files.name}</code></div>
        </div>
      </div>
      <div class="art">
        <div class="cell">
          <div class="cap">logo (icon side of morph)</div>
          <div class="frame-87">${logoSvg}</div>
          <div class="cap">87px tile size</div>
        </div>
        <div class="cell">
          <div class="cap">name (target side of morph)</div>
          <div class="frame-87">${nameSvg}</div>
          <div class="cap">87px tile size</div>
        </div>
        <div class="cell big">
          <div class="cap">name @ 256px</div>
          <div class="frame-256">${nameSvg}</div>
        </div>
      </div>
    </div>
  `;
}).join("\n");

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Source SVG preview</title>
<style>
  :root { color-scheme: light; }
  body { font-family: ui-monospace, "SF Mono", Menlo, monospace; background: #fafafa; color: #111; padding: 24px; margin: 0; }
  h1 { font-size: 18px; margin: 0 0 16px; }
  .row { display: grid; grid-template-columns: 260px 1fr; gap: 16px; background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  .meta { border-right: 1px solid #eee; padding-right: 16px; }
  .slug { font-weight: 700; font-size: 16px; margin-bottom: 8px; }
  .files { font-size: 11px; color: #555; line-height: 1.6; }
  code { background: #f3f3f3; padding: 1px 4px; border-radius: 3px; }
  .art { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
  .cell { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .cap { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
  .frame-87 { width: 87px; height: 87px; background: #fff; border: 1px solid #ddd; display: grid; place-items: center; overflow: hidden; }
  .frame-87 svg { width: 87px; height: 87px; display: block; }
  .frame-256 { width: 256px; height: 256px; background: #fff; border: 1px solid #ddd; display: grid; place-items: center; overflow: hidden; }
  .frame-256 svg { width: 256px; height: 256px; display: block; }
  .big { margin-left: auto; }
</style>
</head>
<body>
<h1>Source SVG preview — confirm src/lib/sourceSvgs.ts mapping</h1>
<p style="color: #666; margin: 0 0 16px; font-size: 12px;">Each row shows what the morph will see as the icon (left) and the target name (middle, at tile size 87px). The right shows the name at 256px for clarity. If the logo doesn't match the project, edit <code>src/lib/sourceSvgs.ts</code> and re-run <code>node scripts/preview-source-svgs.mjs</code>.</p>
${rows}
</body>
</html>
`;

fs.writeFileSync(OUT, html);
console.log(`Wrote preview to ${OUT}`);
console.log(`Open it in your browser to verify the mapping.`);
