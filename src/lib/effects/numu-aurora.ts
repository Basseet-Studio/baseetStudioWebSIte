/**
 * Numu Aurora — ogl WebGL overlay (ported from docs/refrences/aurora-bacgoung.md).
 * Persists across /projects/numu/* navigations; lerps amplitude/blend/brightness/speed per route.
 */
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl'
import { isLowPowerDevice, prefersReducedMotion } from '../scene/device-tier'

// ══════════════════════════════════════════════════════════
// EDIT ME — Numu Aurora knobs (shared defaults)
// ══════════════════════════════════════════════════════════
/** Three hex colors for the aurora gradient (left → mid → right). */
const COLOR_STOPS: [string, string, string] = ['#C77DFF', '#ffffff', '#C77DFF']
const SPEED = 0.9
const BLEND = 0.55
const AMPLITUDE = 0.2
const BRIGHTNESS = 0.5 // multiplies fragment alpha/color intensity
export const FADE_IN_MS = 700
export const FADE_OUT_MS = 320
/** How fast page knobs ease toward the next route (0–1 per frame @60fps-ish). */
const KNOB_LERP = 0.06
/** Legal / privacy pages: brightness reduced. */
const LEGAL_BRIGHTNESS = BRIGHTNESS * 0.35
/**
 * Scroll fade — aurora is full strength at the top, then ease toward transparent.
 * EDIT ME: SCROLL_FADE_START = progress (0–1) before fade begins
 *           SCROLL_FADE_END   = progress (0–1) where aurora is fully gone
 */
const SCROLL_FADE_START = 0.02
const SCROLL_FADE_END = 0.55
const SCROLL_FADE_END_LEGAL = 0.35
// ══════════════════════════════════════════════════════════

export type PageKnobs = {
  amplitude: number
  blend: number
  brightness: number
  speed: number
  /** When true, opacity falls off as the user scrolls down. */
  scrollFade: boolean
  /** Override SCROLL_FADE_END for this route (0–1 page progress). */
  scrollFadeEnd?: number
}

/**
 * EDIT ME — per-route look. Key = path after `/projects/numu/` ('' = landing).
 * Navigating Numu→Numu lerps amplitude / blend / brightness / speed smoothly.
 */
export const PAGE_PRESETS: Record<string, PageKnobs> = {
  '': {
    amplitude: 1,
    blend: BLEND,
    brightness: BRIGHTNESS,
    speed: SPEED,
    scrollFade: true,
  },
  features: {
    amplitude: 0.6,
    blend: 1,
    brightness: 0.4,
    speed: 0.8,
    scrollFade: true,
  },
  download: {
    amplitude: 0.5,
    blend: 1,
    brightness: 0.3,
    speed: 0.4,
    scrollFade: true,
  },
  terms: {
    amplitude: 0.4,
    blend: 1,
    brightness: 0.2,
    speed: 0.6,
    scrollFade: true,
    scrollFadeEnd: SCROLL_FADE_END_LEGAL,
  },
  privacy: {
    amplitude: 0.3,
    blend: 1,
    brightness: 0.2 ,
    speed: 0.5,
    scrollFade: true,
    scrollFadeEnd: SCROLL_FADE_END_LEGAL,
  },
}

const VERT = /* glsl */ `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAG = /* glsl */ `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;
uniform float uBrightness;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ),
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \
  int index = 0;                                            \
  for (int i = 0; i < 2; i++) {                               \
     ColorStop currentColor = colors[i];                    \
     bool isInBetween = currentColor.position <= factor;    \
     index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                         \
  ColorStop currentColor = colors[index];                   \
  ColorStop nextColor = colors[index + 1];                  \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor * uBrightness;

  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha * uBrightness);
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
  amplitude: AMPLITUDE,
  blend: BLEND,
  brightness: BRIGHTNESS,
  speed: SPEED,
  scrollMul: 1,
}

let target = {
  amplitude: AMPLITUDE,
  blend: BLEND,
  brightness: BRIGHTNESS,
  speed: SPEED,
}

let scrollFadeEnabled = false
let scrollFadeEnd = SCROLL_FADE_END

function shouldSkip(): boolean {
  if (typeof window === 'undefined') return true
  if (isLowPowerDevice()) return true
  if (prefersReducedMotion()) return true
  return false
}

function colorStopsToUniforms(stops: [string, string, string]): [number, number, number][] {
  return stops.map((hex) => {
    const c = new Color(hex)
    return [c.r, c.g, c.b]
  })
}

