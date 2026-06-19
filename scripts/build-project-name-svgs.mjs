#!/usr/bin/env node
// build-project-name-svgs.mjs
// -----------------------------------------------------------------------------
// Pre-generates one SVG file per project (public/projects/names/{slug}.svg)
// where the project name is rendered as a SINGLE outlined <path> in a
// 256x256 viewBox, matching Phosphor's icon coordinate system. The morph
// script (src/scripts/morph-projects.ts) reads these at runtime to morph
// the Phosphor icon's <path> into the project name on hover.
//
// Why pre-generate? The user explicitly asked for an approach that avoids
// "heavy conversion on runtime" — and shipping a full font to the browser
// + rasterising it with opentype.js on every page load would be wasteful
// for a list of ~10 project names. The 200-ish KB of static SVG path
// data we emit here is tiny and immutable.
//
// Inputs
//   - src/content/data/home.json  (home.projects[] → { name, slug })
//
// Outputs
//   - public/projects/names/{slug}.svg
//     Each file is a single-path SVG: the name drawn with a bold geometric
//     font, normalised to the 0..256 box, no fill, currentColor stroke so
//     it picks up the project's --px-color at runtime.
//
// Idempotent: skips existing files. Run `npm run names:build -- --force`
// to regenerate every file from scratch.
// -----------------------------------------------------------------------------

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import opentype from 'opentype.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const HOME_DATA = path.join(PROJECT_ROOT, 'src', 'content', 'data', 'home.json')
const OUT_DIR = path.join(PROJECT_ROOT, 'public', 'projects', 'names')

// --- Font discovery ---------------------------------------------------------
// We try a handful of common system fonts in order of preference. The first
// one that loads + contains all the glyphs we need wins. Arial Bold is the
// most widely available cross-platform; on macOS we get the real Arial Bold,
// on Linux/Windows we fall back to Liberation Sans / DejaVu.
const FONT_CANDIDATES = [
  { file: '/System/Library/Fonts/Supplemental/Arial Bold.ttf',            weight: 700 },
  { file: '/System/Library/Fonts/Supplemental/Arial.ttf',                  weight: 400 },
  { file: '/Library/Fonts/Arial Bold.ttf',                                 weight: 700 },
  { file: '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',  weight: 700 },
  { file: '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf', weight: 400 },
  { file: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',          weight: 700 },
  { file: 'C:\\Windows\\Fonts\\arialbd.ttf',                               weight: 700 },
  { file: 'C:\\Windows\\Fonts\\arial.ttf',                                 weight: 400 },
]

function findFont() {
  for (const cand of FONT_CANDIDATES) {
    if (fs.existsSync(cand.file)) {
      try {
        const buf = fs.readFileSync(cand.file)
        const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
        return { font, source: cand.file, weight: cand.weight }
      } catch (err) {
        console.warn(`[names:build] could not parse ${cand.file}: ${err.message}`)
      }
    }
  }
  throw new Error(
    '[names:build] No suitable bold sans font found. Install Arial, Liberation Sans, or DejaVu Sans.',
  )
}

// --- Path generation --------------------------------------------------------
// Render the name at fontSize 256 with a y baseline near the bottom, then
// normalise the path into the 0..256 box using its bounding box. We strip
// the existing transform — opentype emits absolute coordinates — and emit
// a single `d` attribute so the morph target has exactly one <path>.

const VIEWBOX = 256
const FONT_SIZE = 200 // leaves ~28px top/bottom margin when normalised

function textToPath(font, text) {
  // x = 0, y = baseline offset, fontSize = FONT_SIZE
  const otPath = font.getPath(text, 0, FONT_SIZE, FONT_SIZE)
  const bbox = otPath.getBoundingBox()
  if (!isFinite(bbox.x1) || !isFinite(bbox.y1) || !isFinite(bbox.x2) || !isFinite(bbox.y2)) {
    throw new Error(`empty bounding box for "${text}"`)
  }
  // Translate so bbox.x1,y1 -> 0,0
  const dx = -bbox.x1
  const dy = -bbox.y1
  const w = bbox.x2 - bbox.x1
  const h = bbox.y2 - bbox.y1
  // Scale uniformly into VIEWBOX x VIEWBOX (centered)
  const scale = Math.min(VIEWBOX / w, VIEWBOX / h) * 0.88 // 12% breathing room
  const offsetX = (VIEWBOX - w * scale) / 2
  const offsetY = (VIEWBOX - h * scale) / 2

  // Re-emit coordinates with the transform baked in. We need to walk the
  // raw path commands (which opentype returns as a flat list) and rebuild
  // a clean path string scaled to fit the viewBox.
  const cmds = otPath.commands
  const out = []
  // The path uses absolute coordinates; we need to apply the affine
  // transform ourselves.
  const tx = (x) => (x + dx) * scale + offsetX
  const ty = (y) => (y + dy) * scale + offsetY
  for (const cmd of cmds) {
    switch (cmd.type) {
      case 'M':
        out.push(`M${tx(cmd.x).toFixed(2)} ${ty(cmd.y).toFixed(2)}`)
        break
      case 'L':
        out.push(`L${tx(cmd.x).toFixed(2)} ${ty(cmd.y).toFixed(2)}`)
        break
      case 'C':
        out.push(
          `C${tx(cmd.x1).toFixed(2)} ${ty(cmd.y1).toFixed(2)} ` +
            `${tx(cmd.x2).toFixed(2)} ${ty(cmd.y2).toFixed(2)} ` +
            `${tx(cmd.x).toFixed(2)} ${ty(cmd.y).toFixed(2)}`,
        )
        break
      case 'Q':
        out.push(
          `Q${tx(cmd.x1).toFixed(2)} ${ty(cmd.y1).toFixed(2)} ` +
            `${tx(cmd.x).toFixed(2)} ${ty(cmd.y).toFixed(2)}`,
        )
        break
      case 'Z':
        out.push('Z')
        break
    }
  }
  return out.join(' ')
}

function buildSvg(name, dAttr) {
  // stroke=currentColor so the card's --px-color tints it; fill=none so
  // the outline shape renders exactly like the Phosphor icon's
  // fill="none" backdrop. The icon and the name share the same viewBox
  // (0 0 256 256) so morphSVG can interpolate 1:1.
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX} ${VIEWBOX}" ` +
    `fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="${dAttr}"/>` +
    `</svg>\n`
  )
}

