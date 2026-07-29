/**
 * Matrix hero effect — two stacked canvases, no libraries.
 * Back layer  = DotField  (subtle bulge field, reacts softly to the cursor)
 * Front layer = ShapeGrid (moving square grid, hover-highlight)
 *
 * Ported from the React Bits <DotField /> and <ShapeGrid /> components into
 * plain canvas 2D so it can be mounted from an .astro <script> tag the same
 * way lib/effects/geeb-linewaves.ts mounts into Geeb pages.
 *
 * Usage in matrix.astro:
 *   <script>
 *     import { ensureInit, destroy } from '../../lib/effects/matrix-effects'
 *     const root = document.getElementById('matrix-fx')
 *     if (root) ensureInit(root)
 *     document.addEventListener('astro:before-swap', destroy, { once: true })
 *   </script>
 */

// ══════════════════════════════════════════════════════════
// EDIT ME — DotField (back layer, keep this subtle)
// ══════════════════════════════════════════════════════════
const DOT_RADIUS = 1.3 // px, size of each dot
const DOT_SPACING = 26 // px, gap between dots — bigger = sparser, more "subtle"
const DOT_CURSOR_RADIUS = 220 // px, how far the cursor reaches
const DOT_BULGE_STRENGTH = 18 // px, how far dots get pushed — keep low for subtlety
const DOT_EASE = 0.12 // 0–1, how quickly dots settle back (lower = softer/slower)
const DOT_BASE_ALPHA = 0.16 // resting opacity of the dot field — this is the main "subtlety" dial
const DOT_HOVER_ALPHA = 0.32 // opacity near the cursor

// ══════════════════════════════════════════════════════════
// EDIT ME — ShapeGrid (front layer, square grid on top)
// ══════════════════════════════════════════════════════════
const GRID_SQUARE_SIZE = 42 // px, size of each grid cell
const GRID_SPEED = 0.35 // px/frame drift speed
const GRID_DIRECTION: 'up' | 'down' | 'left' | 'right' | 'diagonal' = 'diagonal'
const GRID_BORDER_ALPHA = 0.1 // grid line opacity — this is the main visibility dial
const GRID_HOVER_FILL_ALPHA = 0.14 // fill opacity of the hovered cell
const GRID_HOVER_TRAIL = 6 // how many previously-hovered cells keep a fading fill (0 = off)

