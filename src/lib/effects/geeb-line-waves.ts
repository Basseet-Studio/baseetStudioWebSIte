/**
 * Geeb LineWaves — ogl WebGL overlay (ported from docs/refrences/waves-orange.md).
 * Persists across /projects/geeb/* navigations; lerps rotation/warp/brightness per route.
 */
import { Renderer, Program, Mesh, Triangle } from 'ogl'

// ══════════════════════════════════════════════════════════
// EDIT ME — Geeb LineWaves knobs (shared defaults)
// ══════════════════════════════════════════════════════════
const SPEED = 0.3 // animation speed
const INNER_LINE_COUNT = 32
const OUTER_LINE_COUNT = 36
const WARP_INTENSITY = 1.0 // default wave distortion (page presets override)
const ROTATION_DEG = -45 // default pattern rotation (page presets override)
const EDGE_FADE_WIDTH = 0.0
const COLOR_CYCLE_SPEED = 1.0
const BRIGHTNESS = 0.22 // default; legal docs use LEGAL_BRIGHTNESS below
const COLOR_1 = '#F59E0B' // Geeb amber
const COLOR_2 = '#B45309' // Geeb deep amber
const COLOR_3 = '#FFFBEB' // Geeb cream
const ENABLE_MOUSE = true
const MOUSE_INFLUENCE = 2.0
export const FADE_IN_MS = 700
export const FADE_OUT_MS = 320
/** How fast page knobs ease toward the next route (0–1 per frame @60fps-ish). */
const KNOB_LERP = 0.06
/** Legal / privacy doc pages: brightness reduced by 70%. */
const LEGAL_BRIGHTNESS = BRIGHTNESS * 0.3
/**
 * Scroll fade — waves are full strength at the top, then ease toward transparent.
 * EDIT ME: SCROLL_FADE_START = progress (0–1) before fade begins
 *           SCROLL_FADE_END   = progress (0–1) where waves are fully gone
 * Uses page scroll progress (same idea as cloudscape progress %), not just vh.
 */
const SCROLL_FADE_START = 0.02 // still “at the top”
const SCROLL_FADE_END = 0.55 // mostly gone by mid-page
/** Legal docs fade out sooner / harder. */
const SCROLL_FADE_END_LEGAL = 0.35
// ══════════════════════════════════════════════════════════

export type PageKnobs = {
  rotationDeg: number
  warpIntensity: number
  brightness: number
  /** When true, opacity falls off as the user scrolls down. */
  scrollFade: boolean
  /** Override SCROLL_FADE_END for this route (0–1 page progress). */
  scrollFadeEnd?: number
}

/**
 * EDIT ME — per-route look. Key = path after `/projects/geeb/` ('' = landing).
 * Navigating Geeb→Geeb lerps rotation / warp / brightness smoothly to these.
 * scrollFade is on everywhere so leaving the top softens the waves.
 */
export const PAGE_PRESETS: Record<string, PageKnobs> = {
  '': { rotationDeg: -45, warpIntensity: 1.0, brightness: BRIGHTNESS, scrollFade: true },
  features: { rotationDeg: -90, warpIntensity: 1.25, brightness: BRIGHTNESS, scrollFade: true },
  download: { rotationDeg: -120, warpIntensity: 0.02, brightness: BRIGHTNESS, scrollFade: true },
  pro: { rotationDeg: -18, warpIntensity: 1.15, brightness: BRIGHTNESS, scrollFade: true },
  faq: { rotationDeg: -85, warpIntensity: 0.95, brightness: BRIGHTNESS, scrollFade: true },
  terms: { rotationDeg: -62, warpIntensity: 2.75, brightness: BRIGHTNESS, scrollFade: true },
  privacy: { rotationDeg: -11, warpIntensity: 0.7, brightness: BRIGHTNESS, scrollFade: true },
  'terms/customers': {
    rotationDeg: -55,
    warpIntensity: 0.55,
    brightness: LEGAL_BRIGHTNESS,
    scrollFade: true,
    scrollFadeEnd: SCROLL_FADE_END_LEGAL,
  },
  'terms/vendors': {
    rotationDeg: -48,
    warpIntensity: 0.6,
    brightness: LEGAL_BRIGHTNESS,
    scrollFade: true,
    scrollFadeEnd: SCROLL_FADE_END_LEGAL,
  },
  'privacy/customers': {
    rotationDeg: -52,
    warpIntensity: 0.5,
    brightness: LEGAL_BRIGHTNESS,
    scrollFade: true,
    scrollFadeEnd: SCROLL_FADE_END_LEGAL,
  },
  'privacy/vendors': {
    rotationDeg: -60,
    warpIntensity: 0.65,
    brightness: LEGAL_BRIGHTNESS,
    scrollFade: true,
    scrollFadeEnd: SCROLL_FADE_END_LEGAL,
  },
}

