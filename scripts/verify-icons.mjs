#!/usr/bin/env node
// verify-icons.mjs
// Read-only check: every Phosphor icon referenced by iconMappings.ts must
// resolve to a local SVG file in public/icons/. Wired into the prebuild hook
// so the Astro build fails if any icon is missing.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const ICON_DIR = path.resolve(PROJECT_ROOT, 'public', 'icons')
const MAPPINGS_FILE = path.resolve(PROJECT_ROOT, 'src', 'components', 'icons', 'iconMappings.ts')

if (!fs.existsSync(MAPPINGS_FILE)) {
  console.error(`[verify-icons] Mappings file not found: ${MAPPINGS_FILE}`)
  process.exit(1)
}

const mappingsSource = fs.readFileSync(MAPPINGS_FILE, 'utf-8')

function parseObject(name) {
  const re = new RegExp(`export\\s+const\\s+${name}\\b[\\s\\S]*?\\{[\\s\\S]*?\\n\\}`, 'm')
  const match = mappingsSource.match(re)
  if (!match) return []
  const body = match[0]
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

let missing = 0
const seen = new Set()

function check(relPath) {
  if (seen.has(relPath)) return
  seen.add(relPath)
  const full = path.join(ICON_DIR, relPath)
  if (!fs.existsSync(full)) {
    console.error(`[verify-icons] MISSING: ${relPath}`)
    missing++
  }
}

for (const { value } of regular) {
  check(`regular/${value}.svg`)
  check(`bold/${value}-bold.svg`)
}
for (const { value } of bold) {
  check(`bold/${value}-bold.svg`)
}
for (const { value } of fill) {
  check(`fill/${value}-fill.svg`)
}

if (missing > 0) {
  console.error(`[verify-icons] ${missing} icon files missing.`)
  console.error(`[verify-icons] Run: npm run icons:copy`)
  process.exit(1)
}

console.log(`[verify-icons] OK — ${seen.size} icon files present, none missing.`)
process.exit(0)