// --- Main -------------------------------------------------------------------

function main() {
  const force = process.argv.includes('--force')

  if (!fs.existsSync(HOME_DATA)) {
    console.error(`[names:build] Missing ${HOME_DATA}`)
    process.exit(1)
  }

  const data = JSON.parse(fs.readFileSync(HOME_DATA, 'utf-8'))
  const projects = Array.isArray(data.projects) ? data.projects : []
  if (projects.length === 0) {
    console.warn('[names:build] No projects found in home.json — nothing to do.')
    return
  }

  const { font, source } = findFont()
  console.log(`[names:build] Using font: ${source}`)

  fs.mkdirSync(OUT_DIR, { recursive: true })

  let written = 0
  let skipped = 0
  let failed = 0

  for (const project of projects) {
    const slug = project.slug
    const name = project.name
    if (!slug || !name) {
      console.warn(`[names:build] Skipping project with missing slug/name:`, project)
      failed++
      continue
    }
    const outPath = path.join(OUT_DIR, `${slug}.svg`)
    if (!force && fs.existsSync(outPath)) {
      skipped++
      continue
    }
    try {
      const d = textToPath(font, name)
      fs.writeFileSync(outPath, buildSvg(name, d), 'utf-8')
      written++
      console.log(`[names:build]   ${slug}.svg  ←  "${name}"  (${d.length} chars)`)
    } catch (err) {
      console.error(`[names:build] Failed for "${name}" (${slug}): ${err.message}`)
      failed++
    }
  }

  console.log(
    `[names:build] Done. Wrote ${written}, skipped ${skipped}, failed ${failed}. ` +
      `Output: ${path.relative(PROJECT_ROOT, OUT_DIR)}/`,
  )

  if (failed > 0) process.exit(1)
}

main()