function hexToVec3(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}

const vertexShader = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`

const fragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uInnerLines;
uniform float uOuterLines;
uniform float uWarpIntensity;
uniform float uRotation;
uniform float uEdgeFadeWidth;
uniform float uColorCycleSpeed;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform bool uEnableMouse;

#define HALF_PI 1.5707963

float hashF(float n) {
  return fract(sin(n * 127.1) * 43758.5453123);
}

float smoothNoise(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hashF(i), hashF(i + 1.0), u);
}

float displaceA(float coord, float t) {
  float result = sin(coord * 2.123) * 0.2;
  result += sin(coord * 3.234 + t * 4.345) * 0.1;
  result += sin(coord * 0.589 + t * 0.934) * 0.5;
  return result;
}

float displaceB(float coord, float t) {
  float result = sin(coord * 1.345) * 0.3;
  result += sin(coord * 2.734 + t * 3.345) * 0.2;
  result += sin(coord * 0.189 + t * 0.934) * 0.3;
  return result;
}

vec2 rotate2D(vec2 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

void main() {
  vec2 coords = gl_FragCoord.xy / uResolution.xy;
  coords = coords * 2.0 - 1.0;
  coords = rotate2D(coords, uRotation);

  float halfT = uTime * uSpeed * 0.5;
  float fullT = uTime * uSpeed;

  float mouseWarp = 0.0;
  if (uEnableMouse) {
    vec2 mPos = rotate2D(uMouse * 2.0 - 1.0, uRotation);
    float mDist = length(coords - mPos);
    mouseWarp = uMouseInfluence * exp(-mDist * mDist * 4.0);
  }

  float warpAx = coords.x + displaceA(coords.y, halfT) * uWarpIntensity + mouseWarp;
  float warpAy = coords.y - displaceA(coords.x * cos(fullT) * 1.235, halfT) * uWarpIntensity;
  float warpBx = coords.x + displaceB(coords.y, halfT) * uWarpIntensity + mouseWarp;
  float warpBy = coords.y - displaceB(coords.x * sin(fullT) * 1.235, halfT) * uWarpIntensity;

  vec2 fieldA = vec2(warpAx, warpAy);
  vec2 fieldB = vec2(warpBx, warpBy);
  vec2 blended = mix(fieldA, fieldB, mix(fieldA, fieldB, 0.5));

  float fadeTop = smoothstep(uEdgeFadeWidth, uEdgeFadeWidth + 0.4, blended.y);
  float fadeBottom = smoothstep(-uEdgeFadeWidth, -(uEdgeFadeWidth + 0.4), blended.y);
  float vMask = 1.0 - max(fadeTop, fadeBottom);

  float tileCount = mix(uOuterLines, uInnerLines, vMask);
  float scaledY = blended.y * tileCount;
  float nY = smoothNoise(abs(scaledY));

  float ridge = pow(
    step(abs(nY - blended.x) * 2.0, HALF_PI) * cos(2.0 * (nY - blended.x)),
    5.0
  );

  float lines = 0.0;
  for (float i = 1.0; i < 3.0; i += 1.0) {
    lines += pow(max(fract(scaledY), fract(-scaledY)), i * 2.0);
  }

  float pattern = vMask * lines;

  float cycleT = fullT * uColorCycleSpeed;
  float rChannel = (pattern + lines * ridge) * (cos(blended.y + cycleT * 0.234) * 0.5 + 1.0);
  float gChannel = (pattern + vMask * ridge) * (sin(blended.x + cycleT * 1.745) * 0.5 + 1.0);
  float bChannel = (pattern + lines * ridge) * (cos(blended.x + cycleT * 0.534) * 0.5 + 1.0);

  vec3 col = (rChannel * uColor1 + gChannel * uColor2 + bChannel * uColor3) * uBrightness;
  float alpha = clamp(length(col), 0.0, 1.0);

  gl_FragColor = vec4(col, alpha);
}
`

type Runtime = {
  container: HTMLElement
  program: Program
  destroy: () => void
}