/** Path key after `/projects/numu/`, or null if not a Numu route. */
export function resolveNumuPageKey(pathname: string): string | null {
  const m = pathname.match(/\/projects\/numu(?:\/(.*))?\/?$/)
  if (!m) return null
  const rest = (m[1] || '').replace(/\/+$/, '')
  return rest
}

export function isNumuPath(pathname = typeof location !== 'undefined' ? location.pathname : ''): boolean {
  return resolveNumuPageKey(pathname) !== null
}

export function knobsForPath(pathname: string): PageKnobs {
  const key = resolveNumuPageKey(pathname)
  if (key === null) {
    return PAGE_PRESETS['']
  }
  return PAGE_PRESETS[key] ?? PAGE_PRESETS['']
}

/** 0 at top → 1 at bottom of the document. */
function pageScrollProgress(): number {
  const max = document.documentElement.scrollHeight - window.innerHeight
  if (max <= 1) return 0
  return Math.min(1, Math.max(0, window.scrollY / max))
}

function syncHostOpacity(mul: number): void {
  const host = active?.container
  if (!host) return
  host.style.setProperty('--numu-aurora-scroll-mul', String(mul))
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
 * Boot Aurora into `container` if not already running.
 * Safe to call on every Numu page-load — will NOT remount an existing instance.
 */
export function ensureInit(container: HTMLElement): boolean {
  if (shouldSkip()) return false
  if (active) {
    if (active.container !== container) {
      active.container = container
    }
    return true
  }

  const renderer = new Renderer({
    alpha: true,
    premultipliedAlpha: true,
    antialias: true,
  })
  const gl = renderer.gl
  gl.clearColor(0, 0, 0, 0)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  gl.canvas.style.backgroundColor = 'transparent'

  let program: Program | null = null

  function resize(): void {
    const host = active?.container ?? container
    const width = host.offsetWidth || window.innerWidth
    const height = host.offsetHeight || window.innerHeight
    renderer.setSize(width, height)
    if (program) {
      program.uniforms.uResolution.value = [width, height]
    }
  }

  const geometry = new Triangle(gl)
  if (geometry.attributes.uv) {
    delete geometry.attributes.uv
  }

  const auroraProgram = new Program(gl, {
    vertex: VERT,
    fragment: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uAmplitude: { value: live.amplitude },
      uColorStops: { value: colorStopsToUniforms(COLOR_STOPS) },
      uResolution: { value: [container.offsetWidth || window.innerWidth, container.offsetHeight || window.innerHeight] },
      uBlend: { value: live.blend },
      uBrightness: { value: live.brightness * live.scrollMul },
    },
  })
  program = auroraProgram

  window.addEventListener('resize', resize)
  resize()

  const mesh = new Mesh(gl, { geometry, program: auroraProgram })
  gl.canvas.style.display = 'block'
  gl.canvas.style.width = '100%'
  gl.canvas.style.height = '100%'
  container.appendChild(gl.canvas)

  window.addEventListener('scroll', onScroll, { passive: true })

  let animationFrameId = 0

  function update(t: number): void {
    animationFrameId = requestAnimationFrame(update)
    if (!program) return

    live.amplitude += (target.amplitude - live.amplitude) * KNOB_LERP
    live.blend += (target.blend - live.blend) * KNOB_LERP
    live.brightness += (target.brightness - live.brightness) * KNOB_LERP
    live.speed += (target.speed - live.speed) * KNOB_LERP

    // Match React Bits: time * speed * 0.1 (their time is already scaled)
    program.uniforms.uTime.value = t * 0.01 * live.speed * 0.1
    program.uniforms.uAmplitude.value = live.amplitude
    program.uniforms.uBlend.value = live.blend
    program.uniforms.uBrightness.value = live.brightness * live.scrollMul
    program.uniforms.uColorStops.value = colorStopsToUniforms(COLOR_STOPS)

    renderer.render({ scene: mesh })
  }
  animationFrameId = requestAnimationFrame(update)

  active = {
    container,
    program: auroraProgram,
    destroy() {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
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
  target.amplitude = knobs.amplitude
  target.blend = knobs.blend
  target.brightness = knobs.brightness
  target.speed = knobs.speed
  scrollFadeEnabled = knobs.scrollFade
  scrollFadeEnd = knobs.scrollFadeEnd ?? SCROLL_FADE_END

  if (opts?.snap) {
    live.amplitude = knobs.amplitude
    live.blend = knobs.blend
    live.brightness = knobs.brightness
    live.speed = knobs.speed
  }

  applyScrollMulFromScroll()
}

/** Tear down the active Aurora instance, if any. */
export function destroy(): void {
  if (!active) return
  active.container.classList.remove('is-scrolling')
  active.container.style.removeProperty('--numu-aurora-scroll-mul')
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
