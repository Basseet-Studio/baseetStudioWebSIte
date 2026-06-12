#!/usr/bin/env node
// copy-phosphor-icons.mjs
// Copy every Phosphor SVG referenced by iconMappings.ts from the shared source
// at ../phosphor-icons/SVGs/ into baseetstudiosite2/public/icons/.
// Also copies clover-bold.svg as the main Baseet brand mark.
// Idempotent: skips files that already exist. Warns on missing sources.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const SOURCE_ROOT = path.resolve(PROJECT_ROOT, '..', 'phosphor-icons', 'SVGs')
const TARGET_ROOT = path.resolve(PROJECT_ROOT, 'public', 'icons')
const MAPPINGS_FILE = path.resolve(PROJECT_ROOT, 'src', 'components', 'icons', 'iconMappings.ts')

if (!fs.existsSync(SOURCE_ROOT)) {
  console.error(`[copy-phosphor-icons] Source directory not found: ${SOURCE_ROOT}`)
  console.error(`[copy-phosphor-icons] Run from a checkout that includes phosphor-icons/ at the repo root.`)
  process.exit(1)
}

if (!fs.existsSync(MAPPINGS_FILE)) {
  console.error(`[copy-phosphor-icons] Mappings file not found: ${MAPPINGS_FILE}`)
  process.exit(1)
}

const mappingsSource = fs.readFileSync(MAPPINGS_FILE, 'utf-8')

function parseObject(name) {
  // Match: export const NAME: ... = { ... }  (multiline, lazy)
  const re = new RegExp(`export\\s+const\\s+${name}\\b[\\s\\S]*?\\{[\\s\\S]*?\\n\\}`, 'm')
  const match = mappingsSource.match(re)
  if (!match) return []
  const body = match[0]
  // Capture 'key': 'value' pairs (single-quoted)
  const entryRe = /'([^']+)'\s*:\s*'([^']+)'/g
  const entries = []
  let m
  while ((m = entryRe.exec(body)) !== null) {
    entries.push({ key: m[1], value: m[2] })
  }
  return entries
}

const regular = parseObject('FA_TO_PHOSPHOR')
const bold = parseObject('FA_TO_PHOSPHOR_BOLD')
const fill = parseObject('FA_TO_PHOSPHOR_FILL')

console.log(`[copy-phosphor-icons] Parsed mappings: regular=${regular.length}, bold=${bold.length}, fill=${fill.length}`)

const toCopy = new Set()

// Regular: every value, under regular/{value}.svg
for (const { value } of regular) toCopy.add(`regular/${value}.svg`)
// Auto-derived bold variant for every regular mapping (Phosphor convention: bold files are named *-bold.svg)
for (const { value } of regular) toCopy.add(`bold/${value}-bold.svg`)
// Explicit bold mappings — value is the BASENAME (e.g. 'apple-logo'); on-disk is `bold/{value}-bold.svg`
for (const { value } of bold) toCopy.add(`bold/${value}-bold.svg`)
// Fill mappings — value is the BASENAME (e.g. 'instagram-logo'); on-disk is `fill/{value}-fill.svg`
for (const { value } of fill) toCopy.add(`fill/${value}-fill.svg`)
// Main brand logo — always
toCopy.add('bold/clover-bold.svg')

let copied = 0
let skipped = 0
let missing = 0

for (const relPath of toCopy) {
  const src = path.join(SOURCE_ROOT, relPath)
  const dst = path.join(TARGET_ROOT, relPath)
  fs.mkdirSync(path.dirname(dst), { recursive: true })
  if (fs.existsSync(dst)) { skipped++; continue }
  if (!fs.existsSync(src)) {
    console.warn(`[copy-phosphor-icons] WARN: missing source ${src}`)
    missing++
    continue
  }
  fs.copyFileSync(src, dst)
  copied++
}

console.log(`[copy-phosphor-icons] Source: ${SOURCE_ROOT}`)
console.log(`[copy-phosphor-icons] Target: ${TARGET_ROOT}`)
console.log(`[copy-phosphor-icons] Total targets: ${toCopy.size}`)
console.log(`[copy-phosphor-icons] Copied: ${copied}, Skipped (existing): ${skipped}, Missing source: ${missing}`)

if (missing > 0) {
  console.warn(`[copy-phosphor-icons] Some source files are missing. The site will still build, but those icons will fall back to empty span.`)
}

process.exit(0)
