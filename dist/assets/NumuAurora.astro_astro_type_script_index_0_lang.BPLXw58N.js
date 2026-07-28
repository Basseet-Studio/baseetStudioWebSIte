import{R as q,T as K,P as V,M as j}from"./Triangle.DfWMHKQ0.js";const L={black:"#000000",white:"#ffffff",red:"#ff0000",green:"#00ff00",blue:"#0000ff",fuchsia:"#ff00ff",cyan:"#00ffff",yellow:"#ffff00",orange:"#ff8000"};function P(e){e.length===4&&(e=e[0]+e[1]+e[1]+e[2]+e[2]+e[3]+e[3]);const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t||console.warn(`Unable to convert hex string ${e} to rgb values`),[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]}function Y(e){return e=parseInt(e),[(e>>16&255)/255,(e>>8&255)/255,(e&255)/255]}function B(e){return e===void 0?[0,0,0]:arguments.length===3?arguments:isNaN(e)?e[0]==="#"?P(e):L[e.toLowerCase()]?P(L[e.toLowerCase()]):(console.warn("Color format not recognised"),[0,0,0]):Y(e)}class J extends Array{constructor(t){return Array.isArray(t)?super(...t):super(...B(...arguments))}get r(){return this[0]}get g(){return this[1]}get b(){return this[2]}set r(t){this[0]=t}set g(t){this[1]=t}set b(t){this[2]=t}set(t){return Array.isArray(t)?this.copy(t):this.copy(B(...arguments))}copy(t){return this[0]=t[0],this[1]=t[1],this[2]=t[2],this}}const M=["#C77DFF","#ffffff","#C77DFF"],g=.9,v=.55,O=.2,x=.5,Q=700,D=320,d=.06,X=.02,y=.55,T=.35,h={"":{amplitude:1,blend:v,brightness:x,speed:g,scrollFade:!0},features:{amplitude:.6,blend:1,brightness:.4,speed:.8,scrollFade:!0},download:{amplitude:.5,blend:1,brightness:.3,speed:.4,scrollFade:!0},terms:{amplitude:.4,blend:1,brightness:.2,speed:.6,scrollFade:!0,scrollFadeEnd:T},privacy:{amplitude:.3,blend:1,brightness:.2,speed:.5,scrollFade:!0,scrollFadeEnd:T}},Z=`#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,ee=`#version 300 es
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