let active: Runtime | null = null

/** Live knobs (lerped each frame toward targets). */
let live = {
  rotationDeg: ROTATION_DEG,
  warpIntensity: WARP_INTENSITY,
  brightness: BRIGHTNESS,
  scrollMul: 1,
}

let target = {
  rotationDeg: ROTATION_DEG,
  warpIntensity: WARP_INTENSITY,
  brightness: BRIGHTNESS,
}

let scrollFadeEnabled = false
let scrollFadeEnd = SCROLL_FADE_END

function matchesMobile(): boolean {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 600
  )
}

function shouldSkip(): boolean {
  if (typeof window === 'undefined') return true
  if (matchesMobile()) return true
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
  return false
}

/** Path key after `/projects/geeb/`, or null if not a Geeb route. */
export function resolveGeebPageKey(pathname: string): string | null {
  const m = pathname.match(/\/projects\/geeb(?:\/(.*))?\/?$/)
  if (!m) return null
  const rest = (m[1] || '').replace(/\/+$/, '')
  return rest
}

export function isGeebPath(pathname = typeof location !== 'undefined' ? location.pathname : ''): boolean {
  return resolveGeebPageKey(pathname) !== null
}

export function knobsForPath(pathname: string): PageKnobs {
  const key = resolveGeebPageKey(pathname)
  if (key === null) {
    return PAGE_PRESETS['']
  }
  return PAGE_PRESETS[key] ?? PAGE_PRESETS['']
}

/** 0 at top → 1 at bottom of the document (same idea as cloudscape progress %). */
function pageScrollProgress(): number {
  const max = document.documentElement.scrollHeight - window.innerHeight
  if (max <= 1) return 0
  return Math.min(1, Math.max(0, window.scrollY / max))
}

function syncHostOpacity(mul: number): void {
  const host = active?.container
  if (!host) return
  host.style.setProperty('--geeb-waves-scroll-mul', String(mul))
}

function applyScrollMulFromScroll(): void {
  if (!scrollFadeEnabled) {
    live.scrollMul = 1
    syncHostOpacity(1)
    return
  }
  const progress = pageScrollProgress()
  const start = SCROLL_FADE_START
  const end = Math.max(start + 0.05, scrollFadeEnd)
  let t = 0
  if (progress <= start) t = 0
  else if (progress >= end) t = 1
  else t = (progress - start) / (end - start)
  // Smoothstep — soft leave from the top, almost gone by scrollFadeEnd.
  const eased = t * t * (3 - 2 * t)
  live.scrollMul = 1 - eased
  syncHostOpacity(live.scrollMul)
}

let scrollIdleTimer: ReturnType<typeof setTimeout> | null = null

function onScroll(): void {
  const host = active?.container
  if (host) {
    host.classList.add('is-scrolling')
    if (scrollIdleTimer != null) clearTimeout(scrollIdleTimer)
    scrollIdleTimer = setTimeout(() => {
      host.classList.remove('is-scrolling')
      scrollIdleTimer = null
    }, 120)
  }
  applyScrollMulFromScroll()
}

/**
 * Boot LineWaves into `container` if not already running.
 * Safe to call on every Geeb page-load — will NOT remount an existing instance.
 */
