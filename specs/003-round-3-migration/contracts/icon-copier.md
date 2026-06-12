# Contract: Phosphor SVG Copier

**File**: `baseetstudiosite2/scripts/copy-phosphor-icons.mjs`
**Type**: Build-time helper (Node.js, ESM, no dependencies)
**Trigger**: Manual run during setup, or CI step
**Output**: Phosphor SVG files copied from `phosphor-icons/SVGs/{variant}/` to `public/icons/{variant}/`

## Purpose

Copy every Phosphor SVG that is referenced anywhere in the codebase (via `iconMappings.ts`) from the shared source directory into the Astro project's `public/icons/` directory, so the static site is fully self-contained and renders every icon correctly. Also copies the `clover-bold.svg` logo for use as the Baseet brand mark.

## Inputs

```typescript
// Resolved at script startup
const SOURCE_ROOT = resolve('../phosphor-icons/SVGs')   // site/phosphor-icons/SVGs
const TARGET_ROOT = resolve('./public/icons')          // site/baseetstudiosite2/public/icons

// Read from TypeScript source (parsed by regex — no TS compiler dependency)
const MAPPINGS_FILE = resolve('./src/components/icons/iconMappings.ts')
```

## Source-of-truth list

The script reads `iconMappings.ts` and extracts every value in `FA_TO_PHOSPHOR`, `FA_TO_PHOSPHOR_BOLD`, and `FA_TO_PHOSPHOR_FILL`. For each value, the script computes the source filename per variant:

| Mapping constant | Target name | Regular source | Bold source | Fill source |
|---|---|---|---|---|
| `FA_TO_PHOSPHOR[name]` | `value` | `regular/{value}.svg` | `bold/{value}-bold.svg` | `fill/{value}-fill.svg` |
| `FA_TO_PHOSPHOR_BOLD[name]` | `value` | (skip — bold-only) | `bold/{value}-bold.svg` | (skip) |
| `FA_TO_PHOSPHOR_FILL[name]` | `value` | (skip — fill-only) | (skip) | `fill/{value}-fill.svg` |

Additionally, the script always copies `bold/clover-bold.svg` regardless of whether it's in the mapping table (used as the main Baseet logo, not a UI icon).

## Behaviour

1. Parse `iconMappings.ts` with a regex to extract the three mapping objects (script does NOT need TypeScript compilation — uses simple `Object.fromEntries` on a matched `key: 'value'` pattern).
2. For each `(name, variant)` pair in the union of all three mapping values, compute the source path and target path.
3. If the source file does not exist, log `WARN: missing source {sourcePath}` and continue (do not fail the script).
4. If the target file already exists, skip (idempotent — does not overwrite).
5. Otherwise, copy the file via `fs.copyFileSync`.
6. After processing all mappings, additionally copy `bold/clover-bold.svg` (always — even if not in mappings).
7. Print summary: `Copied: N, Skipped: M, Missing: K` and exit 0.

## Output

- `public/icons/regular/{name}.svg` — one file per `FA_TO_PHOSPHOR` value
- `public/icons/bold/{name}.svg` — one file per `FA_TO_PHOSPHOR_BOLD` value AND per `FA_TO_PHOSPHOR` value (for brands that should always be bold)
- `public/icons/bold/{name}-bold.svg` — one file per `FA_TO_PHOSPHOR_BOLD` value (Phosphor naming convention: bold variant has `-bold` suffix)
- `public/icons/fill/{name}.svg` AND `public/icons/fill/{name}-fill.svg` — one file per `FA_TO_PHOSPHOR_FILL` value
- `public/icons/bold/clover-bold.svg` — main logo

**Approximate counts** (after a full run with the expanded `iconMappings.ts`):
- regular: ~95 files (from `FA_TO_PHOSPHOR`)
- bold: ~10 files (`FA_TO_PHOSPHOR_BOLD`) + 1 logo = ~11 files
- fill: ~10 files (`FA_TO_PHOSPHOR_FILL`)

**Total**: ~116 files, ~250-400 KB on disk. Committed to the repo as static assets.

## Reference implementation outline

