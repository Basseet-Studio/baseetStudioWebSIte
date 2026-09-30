#!/usr/bin/env node
/**
 * Build a labeled thumbnail grid of every file in skyscapes/ (JPG + HDR).
 * Uses ffmpeg (scale + drawtext + tile). Does not resize or rename sources.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const srcDir = path.join(root, 'skyscapes')
const thumbsDir = path.join(srcDir, '.thumbs')
const outFile = path.join(srcDir, 'contact-sheet.jpg')

const FONT_CANDIDATES = [
  '/System/Library/Fonts/Supplemental/Arial.ttf',
  '/System/Library/Fonts/Helvetica.ttc',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
]

const THUMB_W = 320
const THUMB_H = 160
const COLS = 5
const ROWS = 4

function whichFfmpeg() {
  const found = spawnSync('which', ['ffmpeg'], { encoding: 'utf8' })
  if (found.status !== 0 || !found.stdout.trim()) {
    throw new Error('ffmpeg not found on PATH — install it before generating the contact sheet')
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

function escapeDrawtext(text) {
  return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:')
}

function findFont() {
  return FONT_CANDIDATES.find((p) => fs.existsSync(p)) || FONT_CANDIDATES[0]
}

function listSources() {
  return fs
    .readdirSync(srcDir)
    .filter((name) => /\.(jpe?g|hdr)$/i.test(name))
    .filter((name) => name !== 'contact-sheet.jpg')
    .sort((a, b) => a.localeCompare(b))
}

function main() {
  whichFfmpeg()
  fs.mkdirSync(thumbsDir, { recursive: true })

  const sources = listSources()
  if (!sources.length) {
    throw new Error(`No JPG/HDR files in ${srcDir}`)
  }

  const font = findFont()
  console.log(`[skyscapes:sheet] ${sources.length} files → ${THUMB_W}x${THUMB_H} thumbs`)

  const thumbPaths = []
  sources.forEach((name, i) => {
    const stem = name.replace(/\.[^.]+$/, '')
    const thumbPath = path.join(thumbsDir, `${String(i).padStart(2, '0')}.jpg`)
    const vf = [
      `scale=${THUMB_W}:${THUMB_H}:force_original_aspect_ratio=decrease`,
      `pad=${THUMB_W}:${THUMB_H}:(ow-iw)/2:(oh-ih)/2:color=0x111111`,
      'format=yuv420p',
      `drawtext=fontfile='${font}':text='${escapeDrawtext(stem)}':x=8:y=h-th-8:fontsize=12:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=4`,
    ].join(',')
    runFfmpeg(
      ['-y', '-i', path.join(srcDir, name), '-vf', vf, '-frames:v', '1', '-q:v', '6', thumbPath],
      `thumb ${name}`,
    )
    thumbPaths.push(thumbPath)
    console.log(`  ${i + 1}/${sources.length} ${name}`)
  })

  const cells = COLS * ROWS
  while (thumbPaths.length < cells) {
    const padIndex = thumbPaths.length
    const padPath = path.join(thumbsDir, `${String(padIndex).padStart(2, '0')}.jpg`)
    runFfmpeg(
      [
        '-y',
        '-f',
        'lavfi',
        '-i',
        `color=c=0x111111:s=${THUMB_W}x${THUMB_H}:d=0.04`,
        '-vf',
        'format=yuv420p',
        '-frames:v',
        '1',
        padPath,
      ],
      'pad cell',
    )
    thumbPaths.push(padPath)
  }

  runFfmpeg(
    [
      '-y',
      '-framerate',
      '1',
      '-start_number',
      '0',
      '-i',
      path.join(thumbsDir, '%02d.jpg'),
      '-vf',
      `tile=${COLS}x${ROWS}:padding=8:margin=8:color=0x0a0a0a`,
      '-update',
      '1',
      '-frames:v',
      '1',
      '-q:v',
      '3',
      outFile,
    ],
    'tile contact sheet',
  )

  const bytes = fs.statSync(outFile).size
  console.log(`[skyscapes:sheet] wrote ${outFile} (${(bytes / 1024).toFixed(0)} KB)`)
}

main()
