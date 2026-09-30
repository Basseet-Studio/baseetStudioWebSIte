#!/usr/bin/env node
/**
 * Compress keeper (and library) skies into public/images/skyscapes/.
 * Archives copies under skyscapes/raw/. Does not delete originals.
 * `--fetch` downloads any missing keeper source from Poly Haven
 * (tonemapped equirect JPGs) into skyscapes/.
 *
 * Default keepers — six slots aligned with the theme anchor hours
 * (src/lib/theme.ts), all low-cloud skies so the moving 3D clouds do not
 * fight clouds baked into the photo. Override with --keepers id=file.jpg,...:
 *   sky-night    qwantani_night_puresky.jpg       hour 0
 *   sky-dawn     qwantani_dawn_puresky.jpg        hour 4.5
 *   sky-morning  autumn_field_puresky.jpg         hour 8
 *   sky-day      kloofendal_48d_partly_cloudy_puresky.jpg hour 14
 *   sky-evening  qwantani_sunset_puresky.jpg      hour 19
 *   sky-dusk     qwantani_dusk_2_puresky.jpg      hour 21
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const srcDir = path.join(root, 'skyscapes')
const rawDir = path.join(srcDir, 'raw')
const outDir = path.join(root, 'public', 'images', 'skyscapes')
const libraryDir = path.join(outDir, 'library')

const POLYHAVEN_JPG_URL = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG'

const DEFAULT_KEEPERS = [
  { id: 'sky-night', source: 'qwantani_night_puresky.jpg', hour: 0 },
  { id: 'sky-dawn', source: 'qwantani_dawn_puresky.jpg', hour: 4.5 },
  { id: 'sky-morning', source: 'autumn_field_puresky.jpg', hour: 8 },
  { id: 'sky-day', source: 'kloofendal_48d_partly_cloudy_puresky.jpg', hour: 14 },
  { id: 'sky-evening', source: 'qwantani_sunset_puresky.jpg', hour: 19 },
  { id: 'sky-dusk', source: 'qwantani_dusk_2_puresky.jpg', hour: 21 },
]

function whichFfmpeg() {
  const found = spawnSync('which', ['ffmpeg'], { encoding: 'utf8' })
  if (found.status !== 0 || !found.stdout.trim()) {
    throw new Error('ffmpeg not found on PATH')
  }
  return found.stdout.trim()
}

function runFfmpeg(args, label) {
  const result = spawnSync('ffmpeg', args, { encoding: 'utf8' })
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || '').slice(-2000)
    throw new Error(`${label} failed:\n${err}`)
  }
}

async function fetchMissingSource(filename) {
  const dest = path.join(srcDir, filename)
  if (fs.existsSync(dest)) return
  const url = `${POLYHAVEN_JPG_URL}/${encodeURIComponent(filename)}`
  console.log(`[skyscapes:process] fetching ${filename} from Poly Haven`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.mkdirSync(srcDir, { recursive: true })
  fs.writeFileSync(dest, buf)
  console.log(`[skyscapes:process] saved ${(buf.length / 1e6).toFixed(1)}MB -> ${dest}`)
}

function parseKeepersArg(raw) {
  if (!raw) return DEFAULT_KEEPERS
  return raw.split(',').map((pair, i) => {
    const [id, source] = pair.split('=').map((s) => s.trim())
    if (!id || !source) {
      throw new Error(`Bad --keepers entry: ${pair}`)
    }
    const fallback = DEFAULT_KEEPERS[i]
    return { id, source, hour: fallback?.hour ?? i * 4 }
  })
}

function encodeJpeg(input, output, { width, q }) {
  runFfmpeg(
    [
      '-y',
      '-i',
      input,
      '-vf',
      `scale='min(${width}\\,iw)':-2`,
      '-q:v',
      String(q),
      output,
    ],
    path.basename(output),
  )
}

function encodeUntilUnder(input, output, { width, maxBytes, startQ, maxQ }) {
  let q = startQ
  while (q <= maxQ) {
    encodeJpeg(input, output, { width, q })
    const size = fs.statSync(output).size
    if (size <= maxBytes) return { q, size }
    q += 2
  }
  return { q: maxQ, size: fs.statSync(output).size }
}

function copyArchive(filename) {
  fs.mkdirSync(rawDir, { recursive: true })
  const from = path.join(srcDir, filename)
  const to = path.join(rawDir, filename)
  if (!fs.existsSync(from)) throw new Error(`Missing source ${from}`)
  fs.copyFileSync(from, to)
}

function listLibraryJpgs() {
  return fs
    .readdirSync(srcDir)
    .filter((name) => /\.jpe?g$/i.test(name) && name !== 'contact-sheet.jpg')
    .sort((a, b) => a.localeCompare(b))
}

const rel = (p) => `/images/skyscapes/${path.relative(outDir, p).replaceAll('\\', '/')}`

function processKeeper(input, id) {
  const full = path.join(outDir, `${id}.jpg`)
  const medium = path.join(outDir, `${id}-medium.jpg`)
  const placeholder = path.join(outDir, `${id}-placeholder.jpg`)
  const fullResult = encodeUntilUnder(input, full, {
    width: 4096,
    maxBytes: 1600 * 1024,
    startQ: 2,
    maxQ: 8,
  })
  const mediumResult = encodeUntilUnder(input, medium, {
    width: 2048,
    maxBytes: 700 * 1024,
    startQ: 3,
    maxQ: 10,
  })
  const loResult = encodeUntilUnder(input, placeholder, {
    width: 128,
    maxBytes: 20 * 1024,
    startQ: 12,
    maxQ: 20,
  })
  console.log(
    `  ${id}  full ${(fullResult.size / 1024).toFixed(0)}KB q=${fullResult.q}  ` +
      `med ${(mediumResult.size / 1024).toFixed(0)}KB q=${mediumResult.q}  ` +
      `lo ${(loResult.size / 1024).toFixed(1)}KB q=${loResult.q}`,
  )
  return {
    placeholder: rel(placeholder),
    medium: rel(medium),
    full: rel(full),
    bytes: { full: fullResult.size, medium: mediumResult.size, placeholder: loResult.size },
  }
}

function processLibraryItem(input, stem) {
  const full = path.join(libraryDir, `${stem}.jpg`)
  const placeholder = path.join(libraryDir, `${stem}-placeholder.jpg`)
  const fullResult = encodeUntilUnder(input, full, {
    width: 2048,
    maxBytes: 500 * 1024,
    startQ: 5,
    maxQ: 12,
  })
  const loResult = encodeUntilUnder(input, placeholder, {
    width: 128,
    maxBytes: 20 * 1024,
    startQ: 12,
    maxQ: 20,
  })
  console.log(
    `  ${stem}  full ${(fullResult.size / 1024).toFixed(0)}KB q=${fullResult.q}  ` +
      `lo ${(loResult.size / 1024).toFixed(1)}KB q=${loResult.q}`,
  )
  return {
    placeholder: rel(placeholder),
    full: rel(full),
    bytes: { full: fullResult.size, placeholder: loResult.size },
  }
}

/** Remove slot files from previous keeper sets (e.g. sky-day-dark). */
function removeStaleSlotFiles(keeperIds) {
  if (!fs.existsSync(outDir)) return
  const keep = new Set()
  for (const id of keeperIds) {
    keep.add(`${id}.jpg`)
    keep.add(`${id}-medium.jpg`)
    keep.add(`${id}-placeholder.jpg`)
  }
  for (const name of fs.readdirSync(outDir)) {
    if (!/^sky-.*\.jpe?g$/i.test(name)) continue
    if (keep.has(name)) continue
    fs.rmSync(path.join(outDir, name))
    console.log(`  removed stale ${name}`)
  }
}