// ══════════════════════════════════════════════════════════
// Colors — pulled from the project's CSS vars at init time, NOT hardcoded,
// so matrix.json (`color` / gradient) stays the single source of truth.
// Falls back to a cyan if the vars aren't found for some reason.
// ══════════════════════════════════════════════════════════
function readProjectColor(container: HTMLElement): string {
  const v = getComputedStyle(container).getPropertyValue('--project-color').trim()
  return v || '#06B6D4'
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const num = parseInt(full, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

function rgba([r, g, b]: [number, number, number], a: number): string {
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

// ══════════════════════════════════════════════════════════
// Shared helpers
// ══════════════════════════════════════════════════════════
function shouldSkip(): boolean {
  if (typeof window === 'undefined') return true
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
  if (window.innerWidth < 560) return true // skip on small phones — perf + noise
  return false
}

type Dot = { ax: number; ay: number; sx: number; sy: number }

type Runtime = {
  container: HTMLElement
  dotCanvas: HTMLCanvasElement
  gridCanvas: HTMLCanvasElement
  destroy: () => void
}

let active: Runtime | null = null

export function isActive(): boolean {
  return active !== null
}

export function ensureInit(container: HTMLElement): boolean {
  if (shouldSkip()) return false
  if (active) return true // already mounted, don't double-init

  const rgb = hexToRgb(readProjectColor(container))

  // ---- shared mouse state (container-local coords) ----
  const mouse = { x: -9999, y: -9999 }
  function onPointerMove(e: PointerEvent) {
    const rect = container.getBoundingClientRect()
    mouse.x = e.clientX - rect.left
    mouse.y = e.clientY - rect.top
  }
  function onPointerLeave() {
    mouse.x = -9999
    mouse.y = -9999
  }

  // ── layer 1: DotField (back) ─────────────────────────────
  const dotCanvas = document.createElement('canvas')
  dotCanvas.className = 'matrix-fx-canvas matrix-fx-canvas--dots'
  container.appendChild(dotCanvas)
  const dctx = dotCanvas.getContext('2d')!

  let dots: Dot[] = []
  function buildDots(w: number, h: number) {
    const step = DOT_RADIUS + DOT_SPACING
    const cols = Math.floor(w / step)
    const rows = Math.floor(h / step)
    const padX = (w % step) / 2
    const padY = (h % step) / 2
    const out: Dot[] = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const ax = padX + col * step + step / 2
        const ay = padY + row * step + step / 2
        out.push({ ax, ay, sx: ax, sy: ay })
      }
    }
    dots = out
  }

  function drawDots(w: number, h: number) {
    dctx.clearRect(0, 0, w, h)
    const crSq = DOT_CURSOR_RADIUS * DOT_CURSOR_RADIUS
    for (const d of dots) {
      const dx = mouse.x - d.ax
      const dy = mouse.y - d.ay
      const distSq = dx * dx + dy * dy
      let alpha = DOT_BASE_ALPHA
      if (distSq < crSq) {
        const dist = Math.sqrt(distSq)
        const t = 1 - dist / DOT_CURSOR_RADIUS
        const push = t * t * DOT_BULGE_STRENGTH
        const angle = Math.atan2(dy, dx)
        d.sx += (d.ax - Math.cos(angle) * push - d.sx) * DOT_EASE
        d.sy += (d.ay - Math.sin(angle) * push - d.sy) * DOT_EASE
        alpha = DOT_BASE_ALPHA + (DOT_HOVER_ALPHA - DOT_BASE_ALPHA) * t
      } else {
        d.sx += (d.ax - d.sx) * DOT_EASE
        d.sy += (d.ay - d.sy) * DOT_EASE
      }
      dctx.beginPath()
      dctx.fillStyle = rgba(rgb, alpha)
      dctx.arc(d.sx, d.sy, DOT_RADIUS, 0, Math.PI * 2)
      dctx.fill()
    }
  }

  // ── layer 2: ShapeGrid (front, square + moving) ──────────
  const gridCanvas = document.createElement('canvas')
  gridCanvas.className = 'matrix-fx-canvas matrix-fx-canvas--grid'
  container.appendChild(gridCanvas)
  const gctx = gridCanvas.getContext('2d')!

  const gridOffset = { x: 0, y: 0 }
  let hovered: { x: number; y: number } | null = null
  const trail: { x: number; y: number }[] = []
  const cellAlpha = new Map<string, number>()

  function drawGrid(w: number, h: number) {
    gctx.clearRect(0, 0, w, h)
    const step = GRID_SQUARE_SIZE
    const offsetX = ((gridOffset.x % step) + step) % step
    const offsetY = ((gridOffset.y % step) + step) % step
    const cols = Math.ceil(w / step) + 3
    const rows = Math.ceil(h / step) + 3

    // targets for hover fill (current cell + fading trail)
    const targets = new Map<string, number>()
    if (hovered) targets.set(`${hovered.x},${hovered.y}`, 1)
    if (GRID_HOVER_TRAIL > 0) {
      trail.forEach((t, i) => {
        const key = `${t.x},${t.y}`
        if (!targets.has(key)) targets.set(key, (trail.length - i) / (trail.length + 1))
      })
    }
    for (const key of targets.keys()) {
      if (!cellAlpha.has(key)) cellAlpha.set(key, 0)
    }
    for (const [key, val] of cellAlpha) {
      const t = targets.get(key) || 0
      const next = val + (t - val) * 0.15
      if (next < 0.005) cellAlpha.delete(key)
      else cellAlpha.set(key, next)
    }

    for (let col = -2; col < cols; col++) {
      for (let row = -2; row < rows; row++) {
        const sx = col * step + offsetX
        const sy = row * step + offsetY
        const key = `${col},${row}`
        const alpha = cellAlpha.get(key)
        if (alpha) {
          gctx.fillStyle = rgba(rgb, GRID_HOVER_FILL_ALPHA * alpha)
          gctx.fillRect(sx, sy, step, step)
        }
        gctx.strokeStyle = rgba(rgb, GRID_BORDER_ALPHA)
        gctx.strokeRect(sx, sy, step, step)
      }
    }
  }

  function updateGridHover() {
    const step = GRID_SQUARE_SIZE
    if (mouse.x < 0) {
      hovered = null
      return
    }
    const offsetX = ((gridOffset.x % step) + step) % step
    const offsetY = ((gridOffset.y % step) + step) % step
    const col = Math.floor((mouse.x - offsetX) / step)
    const row = Math.floor((mouse.y - offsetY) / step)
    if (!hovered || hovered.x !== col || hovered.y !== row) {
      if (hovered && GRID_HOVER_TRAIL > 0) {
        trail.unshift({ ...hovered })
        trail.length = Math.min(trail.length, GRID_HOVER_TRAIL)
      }
      hovered = { x: col, y: row }
    }
  }

  function stepGridOffset() {
    switch (GRID_DIRECTION) {
      case 'right': gridOffset.x -= GRID_SPEED; break
      case 'left': gridOffset.x += GRID_SPEED; break
      case 'up': gridOffset.y += GRID_SPEED; break
      case 'down': gridOffset.y -= GRID_SPEED; break
      case 'diagonal': gridOffset.x -= GRID_SPEED; gridOffset.y -= GRID_SPEED; break
    }
  }

  // ── shared resize / raf loop ──────────────────────────────
  let w = 0
  let h = 0
  function resize() {
    w = container.offsetWidth
    h = container.offsetHeight
    for (const c of [dotCanvas, gridCanvas]) {
      c.width = w
      c.height = h
    }
    buildDots(w, h)
  }

  let rafId = 0
  function tick() {
    rafId = requestAnimationFrame(tick)
    drawDots(w, h)
    stepGridOffset()
    updateGridHover()
    drawGrid(w, h)
  }

  window.addEventListener('resize', resize)
  container.addEventListener('pointermove', onPointerMove)
  container.addEventListener('pointerleave', onPointerLeave)
  resize()
  rafId = requestAnimationFrame(tick)

  active = {
    container,
    dotCanvas,
    gridCanvas,
    destroy() {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerleave', onPointerLeave)
      dotCanvas.remove()
      gridCanvas.remove()
    },
  }

  return true
}

export function destroy(): void {
  if (!active) return
  active.destroy()
  active = null
}