#define COLOR_RAMP(colors, factor, finalColor) {                int index = 0;                                              for (int i = 0; i < 2; i++) {                                    ColorStop currentColor = colors[i];                         bool isInBetween = currentColor.position <= factor;         index = int(mix(float(index), float(i), float(isInBetween)));   }                                                           ColorStop currentColor = colors[index];                     ColorStop nextColor = colors[index + 1];                    float range = nextColor.position - currentColor.position;   float lerpFactor = (factor - currentColor.position) / range;   finalColor = mix(currentColor.color, nextColor.color, lerpFactor); }

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
`;let i=null,n={amplitude:O,blend:v,brightness:x,speed:g,scrollMul:1},s={amplitude:O,blend:v,brightness:x,speed:g},b=!1,w=y;function te(){return/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)||window.innerWidth<600}function oe(){return!!(typeof window>"u"||te()||window.matchMedia("(prefers-reduced-motion: reduce)").matches)}function R(e){return e.map(t=>{const o=new J(t);return[o.r,o.g,o.b]})}function z(e){const t=e.match(/\/projects\/numu(?:\/(.*))?\/?$/);return t?(t[1]||"").replace(/\/+$/,""):null}function C(e=typeof location<"u"?location.pathname:""){return z(e)!==null}function ne(e){const t=z(e);return t===null?h[""]:h[t]??h[""]}function re(){const e=document.documentElement.scrollHeight-window.innerHeight;return e<=1?0:Math.min(1,Math.max(0,window.scrollY/e))}function _(e){const t=i?.container;t&&t.style.setProperty("--numu-aurora-scroll-mul",String(e))}function H(){if(!b){n.scrollMul=1,_(1);return}const e=re(),t=X,o=Math.max(t+.05,w);let r=0;e<=t?r=0:e>=o?r=1:r=(e-t)/(o-t);const a=r*r*(3-2*r);n.scrollMul=1-a,_(n.scrollMul)}let l=null;function N(){const e=i?.container;e&&(e.classList.add("is-scrolling"),l!=null&&clearTimeout(l),l=setTimeout(()=>{e.classList.remove("is-scrolling"),l=null},120)),H()}function ie(e){if(oe())return!1;if(i)return i.container!==e&&(i.container=e),!0;const t=new q({alpha:!0,premultipliedAlpha:!0,antialias:!0}),o=t.gl;o.clearColor(0,0,0,0),o.enable(o.BLEND),o.blendFunc(o.ONE,o.ONE_MINUS_SRC_ALPHA),o.canvas.style.backgroundColor="transparent";let r=null;function a(){const c=i?.container??e,A=c.offsetWidth||window.innerWidth,F=c.offsetHeight||window.innerHeight;t.setSize(A,F),r&&(r.uniforms.uResolution.value=[A,F])}const f=new K(o);f.attributes.uv&&delete f.attributes.uv;const m=new V(o,{vertex:Z,fragment:ee,uniforms:{uTime:{value:0},uAmplitude:{value:n.amplitude},uColorStops:{value:R(M)},uResolution:{value:[e.offsetWidth||window.innerWidth,e.offsetHeight||window.innerHeight]},uBlend:{value:n.blend},uBrightness:{value:n.brightness*n.scrollMul}}});r=m,window.addEventListener("resize",a),a();const U=new j(o,{geometry:f,program:m});o.canvas.style.display="block",o.canvas.style.width="100%",o.canvas.style.height="100%",e.appendChild(o.canvas),window.addEventListener("scroll",N,{passive:!0});let p=0;function E(c){p=requestAnimationFrame(E),r&&(n.amplitude+=(s.amplitude-n.amplitude)*d,n.blend+=(s.blend-n.blend)*d,n.brightness+=(s.brightness-n.brightness)*d,n.speed+=(s.speed-n.speed)*d,r.uniforms.uTime.value=c*.01*n.speed*.1,r.uniforms.uAmplitude.value=n.amplitude,r.uniforms.uBlend.value=n.blend,r.uniforms.uBrightness.value=n.brightness*n.scrollMul,r.uniforms.uColorStops.value=R(M),t.render({scene:U}))}return p=requestAnimationFrame(E),i={container:e,program:m,destroy(){cancelAnimationFrame(p),window.removeEventListener("resize",a),window.removeEventListener("scroll",N),o.canvas.parentNode&&o.canvas.parentNode.removeChild(o.canvas),o.getExtension("WEBGL_lose_context")?.loseContext()}},!0}function se(e,t){const o=ne(e);s.amplitude=o.amplitude,s.blend=o.blend,s.brightness=o.brightness,s.speed=o.speed,b=o.scrollFade,w=o.scrollFadeEnd??y,t?.snap&&(n.amplitude=o.amplitude,n.blend=o.blend,n.brightness=o.brightness,n.speed=o.speed),H()}function k(){i&&(i.container.classList.remove("is-scrolling"),i.container.style.removeProperty("--numu-aurora-scroll-mul"),i.destroy(),i=null,b=!1,w=y,n.scrollMul=1,l!=null&&(clearTimeout(l),l=null))}function S(){return i!==null}const G="is-visible";let I=!1;function u(){return document.getElementById("numu-aurora")}function le(e){e.style.setProperty("--numu-aurora-fade-in",`${Q}ms`),e.style.setProperty("--numu-aurora-fade-out",`${D}ms`),requestAnimationFrame(()=>{requestAnimationFrame(()=>e.classList.add(G))})}function W(e){e?.classList.remove(G)}function $(e,t){const o=u();if(!o)return;const r=!S();ie(o)&&(se(e,{snap:t||r}),le(o))}function ae(){const e=u();W(e),window.setTimeout(()=>{C(location.pathname)||k()},D)}function ue(){C(location.pathname)&&u()?$(location.pathname,!1):S()&&ae()}function ce(e){e.newDocument?.getElementById("numu-aurora")||(S()||u())&&(W(u()),k())}function de(){I||(I=!0,document.addEventListener("astro:page-load",ue),document.addEventListener("astro:before-swap",ce))}de();C(location.pathname)&&u()&&$(location.pathname,!0);
