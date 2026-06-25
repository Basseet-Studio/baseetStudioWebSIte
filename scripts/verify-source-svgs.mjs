#!/usr/bin/env node
// verify-source-svgs.mjs
// -----------------------------------------------------------------------------
// Audit the source SVGs and the SOURCE_SVGS mapping. For each project slug
// it produces a textual report listing:
//
//   - the source logo file and what it contains (path count, fill style,
//     viewBox, presence of backdrop / gradients / filters / clip-paths)
//   - the source name file and what it contains (path count, viewBox)
//   - issues that affect rendering quality at the 87px tile size
//
// Output is printed to stdout. The script also writes
// /tmp/source-svgs-audit.json with the full structured report.
//
// Run:  node scripts/verify-source-svgs.mjs
// -----------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SOURCE_SVGS, parseViewBox, pathBBox, unionBBox, fitTransform } from "../src/lib/sourceSvgs.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

function analyseSvg(svg) {
  const vbox = parseViewBox(svg);
  const paths = (svg.match(/<path\b/g) || []).length;
  const circles = (svg.match(/<circle\b/g) || []).length;
  const rects = (svg.match(/<rect\b/g) || []).length;
  const ellipses = (svg.match(/<ellipse\b/g) || []).length;
  const lines = (svg.match(/<line\b/g) || []).length;
  const polys = (svg.match(/<(?:polyline|polygon)\b/g) || []).length;
  const hasGradients = /<(?:linear|radial)Gradient\b/i.test(svg);
  const hasFilter = /<filter\b/i.test(svg);
  const hasClip = /<clipPath\b/i.test(svg);
  const hasMask = /<mask\b/i.test(svg);
  const hasStyle = /<style\b/i.test(svg);
  const hasText = /<text\b/i.test(svg);
  const fills = [...svg.matchAll(/\bfill="([^"]+)"/g)].map((m) => m[1]);
  const strokes = [...svg.matchAll(/\bstroke="([^"]+)"/g)].map((m) => m[1]);
  const ds = [...svg.matchAll(/\bd="([^"]+)"/g)].map((m) => m[1]);
  const union = unionBBox(ds.map(pathBBox).filter(Boolean));
  const aff = union ? fitTransform(union, 256, 0.1) : null;
  return {
    viewBox: { width: vbox[2], height: vbox[3] },
    counts: { paths, circles, rects, ellipses, lines, polys },
    features: { hasGradients, hasFilter, hasClip, hasMask, hasStyle, hasText },
    fills: [...new Set(fills)],
    strokes: [...new Set(strokes)],
    pathCount: ds.length,
    pathDTotal: ds.reduce((a, s) => a + s.length, 0),
    union: union ? { width: union.width, height: union.height } : null,
    fitScale: aff ? aff.a : null,
    outputFillPct: union && aff ? ((union.width * aff.a * union.height * aff.a) / (256 * 256) * 100) : null,
  };
}

function audit(kind, filePath, analyse) {
  const issues = [];
  if (analyse.pathCount === 0) {
    issues.push("❌ NO <path> ELEMENTS — morph will have no source");
  }
  if (analyse.features.hasText) {
    issues.push("⚠️  contains <text> — text is rendered as glyphs, not paths. Will look low-res.");
  }
  if (analyse.features.hasGradients && kind === "logo") {
    issues.push("ℹ️  has gradients — line-drawing extraction will look sparse");
  }
  if (analyse.features.hasFilter && kind === "logo") {
    issues.push("ℹ️  has filters (drop-shadow / glow) — will be stripped");
  }
  if (kind === "name" && analyse.outputFillPct !== null && analyse.outputFillPct < 30) {
    issues.push(`⚠️  fills only ${analyse.outputFillPct.toFixed(1)}% of the 256×256 viewBox — will look tiny at 87px tile size`);
  }
  return issues;
}

const report = {};
console.log("\n┌─ SOURCE SVG AUDIT ───────────────────────────────────────────┐");
console.log("│ Each project slug → source logo (icon side) + source name.    │");
console.log("│ Issues flagged below each row.                                │");
console.log("└───────────────────────────────────────────────────────────────┘\n");

for (const [slug, files] of Object.entries(SOURCE_SVGS)) {
  console.log(`━━━ ${slug} ━━━`);
  for (const kind of ["logo", "name"]) {
    const filePath = path.join(PROJECT_ROOT, files[kind]);
    let svg;
    try {
      svg = fs.readFileSync(filePath, "utf-8");
    } catch (err) {
      console.log(`  ${kind.padEnd(4)}: ❌ file not found: ${files[kind]}`);
      report[`${slug}/${kind}`] = { error: err.message };
      continue;
    }
    const a = analyseSvg(svg);
    const issues = audit(kind, filePath, a);
    console.log(`  ${kind.padEnd(4)}: ${files[kind]}`);
    console.log(`         viewBox: ${a.viewBox.width.toFixed(0)}×${a.viewBox.height.toFixed(0)}`);
    console.log(`         paths:   ${a.pathCount}   (d-attrs total: ${a.pathDTotal} chars)`);
    console.log(`         extras:  ${Object.entries(a.features).filter(([_, v]) => v).map(([k]) => k).join(", ") || "none"}`);
    if (a.fills.length) console.log(`         fills:   ${a.fills.slice(0, 4).join(", ")}${a.fills.length > 4 ? " …" : ""}`);
    if (kind === "name" && a.outputFillPct !== null) {
      console.log(`         fills ${a.outputFillPct.toFixed(1)}% of the 256×256 viewBox when fitted (after 10% margin)`);
    }
    for (const issue of issues) {
      console.log(`         ${issue}`);
    }
    console.log();
    report[`${slug}/${kind}`] = { file: files[kind], ...a, issues };
  }
}

fs.writeFileSync("/tmp/source-svgs-audit.json", JSON.stringify(report, null, 2));
console.log(`\nWrote JSON audit to /tmp/source-svgs-audit.json\n`);