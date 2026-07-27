/**
 * MoneyBox DarkVeil — ogl WebGL overlay (ported from docs/refrences/dark-viel.md).
 * Persists across /projects/moneybox/* navigations; lerps warpAmount / hue / speed per route.
 */
import { Renderer, Program, Mesh, Triangle, Vec2 } from 'ogl'

// ══════════════════════════════════════════════════════════
// EDIT ME — MoneyBox DarkVeil knobs (shared defaults)
// ══════════════════════════════════════════════════════════
/** Hue shift toward MoneyBox green (#16A34A). */
const HUE_SHIFT = 128
const NOISE_INTENSITY = 0.12
const SCANLINE_INTENSITY = 0.08
const SCANLINE_FREQUENCY = 3.2
const SPEED = 1.2
const WARP_AMOUNT = 1.5
/** Overall host opacity multiplier (1 = full strength at top of page). */
const BRIGHTNESS = 0.5
const RESOLUTION_SCALE = 1
export const FADE_IN_MS = 700
export const FADE_OUT_MS = 320
/** How fast page knobs ease toward the next route (0–1 per frame @60fps-ish). */
const KNOB_LERP = 0.06
/** Legal / privacy pages: opacity reduced. */
const LEGAL_BRIGHTNESS = BRIGHTNESS * 0.35
/**
 * Scroll fade — veil is full strength at the top, gone by mid-page (~50%).
 * EDIT ME: SCROLL_FADE_START = progress (0–1) before fade begins
 *           SCROLL_FADE_END   = progress (0–1) where veil is fully gone
 */
const SCROLL_FADE_START = 0
const SCROLL_FADE_END = 0.5
// ══════════════════════════════════════════════════════════

export type PageKnobs = {
  warpAmount: number
  hueShift: number
  speed: number
  brightness: number
  noiseIntensity: number
  scanlineIntensity: number
  scanlineFrequency: number
  /** When true, opacity falls off as the user scrolls down. */
  scrollFade: boolean
  /** Override SCROLL_FADE_END for this route (0–1 page progress). */
  scrollFadeEnd?: number
}

/**
 * EDIT ME — per-route look. Key = path after `/projects/moneybox/` ('' = landing).
 * Navigating MoneyBox→MoneyBox lerps warpAmount (and light hue/speed) smoothly.
 */
export const PAGE_PRESETS: Record<string, PageKnobs> = {
  '': {
    warpAmount: WARP_AMOUNT,
    hueShift: HUE_SHIFT,
    speed: SPEED,
    brightness: BRIGHTNESS,
    noiseIntensity: NOISE_INTENSITY,
    scanlineIntensity: SCANLINE_INTENSITY,
    scanlineFrequency: SCANLINE_FREQUENCY,
    scrollFade: true,
    scrollFadeEnd: SCROLL_FADE_END,
  },
  features: {
    warpAmount: 2.2,
    hueShift: HUE_SHIFT + 8,
    speed: 1.0,
    brightness: BRIGHTNESS,
    noiseIntensity: NOISE_INTENSITY,
    scanlineIntensity: SCANLINE_INTENSITY,
    scanlineFrequency: SCANLINE_FREQUENCY,
    scrollFade: true,
    scrollFadeEnd: SCROLL_FADE_END,
  },
  download: {
    warpAmount: 0.8,
    hueShift: HUE_SHIFT - 6,
    speed: 0.9,
    brightness: BRIGHTNESS * 0.9,
    noiseIntensity: NOISE_INTENSITY * 0.85,
    scanlineIntensity: SCANLINE_INTENSITY,
    scanlineFrequency: SCANLINE_FREQUENCY,
    scrollFade: true,
    scrollFadeEnd: SCROLL_FADE_END,
  },
  terms: {
    warpAmount: 1.1,
    hueShift: HUE_SHIFT,
    speed: 0.7,
    brightness: LEGAL_BRIGHTNESS,
    noiseIntensity: NOISE_INTENSITY * 0.7,
    scanlineIntensity: SCANLINE_INTENSITY * 0.6,
    scanlineFrequency: SCANLINE_FREQUENCY,
    scrollFade: true,
    scrollFadeEnd: SCROLL_FADE_END,
  },
  privacy: {
    warpAmount: 0.9,
    hueShift: HUE_SHIFT - 4,
    speed: 0.65,
    brightness: LEGAL_BRIGHTNESS,
    noiseIntensity: NOISE_INTENSITY * 0.7,
    scanlineIntensity: SCANLINE_INTENSITY * 0.6,
    scanlineFrequency: SCANLINE_FREQUENCY,
    scrollFade: true,
    scrollFadeEnd: SCROLL_FADE_END,
  },
}