export function ensureInit(container: HTMLElement): boolean {
  if (shouldSkip()) return false
  if (active) {
    // Persist may move the host; keep canvas parented to the live host.
    if (active.container !== container) {
      active.container = container
    }
    return true
  }

  const renderer = new Renderer({ alpha: true, premultipliedAlpha: false })
  const gl = renderer.gl
  gl.clearColor(0, 0, 0, 0)

  let currentMouse = [0.5, 0.5]
  let targetMouse = [0.5, 0.5]
  let program: Program | null = null

  function handlePointerMove(e: PointerEvent): void {
    const rect = container.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    targetMouse = [
      (e.clientX - rect.left) / rect.width,
      1.0 - (e.clientY - rect.top) / rect.height,
    ]
  }

  function handlePointerLeave(): void {
    targetMouse = [0.5, 0.5]
  }

  function resize(): void {
    const host = active?.container ?? container
    const w = host.offsetWidth || window.innerWidth
    const h = host.offsetHeight || window.innerHeight
    renderer.setSize(w, h)
    if (program) {
      program.uniforms.uResolution.value = [
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height,
      ]
    }
  }

  const geometry = new Triangle(gl)
  const waveProgram = new Program(gl, {
    vertex: vertexShader,
    fragment: fragmentShader,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uResolution: {
        value: [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height],
      },
      uSpeed: { value: SPEED },
      uInnerLines: { value: INNER_LINE_COUNT },
      uOuterLines: { value: OUTER_LINE_COUNT },
      uWarpIntensity: { value: live.warpIntensity },
      uRotation: { value: (live.rotationDeg * Math.PI) / 180 },
      uEdgeFadeWidth: { value: EDGE_FADE_WIDTH },
      uColorCycleSpeed: { value: COLOR_CYCLE_SPEED },
      uBrightness: { value: live.brightness * live.scrollMul },
      uColor1: { value: hexToVec3(COLOR_1) },
      uColor2: { value: hexToVec3(COLOR_2) },
      uColor3: { value: hexToVec3(COLOR_3) },
      uMouse: { value: new Float32Array([0.5, 0.5]) },
      uMouseInfluence: { value: MOUSE_INFLUENCE },
      uEnableMouse: { value: ENABLE_MOUSE },
    },
  })
  program = waveProgram

  window.addEventListener('resize', resize)
  resize()

  const mesh = new Mesh(gl, { geometry, program: waveProgram })
  gl.canvas.style.display = 'block'
  gl.canvas.style.width = '100%'
  gl.canvas.style.height = '100%'
  container.appendChild(gl.canvas)

  if (ENABLE_MOUSE) {
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerleave', handlePointerLeave)
  }

  window.addEventListener('scroll', onScroll, { passive: true })

  let animationFrameId = 0

  function update(time: number): void {
    animationFrameId = requestAnimationFrame(update)
    if (!program) return

    // Smooth page-to-page knobs
    live.rotationDeg += (target.rotationDeg - live.rotationDeg) * KNOB_LERP
    live.warpIntensity += (target.warpIntensity - live.warpIntensity) * KNOB_LERP
    live.brightness += (target.brightness - live.brightness) * KNOB_LERP

    program.uniforms.uTime.value = time * 0.001
    program.uniforms.uRotation.value = (live.rotationDeg * Math.PI) / 180
    program.uniforms.uWarpIntensity.value = live.warpIntensity
    program.uniforms.uBrightness.value = live.brightness * live.scrollMul

    if (ENABLE_MOUSE) {
      currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0])
      currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1])
      program.uniforms.uMouse.value[0] = currentMouse[0]
      program.uniforms.uMouse.value[1] = currentMouse[1]
    } else {
      program.uniforms.uMouse.value[0] = 0.5
      program.uniforms.uMouse.value[1] = 0.5
    }

    renderer.render({ scene: mesh })
  }
  animationFrameId = requestAnimationFrame(update)

  active = {
    container,
    program: waveProgram,
    destroy() {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      if (ENABLE_MOUSE) {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerleave', handlePointerLeave)
      }
      if (gl.canvas.parentNode) {
        gl.canvas.parentNode.removeChild(gl.canvas)
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }

  return true
}

/** Point live knobs at the preset for this path (lerps in the render loop). */
export function syncToPath(pathname: string, opts?: { snap?: boolean }): void {
  const knobs = knobsForPath(pathname)
  target.rotationDeg = knobs.rotationDeg
  target.warpIntensity = knobs.warpIntensity
  target.brightness = knobs.brightness
  scrollFadeEnabled = knobs.scrollFade
  scrollFadeEnd = knobs.scrollFadeEnd ?? SCROLL_FADE_END

  if (opts?.snap) {
    live.rotationDeg = knobs.rotationDeg
    live.warpIntensity = knobs.warpIntensity
    live.brightness = knobs.brightness
  }

  applyScrollMulFromScroll()
}

/** Tear down the active LineWaves instance, if any. */
export function destroy(): void {
  if (!active) return
  active.container.classList.remove('is-scrolling')
  active.container.style.removeProperty('--geeb-waves-scroll-mul')
  active.destroy()
  active = null
  scrollFadeEnabled = false
  scrollFadeEnd = SCROLL_FADE_END
  live.scrollMul = 1
  if (scrollIdleTimer != null) {
    clearTimeout(scrollIdleTimer)
    scrollIdleTimer = null
  }
}

export function isActive(): boolean {
  return active !== null
}

/** @deprecated Prefer ensureInit — kept for call-site clarity. */
export function init(container: HTMLElement): void {
  ensureInit(container)
}
