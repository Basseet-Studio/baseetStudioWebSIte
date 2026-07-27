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
//   - public/projects/logos/{slug}.svg
//     Per-slug strategy: geeb/numu are normalized to 0..256 vector paths;
//     matrix/ordelo/photorestore-ai/moneybox keep the source markup
//     verbatim so gradients, masks, and brand colors survive.
// -----------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SOURCE_SVGS, parseViewBox, extractLogoPaths } from "../src/lib/sourceSvgs.ts";

const LOGO_TARGET = 256;
const LOGO_MARGIN = 0.08;
// Figma exports with gradients, masks, or multi-color fills — copy as-is.
const VERBATIM_LOGO_SLUGS = new Set([
  "matrix",
  "ordelo",
  "zyrn",
  "invexo",
  "photorestore-ai",
]);
// Serif exports: fit into 0..256 but keep original rgb fills/strokes.
const FIT_COLORED_LOGO_SLUGS = new Set(["moneybox", "numu"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(PROJECT_ROOT, "public", "projects", "names");
const LOGO_OUT_DIR = path.join(PROJECT_ROOT, "public", "projects", "logos");

function recolorSvgBody(body, { keepStrokes = false } = {}) {
  let out = body.replace(
    /\bfill="(?!none|url\()[^"]*"/gi,
    'fill="currentColor"',
  );
  // Serif/Affinity exports often bake colors into style="fill:rgb(...);stroke:…"
  out = out.replace(
    /\bfill:(?!none|url\()[^;"']+/gi,
    "fill:currentColor",
  );
  if (keepStrokes) {
    out = out.replace(/\bstroke="(?!none|url\()[^"]*"/gi, 'stroke="currentColor"');
    out = out.replace(/\bstroke:(?!none|url\()[^;"']+/gi, "stroke:currentColor");
  } else {
    out = out.replace(/\bstroke="[^"]*"/gi, "");
    out = out.replace(/\bstroke:[^;"']+/gi, "");
    out = out.replace(/\bstroke-(?:width|opacity|linecap|linejoin|miterlimit):[^;"']+/gi, "");
  }
  return out;
}

function buildWordmarkSvg(sourceSvg) {
  const [vbX, vbY, vbW, vbH] = parseViewBox(sourceSvg);
  // Strip the <svg> wrapper, keep all the inner shapes (path, defs, etc.)
  const bodyMatch = sourceSvg.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/);
  if (!bodyMatch) throw new Error("no <svg> body found");
  const body = recolorSvgBody(bodyMatch[1]);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" fill="currentColor">\n` +
    body +
    `\n</svg>\n`
  );
}

function buildNormalizedLogoSvg(sourceSvg) {
  const paths = extractLogoPaths(sourceSvg, LOGO_TARGET, LOGO_MARGIN);
  if (!paths) throw new Error("no paths extracted from logo");
  const withFill = paths.replace(/<path /g, '<path fill="currentColor" ');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LOGO_TARGET} ${LOGO_TARGET}" fill="currentColor">\n` +
    withFill +
    `\n</svg>\n`
  );
}

/** Keep source colors, gradients, masks — only re-wrap the <svg> shell. */
function buildVerbatimLogoSvg(sourceSvg) {
  const [vbX, vbY, vbW, vbH] = parseViewBox(sourceSvg);
  const bodyMatch = sourceSvg.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/);
  if (!bodyMatch) throw new Error("no <svg> body found");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}">\n` +
    bodyMatch[1] +
    `\n</svg>\n`
  );
}

function buildFitColoredLogoSvg(sourceSvg) {
  // Source file includes both the stacked bills and a separate money-wrap band.
  // Keep only the cash-note stack for the app icon. Drop per-bill ellipses too —
  // they sit far from the stack in source space and inflate the fit bbox, which
  // leaves the stack tiny in a corner of the square viewBox.
  const stackOnly = sourceSvg
    .replace(/<path\b[^>]*\bid="money-wrap"[^>]*\/?>\s*/i, "")
    .replace(/<ellipse\b[^>]*\/?>\s*/gi, "");
  const paths = extractLogoPaths(stackOnly, LOGO_TARGET, 0.04, true, true);
  if (!paths) throw new Error("no paths extracted from logo");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LOGO_TARGET} ${LOGO_TARGET}">\n` +
    paths +
    `\n</svg>\n`
  );
}

function buildLogoSvg(sourceSvg, slug) {
  if (VERBATIM_LOGO_SLUGS.has(slug)) {
    return buildVerbatimLogoSvg(sourceSvg);
  }
  if (FIT_COLORED_LOGO_SLUGS.has(slug)) {
    return buildFitColoredLogoSvg(sourceSvg);
  }
  return buildNormalizedLogoSvg(sourceSvg);
}

function main() {
  const force = process.argv.includes("--force");
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(LOGO_OUT_DIR, { recursive: true });

  const slugs = Object.keys(SOURCE_SVGS);
  if (slugs.length === 0) {
    console.warn("[names:build] SOURCE_SVGS is empty — nothing to do.");
    return;
  }

  let written = 0;
  let skipped = 0;
  let failed = 0;
  let logosWritten = 0;

  for (const slug of slugs) {
    const outPath = path.join(OUT_DIR, `${slug}.svg`);
    const logoOutPath = path.join(LOGO_OUT_DIR, `${slug}.svg`);
    if (!force && fs.existsSync(outPath)) {
      skipped++;
    }

    const entry = SOURCE_SVGS[slug];
    if (!entry) {
      console.error(`[names:build] no SOURCE_SVGS entry for slug "${slug}"`);
      failed++;
      continue;
    }

    // Emit normalized logo for the project app bar.
    const logoSourcePath = path.join(PROJECT_ROOT, entry.logo);
    try {
      if (force || !fs.existsSync(logoOutPath)) {
        const logoSvg = fs.readFileSync(logoSourcePath, "utf-8");
        const logoOut = buildLogoSvg(logoSvg, slug);
        fs.writeFileSync(logoOutPath, logoOut, "utf-8");
        logosWritten++;
        const mode = VERBATIM_LOGO_SLUGS.has(slug)
          ? "verbatim"
          : FIT_COLORED_LOGO_SLUGS.has(slug)
            ? "fit-colored"
            : "normalized";
        const [vbX, vbY, vbW, vbH] = parseViewBox(logoSvg);
        console.log(
          `[names:build]   ${slug}-logo.svg  ←  ${entry.logo}  (${mode}, viewBox: ${vbX} ${vbY} ${vbW} ${vbH})`,
        );
      }
    } catch (err) {
      console.error(
        `[names:build] could not build logo ${entry.logo}: ${err.message}`,
      );
      failed++;
    }

    if (!force && fs.existsSync(outPath)) {
      continue;
    }

    const sourcePath = path.join(PROJECT_ROOT, entry.name);
    let svg;
    try {
      svg = fs.readFileSync(sourcePath, "utf-8");
    } catch (err) {
      if (err.code === "ENOENT") {
        console.warn(
          `[names:build] name source missing for "${slug}" (${entry.name}) — keeping existing output`,
        );
        continue;
      }
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
    `[names:build] Done. Wrote ${written} names, ${logosWritten} logos, skipped ${skipped}, failed ${failed}. ` +
      `Output: ${path.relative(PROJECT_ROOT, OUT_DIR)}/, ${path.relative(PROJECT_ROOT, LOGO_OUT_DIR)}/`,
  );

  if (failed > 0) process.exit(1);
}

main();