const vertex = /* glsl */ `
attribute vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}
`

const fragment = /* glsl */ `
#ifdef GL_ES
precision lowp float;
#endif
uniform vec2 uResolution;
uniform float uTime;
uniform float uHueShift;
uniform float uNoise;
uniform float uScan;
uniform float uScanFreq;
uniform float uWarp;
#define iTime uTime
#define iResolution uResolution

vec4 buf[8];
float rand(vec2 c){return fract(sin(dot(c,vec2(12.9898,78.233)))*43758.5453);}

mat3 rgb2yiq=mat3(0.299,0.587,0.114,0.596,-0.274,-0.322,0.211,-0.523,0.312);
mat3 yiq2rgb=mat3(1.0,0.956,0.621,1.0,-0.272,-0.647,1.0,-1.106,1.703);

vec3 hueShiftRGB(vec3 col,float deg){
    vec3 yiq=rgb2yiq*col;
    float rad=radians(deg);
    float cosh=cos(rad),sinh=sin(rad);
    vec3 yiqShift=vec3(yiq.x,yiq.y*cosh-yiq.z*sinh,yiq.y*sinh+yiq.z*cosh);
    return clamp(yiq2rgb*yiqShift,0.0,1.0);
}

vec4 sigmoid(vec4 x){return 1./(1.+exp(-x));}

vec4 cppn_fn(vec2 coordinate,float in0,float in1,float in2){
    buf[6]=vec4(coordinate.x,coordinate.y,0.3948333106474662+in0,0.36+in1);
    buf[7]=vec4(0.14+in2,sqrt(coordinate.x*coordinate.x+coordinate.y*coordinate.y),0.,0.);
    buf[0]=mat4(vec4(6.5404263,-3.6126034,0.7590882,-1.13613),vec4(2.4582713,3.1660357,1.2219609,0.06276096),vec4(-5.478085,-6.159632,1.8701609,-4.7742867),vec4(6.039214,-5.542865,-0.90925294,3.251348))*buf[6]+mat4(vec4(0.8473259,-5.722911,3.975766,1.6522468),vec4(-0.24321538,0.5839259,-1.7661959,-5.350116),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(0.21808943,1.1243913,-1.7969975,5.0294676);
    buf[1]=mat4(vec4(-3.3522482,-6.0612736,0.55641043,-4.4719114),vec4(0.8631464,1.7432913,5.643898,1.6106541),vec4(2.4941394,-3.5012043,1.7184316,6.357333),vec4(3.310376,8.209261,1.1355612,-1.165539))*buf[6]+mat4(vec4(5.24046,-13.034365,0.009859298,15.870829),vec4(2.987511,3.129433,-0.89023495,-1.6822904),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(-5.9457836,-6.573602,-0.8812491,1.5436668);
    buf[0]=sigmoid(buf[0]);buf[1]=sigmoid(buf[1]);
    buf[2]=mat4(vec4(-15.219568,8.095543,-2.429353,-1.9381982),vec4(-5.951362,4.3115187,2.6393783,1.274315),vec4(-7.3145227,6.7297835,5.2473326,5.9411426),vec4(5.0796127,8.979051,-1.7278991,-1.158976))*buf[6]+mat4(vec4(-11.967154,-11.608155,6.1486754,11.237008),vec4(2.124141,-6.263192,-1.7050359,-0.7021966),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(-4.17164,-3.2281182,-4.576417,-3.6401186);
    buf[3]=mat4(vec4(3.1832156,-13.738922,1.879223,3.233465),vec4(0.64300746,12.768129,1.9141049,0.50990224),vec4(-0.049295485,4.4807224,1.4733979,1.801449),vec4(5.0039253,13.000481,3.3991797,-4.5561905))*buf[6]+mat4(vec4(-0.1285731,7.720628,-3.1425676,4.742367),vec4(0.6393625,3.714393,-0.8108378,-0.39174938),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(-1.1811101,-21.621881,0.7851888,1.2329718);
    buf[2]=sigmoid(buf[2]);buf[3]=sigmoid(buf[3]);
    buf[4]=mat4(vec4(5.214916,-7.183024,2.7228765,2.6592617),vec4(-5.601878,-25.3591,4.067988,0.4602802),vec4(-10.57759,24.286327,21.102104,37.546658),vec4(4.3024497,-1.9625226,2.3458803,-1.372816))*buf[0]+mat4(vec4(-17.6526,-10.507558,2.2587414,12.462782),vec4(6.265566,-502.75443,-12.642513,0.9112289),vec4(-10.983244,20.741234,-9.701768,-0.7635988),vec4(5.383626,1.4819539,-4.1911616,-4.8444734))*buf[1]+mat4(vec4(12.785233,-16.345072,-0.39901125,1.7955981),vec4(-30.48365,-1.8345358,1.4542528,-1.1118771),vec4(19.872723,-7.337935,-42.941723,-98.52709),vec4(8.337645,-2.7312303,-2.2927687,-36.142323))*buf[2]+mat4(vec4(-16.298317,3.5471997,-0.44300047,-9.444417),vec4(57.5077,-35.609753,16.163465,-4.1534753),vec4(-0.07470326,-3.8656476,-7.0901804,3.1523974),vec4(-12.559385,-7.077619,1.490437,-0.8211543))*buf[3]+vec4(-7.67914,15.927437,1.3207729,-1.6686112);
    buf[5]=mat4(vec4(-1.4109162,-0.372762,-3.770383,-21.367174),vec4(-6.2103205,-9.35908,0.92529047,8.82561),vec4(11.460242,-22.348068,13.625772,-18.693201),vec4(-0.3429052,-3.9905605,-2.4626114,-0.45033523))*buf[0]+mat4(vec4(7.3481627,-4.3661838,-6.3037653,-3.868115),vec4(1.5462853,6.5488915,1.9701879,-0.58291394),vec4(6.5858274,-2.2180402,3.7127688,-1.3730392),vec4(-5.7973905,10.134961,-2.3395722,-5.965605))*buf[1]+mat4(vec4(-2.5132585,-6.6685553,-1.4029363,-0.16285264),vec4(-0.37908727,0.53738135,4.389061,-1.3024765),vec4(-0.70647055,2.0111287,-5.1659346,-3.728635),vec4(-13.562562,10.487719,-0.9173751,-2.6487076))*buf[2]+mat4(vec4(-8.645013,6.5546675,-6.3944063,-5.5933375),vec4(-0.57783127,-1.077275,36.91025,5.736769),vec4(14.283112,3.7146652,7.1452246,-4.5958776),vec4(2.7192075,3.6021907,-4.366337,-2.3653464))*buf[3]+vec4(-5.9000807,-4.329569,1.2427121,8.59503);
    buf[4]=sigmoid(buf[4]);buf[5]=sigmoid(buf[5]);
    buf[6]=mat4(vec4(-1.61102,0.7970257,1.4675229,0.20917463),vec4(-28.793737,-7.1390953,1.5025433,4.656581),vec4(-10.94861,39.66238,0.74318546,-10.095605),vec4(-0.7229728,-1.5483948,0.7301322,2.1687684))*buf[0]+mat4(vec4(3.2547753,21.489103,-1.0194173,-3.3100595),vec4(-3.7316632,-3.3792162,-7.223193,-0.23685838),vec4(13.1804495,0.7916005,5.338587,5.687114),vec4(-4.167605,-17.798311,-6.815736,-1.6451967))*buf[1]+mat4(vec4(0.604885,-7.800309,-7.213122,-2.741014),vec4(-3.522382,-0.12359311,-0.5258442,0.43852118),vec4(9.6752825,-22.853785,2.062431,0.099892326),vec4(-4.3196306,-17.730087,2.5184598,5.30267))*buf[2]+mat4(vec4(-6.545563,-15.790176,-6.0438633,-5.415399),vec4(-43.591583,28.551912,-16.00161,18.84728),vec4(4.212382,8.394307,3.0958717,8.657522),vec4(-5.0237565,-4.450633,-4.4768,-5.5010443))*buf[3]+mat4(vec4(1.6985557,-67.05806,6.897715,1.9004834),vec4(1.8680354,2.3915145,2.5231109,4.081538),vec4(11.158006,1.7294737,2.0738268,7.386411),vec4(-4.256034,-306.24686,8.258898,-17.132736))*buf[4]+mat4(vec4(1.6889864,-4.5852966,3.8534803,-6.3482175),vec4(1.3543309,-1.2640043,9.932754,2.9079645),vec4(-5.2770967,0.07150358,-0.13962056,3.3269649),vec4(28.34703,-4.918278,6.1044083,4.085355))*buf[5]+vec4(6.6818056,12.522166,-3.7075126,-4.104386);
    buf[7]=mat4(vec4(-8.265602,-4.7027016,5.098234,0.7509808),vec4(8.6507845,-17.15949,16.51939,-8.884479),vec4(-4.036479,-2.3946867,-2.6055532,-1.9866527),vec4(-2.2167742,-1.8135649,-5.9759874,4.8846445))*buf[0]+mat4(vec4(6.7790847,3.5076547,-2.8191125,-2.7028968),vec4(-5.743024,-0.27844876,1.4958696,-5.0517144),vec4(13.122226,15.735168,-2.9397483,-4.101023),vec4(-14.375265,-5.030483,-6.2599335,2.9848232))*buf[1]+mat4(vec4(4.0950394,-0.94011575,-5.674733,4.755022),vec4(4.3809423,4.8310084,1.7425908,-3.437416),vec4(2.117492,0.16342592,-104.56341,16.949184),vec4(-5.22543,-2.994248,3.8350096,-1.9364246))*buf[2]+mat4(vec4(-5.900337,1.7946124,-13.604192,-3.8060522),vec4(6.6583457,31.911177,25.164474,91.81147),vec4(11.840538,4.1503043,-0.7314397,6.768467),vec4(-6.3967767,4.034772,6.1714606,-0.32874924))*buf[3]+mat4(vec4(3.4992442,-196.91893,-8.923708,2.8142626),vec4(3.4806502,-3.1846354,5.1725626,5.1804223),vec4(-2.4009497,15.585794,1.2863957,2.0252278),vec4(-71.25271,-62.441242,-8.138444,0.50670296))*buf[4]+mat4(vec4(-12.291733,-11.176166,-7.3474145,4.390294),vec4(10.805477,5.6337385,-0.9385842,-4.7348723),vec4(-12.869276,-7.039391,5.3029537,7.5436664),vec4(1.4593618,8.91898,3.5101583,5.840625))*buf[5]+vec4(2.2415268,-6.705987,-0.98861027,-2.117676);
    buf[6]=sigmoid(buf[6]);buf[7]=sigmoid(buf[7]);
    buf[0]=mat4(vec4(1.6794263,1.3817469,2.9625452,0.),vec4(-1.8834411,-1.4806935,-3.5924516,0.),vec4(-1.3279216,-1.0918057,-2.3124623,0.),vec4(0.2662234,0.23235129,0.44178495,0.))*buf[0]+mat4(vec4(-0.6299101,-0.5945583,-0.9125601,0.),vec4(0.17828953,0.18300213,0.18182953,0.),vec4(-2.96544,-2.5819945,-4.9001055,0.),vec4(1.4195864,1.1868085,2.5176322,0.))*buf[1]+mat4(vec4(-1.2584374,-1.0552157,-2.1688404,0.),vec4(-0.7200217,-0.52666044,-1.438251,0.),vec4(0.15345335,0.15196142,0.272854,0.),vec4(0.945728,0.8861938,1.2766753,0.))*buf[2]+mat4(vec4(-2.4218085,-1.968602,-4.35166,0.),vec4(-22.683098,-18.0544,-41.954372,0.),vec4(0.63792,0.5470648,1.1078634,0.),vec4(-1.5489894,-1.3075932,-2.6444845,0.))*buf[3]+mat4(vec4(-0.49252132,-0.39877754,-0.91366625,0.),vec4(0.95609266,0.7923952,1.640221,0.),vec4(0.30616966,0.15693925,0.8639857,0.),vec4(1.1825981,0.94504964,2.176963,0.))*buf[4]+mat4(vec4(0.35446745,0.3293795,0.59547555,0.),vec4(-0.58784515,-0.48177817,-1.0614829,0.),vec4(2.5271258,1.9991658,4.6846647,0.),vec4(0.13042648,0.08864098,0.30187556,0.))*buf[5]+mat4(vec4(-1.7718065,-1.4033192,-3.3355875,0.),vec4(3.1664357,2.638297,5.378702,0.),vec4(-3.1724713,-2.6107926,-5.549295,0.),vec4(-2.851368,-2.249092,-5.3013067,0.))*buf[6]+mat4(vec4(1.5203838,1.2212278,2.8404984,0.),vec4(1.5210563,1.2651345,2.683903,0.),vec4(2.9789467,2.4364579,5.2347264,0.),vec4(2.2270417,1.8825914,3.8028636,0.))*buf[7]+vec4(-1.5468478,-3.6171484,0.24762098,0.);
    buf[0]=sigmoid(buf[0]);
    return vec4(buf[0].x,buf[0].y,buf[0].z,1.);
}

void mainImage(out vec4 fragColor,in vec2 fragCoord){
    vec2 uv=fragCoord/uResolution.xy*2.-1.;
    uv.x *= uResolution.x / uResolution.y;
    uv.y*=-1.;
    uv+=uWarp*vec2(sin(uv.y*6.283+uTime*0.5),cos(uv.x*6.283+uTime*0.5))*0.05;
    fragColor=cppn_fn(uv,0.1*sin(0.3*uTime),0.1*sin(0.69*uTime),0.1*sin(0.44*uTime));
}

void main(){
    vec4 col;mainImage(col,gl_FragCoord.xy);
    col.rgb=hueShiftRGB(col.rgb,uHueShift);
    float scanline_val=sin(gl_FragCoord.y*uScanFreq)*0.5+0.5;
    col.rgb*=1.-(scanline_val*scanline_val)*uScan;
    col.rgb+=(rand(gl_FragCoord.xy+uTime)-0.5)*uNoise;
    gl_FragColor=vec4(clamp(col.rgb,0.0,1.0),1.0);
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
  warpAmount: WARP_AMOUNT,
  hueShift: HUE_SHIFT,
  speed: SPEED,
  brightness: BRIGHTNESS,
  noiseIntensity: NOISE_INTENSITY,
  scanlineIntensity: SCANLINE_INTENSITY,
  scanlineFrequency: SCANLINE_FREQUENCY,
  scrollMul: 1,
}

let target = {
  warpAmount: WARP_AMOUNT,
  hueShift: HUE_SHIFT,
  speed: SPEED,
  brightness: BRIGHTNESS,
  noiseIntensity: NOISE_INTENSITY,
  scanlineIntensity: SCANLINE_INTENSITY,
  scanlineFrequency: SCANLINE_FREQUENCY,
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

/** Path key after `/projects/moneybox/`, or null if not a MoneyBox route. */
export function resolveMoneyBoxPageKey(pathname: string): string | null {
  const m = pathname.match(/\/projects\/moneybox(?:\/(.*))?\/?$/)
  if (!m) return null
  const rest = (m[1] || '').replace(/\/+$/, '')
  return rest
}

export function isMoneyBoxPath(pathname = typeof location !== 'undefined' ? location.pathname : ''): boolean {
  return resolveMoneyBoxPageKey(pathname) !== null
}

export function knobsForPath(pathname: string): PageKnobs {
  const key = resolveMoneyBoxPageKey(pathname)
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
  host.style.setProperty('--moneybox-dark-veil-scroll-mul', String(mul))
}

function applyScrollMulFromScroll(): void {
  if (!scrollFadeEnabled) {
    live.scrollMul = 1
    syncHostOpacity(live.brightness)
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
  syncHostOpacity(live.brightness * live.scrollMul)
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
 * Boot DarkVeil into `container` if not already running.
 * Safe to call on every MoneyBox page-load — will NOT remount an existing instance.
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
    premultipliedAlpha: false,
    dpr: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2),
  })
  const gl = renderer.gl
  gl.clearColor(0, 0, 0, 0)

  let program: Program | null = null
  const resolution = new Vec2()

  function resize(): void {
    const host = active?.container ?? container
    const w = host.clientWidth || window.innerWidth
    const h = host.clientHeight || window.innerHeight
    renderer.setSize(w * RESOLUTION_SCALE, h * RESOLUTION_SCALE)
    if (program) {
      program.uniforms.uResolution.value.set(w, h)
    } else {
      resolution.set(w, h)
    }
  }

  const geometry = new Triangle(gl)
  const veilProgram = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: resolution },
      uHueShift: { value: live.hueShift },
      uNoise: { value: live.noiseIntensity },
      uScan: { value: live.scanlineIntensity },
      uScanFreq: { value: live.scanlineFrequency },
      uWarp: { value: live.warpAmount },
    },
  })
  program = veilProgram

  window.addEventListener('resize', resize)
  resize()

  const mesh = new Mesh(gl, { geometry, program: veilProgram })
  gl.canvas.style.display = 'block'
  gl.canvas.style.width = '100%'
  gl.canvas.style.height = '100%'
  container.appendChild(gl.canvas)

  window.addEventListener('scroll', onScroll, { passive: true })

  const start = performance.now()
  let animationFrameId = 0

  function update(): void {
    animationFrameId = requestAnimationFrame(update)
    if (!program) return

    live.warpAmount += (target.warpAmount - live.warpAmount) * KNOB_LERP
    live.hueShift += (target.hueShift - live.hueShift) * KNOB_LERP
    live.speed += (target.speed - live.speed) * KNOB_LERP
    live.brightness += (target.brightness - live.brightness) * KNOB_LERP
    live.noiseIntensity += (target.noiseIntensity - live.noiseIntensity) * KNOB_LERP
    live.scanlineIntensity += (target.scanlineIntensity - live.scanlineIntensity) * KNOB_LERP
    live.scanlineFrequency += (target.scanlineFrequency - live.scanlineFrequency) * KNOB_LERP

    // Keep host opacity in sync while brightness lerps (scrollMul unchanged).
    syncHostOpacity(live.brightness * live.scrollMul)

    program.uniforms.uTime.value = ((performance.now() - start) / 1000) * live.speed
    program.uniforms.uHueShift.value = live.hueShift
    program.uniforms.uNoise.value = live.noiseIntensity
    program.uniforms.uScan.value = live.scanlineIntensity
    program.uniforms.uScanFreq.value = live.scanlineFrequency
    program.uniforms.uWarp.value = live.warpAmount

    renderer.render({ scene: mesh })
  }
  animationFrameId = requestAnimationFrame(update)

  active = {
    container,
    program: veilProgram,
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
  target.warpAmount = knobs.warpAmount
  target.hueShift = knobs.hueShift
  target.speed = knobs.speed
  target.brightness = knobs.brightness
  target.noiseIntensity = knobs.noiseIntensity
  target.scanlineIntensity = knobs.scanlineIntensity
  target.scanlineFrequency = knobs.scanlineFrequency
  scrollFadeEnabled = knobs.scrollFade
  scrollFadeEnd = knobs.scrollFadeEnd ?? SCROLL_FADE_END

  if (opts?.snap) {
    live.warpAmount = knobs.warpAmount
    live.hueShift = knobs.hueShift
    live.speed = knobs.speed
    live.brightness = knobs.brightness
    live.noiseIntensity = knobs.noiseIntensity
    live.scanlineIntensity = knobs.scanlineIntensity
    live.scanlineFrequency = knobs.scanlineFrequency
  }

  applyScrollMulFromScroll()
}

/** Tear down the active DarkVeil instance, if any. */
export function destroy(): void {
  if (!active) return
  active.container.classList.remove('is-scrolling')
  active.container.style.removeProperty('--moneybox-dark-veil-scroll-mul')
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