async function main() {
  whichFfmpeg()
  const keepersArg = process.argv.find((a) => a.startsWith('--keepers='))?.slice('--keepers='.length)
  const keepers = parseKeepersArg(keepersArg)
  const fetchFlag = process.argv.includes('--fetch')

  if (fetchFlag) {
    for (const keeper of keepers) {
      if (!fs.existsSync(path.join(srcDir, keeper.source))) {
        await fetchMissingSource(keeper.source)
      }
    }
  }

  fs.mkdirSync(outDir, { recursive: true })
  fs.mkdirSync(libraryDir, { recursive: true })

  const library = []
  const jpgs = listLibraryJpgs()
  console.log(`[skyscapes:process] library ${jpgs.length} JPGs`)
  for (const name of jpgs) {
    copyArchive(name)
    const stem = name.replace(/\.[^.]+$/, '')
    const urls = processLibraryItem(path.join(srcDir, name), stem)
    library.push({
      id: stem,
      label: stem,
      source: name,
      placeholder: urls.placeholder,
      full: urls.full,
    })
  }

  const variants = []
  console.log(`[skyscapes:process] ${keepers.length} named keepers`)
  for (const keeper of keepers) {
    const src = path.join(srcDir, keeper.source)
    if (!fs.existsSync(src)) {
      throw new Error(
        `Keeper source missing: ${keeper.source} (rerun with --fetch to download it)`,
      )
    }
    copyArchive(keeper.source)
    const urls = processKeeper(src, keeper.id)
    variants.push({
      id: keeper.id,
      hour: keeper.hour,
      source: keeper.source,
      placeholder: urls.placeholder,
      medium: urls.medium,
      full: urls.full,
    })
  }

  removeStaleSlotFiles(keepers.map((k) => k.id))

  const manifest = { variants, library }
  const manifestPath = path.join(outDir, 'manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`[skyscapes:process] wrote ${manifestPath}`)
  console.log('[skyscapes:process] originals archived to skyscapes/raw/ — not deleted')
}

main()
