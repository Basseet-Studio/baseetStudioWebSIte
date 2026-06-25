#!/usr/bin/env node
// preview-numu-morph.mjs — render a single page that shows the numu tile
// at 87px and 256px (rest + hover-morph) for visual verification.

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const out = "/tmp/numu-morph-preview.html";

const logoSvg = fs.readFileSync(
  path.join(root, "source svgs/figma-exports/numu-figma-logo.svg"),
  "utf-8",
);
const nameSvg = fs.readFileSync(
  path.join(root, "public/projects/names/numu.svg"),
  "utf-8",
);

const html = `<!doctype html>
<html><head><title>Numu morph preview</title>
<style>
  body { font-family: -apple-system, sans-serif; background: #1a1a1a; color: #eee; padding: 32px; }
  h1 { font-weight: 300; }
  .row { display: flex; gap: 40px; margin: 24px 0; }
  .cell { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .label { font-size: 12px; color: #999; font-family: monospace; }
  .frame { background: #2a2a2a; padding: 12px; border-radius: 8px; }
  .frame:hover .icon { /* simulate the morph target */ }
  .icon-source { color: #9333EA; }
</style>
</head>
<body>
<h1>Numu morph — source files</h1>
<div class="row">
  <div class="cell">
    <div class="label">logo source (185×192)</div>
    <div class="frame">${logoSvg.replace('width="185" height="192"', 'width="200" height="200"')}</div>
  </div>
  <div class="cell">
    <div class="label">name source (186×73)</div>
    <div class="frame">${nameSvg.replace('viewBox="0 0 186 73"', 'viewBox="0 0 186 73" width="400" height="157"')}</div>
  </div>
</div>
<h1>Numu morph — built name (current pipeline output)</h1>
<div class="row">
  <div class="cell">
    <div class="label">built numu.svg (the morph target)</div>
    <div class="frame">${nameSvg.replace('viewBox="0 0 186 73"', 'viewBox="0 0 186 73" width="400" height="157"')}</div>
  </div>
</div>
</body></html>`;

fs.writeFileSync(out, html);
console.log(`Wrote ${out}`);