```javascript
#!/usr/bin/env node
// copy-phosphor-icons.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SOURCE_ROOT = path.resolve(__dirname, '../../phosphor-icons/SVGs')
const TARGET_ROOT = path.resolve(__dirname, '../public/icons')
const MAPPINGS_FILE = path.resolve(__dirname, '../src/components/icons/iconMappings.ts')

// 1. Parse iconMappings.ts to extract all name→value pairs from the three FA_TO_PHOSPHOR_* objects
const mappingsSource = fs.readFileSync(MAPPINGS_FILE, 'utf-8')
const parseObject = (name) => {
  const re = new RegExp(`export const ${name}[\\s\\S]*?\\{([\\s\\S]*?)\\n\\}`, 'm')
  const match = mappingsSource.match(re)
  if (!match) return []
  const body = match[1]
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

// 2. Build the set of (variant, filename) to copy
const toCopy = new Set()

// Regular: every value, under regular/{value}.svg
for (const { value } of regular) toCopy.add(`regular/${value}.svg`)

// Bold from FA_TO_PHOSPHOR: every value, under bold/{value}-bold.svg
for (const { value } of regular) toCopy.add(`bold/${value}-bold.svg`)

// Bold from FA_TO_PHOSPHOR_BOLD: every value, under bold/{value}-bold.svg (Phosphor convention)
for (const { value } of bold) toCopy.add(`bold/${value}-bold.svg`)

// Fill from FA_TO_PHOSPHOR_FILL: every value, under fill/{value}-fill.svg
for (const { value } of fill) toCopy.add(`fill/${value}-fill.svg`)

// Always copy the main logo
toCopy.add('bold/clover-bold.svg')

// 3. Copy each file
let copied = 0, skipped = 0, missing = 0
for (const relPath of toCopy) {
  const src = path.join(SOURCE_ROOT, relPath)
  const dst = path.join(TARGET_ROOT, relPath)
  fs.mkdirSync(path.dirname(dst), { recursive: true })
  if (fs.existsSync(dst)) { skipped++; continue }
  if (!fs.existsSync(src)) {
    console.warn(`WARN: missing source ${src}`)
    missing++
    continue
  }
  fs.copyFileSync(src, dst)
  copied++
}

console.log(`[copy-phosphor-icons] Copied: ${copied}, Skipped: ${skipped}, Missing: ${missing}`)
console.log(`[copy-phosphor-icons] Source: ${SOURCE_ROOT}`)
console.log(`[copy-phosphor-icons] Target: ${TARGET_ROOT}`)
process.exit(0)
```

## Verification

```bash
# Run the script
cd baseetstudiosite2
node scripts/copy-phosphor-icons.mjs

# Confirm every mapping target file now exists
for icon in cash-register hospital shopping-bag fork-knife piggy-bank fire squares-four magic-wand stethoscope graduation-cap train building stack gift chart-bar calculator receipt first-aid calendar-check users plug palette storefront device-mobile truck credit-card list-checks cube clock chart-pie chart-line bell folder shield check-circle file-text columns magnifying-glass lightning trophy folder-open pill clipboard-text video brain translate robot warning path git-fork pencil-simple gauge headset barcode globe apple-logo android-logo desktop code instagram-logo linkedin-logo x-logo twitter-logo github-logo dribbble-logo facebook-logo youtube-logo tiktok-logo whatsapp-logo arrow-left arrow-right caret-down caret-up envelope phone phone-call map-pin play arrow-square-out rocket x list check info question star heart share download upload gear wrench user circle printer tag percent paint-brush cloud lock clover; do
  test -f "public/icons/regular/$icon.svg" || echo "MISSING: $icon.svg"
done
```

Expected: zero `MISSING` lines.

## Companion script: verify-icons.mjs

A read-only check that runs in CI to confirm every mapping still resolves:

```javascript
#!/usr/bin/env node
// scripts/verify-icons.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ICON_DIR = path.resolve(__dirname, '../public/icons')
const MAPPINGS_FILE = path.resolve(__dirname, '../src/components/icons/iconMappings.ts')

// (parse iconMappings.ts the same way as copy-phosphor-icons.mjs)
// ... extract regular / bold / fill names ...

let missing = 0
for (const name of regularNames) {
  for (const variant of ['regular']) {
    if (!fs.existsSync(path.join(ICON_DIR, variant, `${name}.svg`))) {
      console.error(`MISSING: ${variant}/${name}.svg`)
      missing++
    }
  }
}
for (const name of boldNames) {
  if (!fs.existsSync(path.join(ICON_DIR, 'bold', `${name}-bold.svg`))) {
    console.error(`MISSING: bold/${name}-bold.svg`)
    missing++
  }
}
for (const name of fillNames) {
  if (!fs.existsSync(path.join(ICON_DIR, 'fill', `${name}-fill.svg`))) {
    console.error(`MISSING: fill/${name}-fill.svg`)
    missing++
  }
}

if (missing > 0) {
  console.error(`\n[verify-icons] ${missing} icons missing. Run: node scripts/copy-phosphor-icons.mjs`)
  process.exit(1)
}
console.log('[verify-icons] All icon mappings resolve to local SVG files.')
process.exit(0)
```

Exit code 0 = pass, 1 = fail. Wire into `package.json` `"prebuild": "node scripts/verify-icons.mjs"` to fail the build on missing icons.
