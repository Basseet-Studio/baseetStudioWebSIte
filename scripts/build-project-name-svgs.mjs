#!/usr/bin/env node
// build-project-name-svgs.mjs
// -----------------------------------------------------------------------------
// For each project, read the source wordmark SVG and emit a clean copy at
// public/projects/names/{slug}.svg.
//
// We don't transform the path geometry — the source viewBox is already a
// tight crop, and any uniform-fit or bbox-normalisation squashes wide
// wordmarks into a tiny middle band of the icon container, which looks
// deformed. Instead we copy the source content verbatim and just swap the
// fill/stroke attributes so the per-tile --px-color cascades in.
//
// Inputs
//   - src/lib/sourceSvgs.ts  (SOURCE_SVGS mapping slug → { logo, name })
//   - source svgs/{name}.svg for each project
//
// Outputs
//   - public/projects/names/{slug}.svg
//     Same paths as the source, same viewBox, but with fill/stroke swapped
//     to currentColor so the morph target tints with the tile's color.
// -----------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SOURCE_SVGS, parseViewBox } from "../src/lib/sourceSvgs.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(PROJECT_ROOT, "public", "projects", "names");

function buildWordmarkSvg(sourceSvg) {
  const [vbX, vbY, vbW, vbH] = parseViewBox(sourceSvg);
  // Strip the <svg> wrapper, keep all the inner shapes (path, defs, etc.)
  const bodyMatch = sourceSvg.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/);
  if (!bodyMatch) throw new Error("no <svg> body found");
  let body = bodyMatch[1];
  // Recolor: any explicit fill (Figma exports as fill="black") becomes
  // currentColor. We don't apply a stroke — the source paths are fills.
  body = body.replace(
    /\bfill="(?!none|url\()[^"]*"/gi,
    'fill="currentColor"',
  );
  // Drop any explicit stroke the source had baked in.
  body = body.replace(/\bstroke="[^"]*"/gi, "");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" fill="currentColor">\n` +
    body +
    `\n</svg>\n`
  );
}

function main() {
  const force = process.argv.includes("--force");
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const slugs = Object.keys(SOURCE_SVGS);
  if (slugs.length === 0) {
    console.warn("[names:build] SOURCE_SVGS is empty — nothing to do.");
    return;
  }

  let written = 0;
  let skipped = 0;
  let failed = 0;

  for (const slug of slugs) {
    const outPath = path.join(OUT_DIR, `${slug}.svg`);
    if (!force && fs.existsSync(outPath)) {
      skipped++;
      continue;
    }

    const entry = SOURCE_SVGS[slug];
    if (!entry) {
      console.error(`[names:build] no SOURCE_SVGS entry for slug "${slug}"`);
      failed++;
      continue;
    }
    const sourcePath = path.join(PROJECT_ROOT, entry.name);
    let svg;
    try {
      svg = fs.readFileSync(sourcePath, "utf-8");
    } catch (err) {
      console.error(
        `[names:build] could not read ${entry.name}: ${err.message}`,
      );
      failed++;
      continue;
    }

    try {
      const out = buildWordmarkSvg(svg);
      fs.writeFileSync(outPath, out, "utf-8");
      written++;
      const [vbX, vbY, vbW, vbH] = parseViewBox(svg);
      console.log(
        `[names:build]   ${slug}.svg  ←  ${entry.name}  (viewBox: ${vbX} ${vbY} ${vbW} ${vbH})`,
      );
    } catch (err) {
      console.error(
        `[names:build] failed for slug "${slug}" (${entry.name}): ${err.message}`,
      );
      failed++;
    }
  }

  console.log(
    `[names:build] Done. Wrote ${written}, skipped ${skipped}, failed ${failed}. ` +
      `Output: ${path.relative(PROJECT_ROOT, OUT_DIR)}/`,
  );

  if (failed > 0) process.exit(1);
}

main();