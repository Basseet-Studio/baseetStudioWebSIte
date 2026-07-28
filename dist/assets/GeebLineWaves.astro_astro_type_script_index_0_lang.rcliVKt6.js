import{R as z,T as $,P as K,M as V}from"./Triangle.DfWMHKQ0.js";const j=.3,X=15,J=17,P=.5,B=-30,Q=0,Z=1,h=.2,ee="#F5F749",te="#FBFFF1",ne="#ffffff",oe=!0,re=2,se=700,R=320,y=.06,p=h*.3,ae=.02,I=.2,m=.35,E={"":{rotationDeg:-45,warpIntensity:1,brightness:h,scrollFade:!0},features:{rotationDeg:-90,warpIntensity:1.25,brightness:.15,scrollFade:!0},download:{rotationDeg:-120,warpIntensity:.02,brightness:.1,scrollFade:!0},pro:{rotationDeg:-18,warpIntensity:1.15,brightness:.7,scrollFade:!0},faq:{rotationDeg:-85,warpIntensity:.95,brightness:.5,scrollFade:!0},terms:{rotationDeg:-62,warpIntensity:2.75,brightness:.3,scrollFade:!0},privacy:{rotationDeg:-11,warpIntensity:.7,brightness:.3,scrollFade:!0},"terms/customers":{rotationDeg:-55,warpIntensity:.55,brightness:p,scrollFade:!0,scrollFadeEnd:m},"terms/vendors":{rotationDeg:-48,warpIntensity:.46,brightness:p,scrollFade:!0,scrollFadeEnd:m},"privacy/customers":{rotationDeg:-52,warpIntensity:.35,brightness:p,scrollFade:!0,scrollFadeEnd:m},"privacy/vendors":{rotationDeg:-60,warpIntensity:.2,brightness:p,scrollFade:!0,scrollFadeEnd:m}};function b(e){const n=e.replace("#","");return[parseInt(n.slice(0,2),16)/255,parseInt(n.slice(2,4),16)/255,parseInt(n.slice(4,6),16)/255]}const ie=`
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`,le=`
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
`;let s=null,o={rotationDeg:B,warpIntensity:P,brightness:h,scrollMul:1},d={rotationDeg:B,warpIntensity:P,brightness:h},F=!1,L=I;function ue(){return/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)||window.innerWidth<600}function ce(){return!!(typeof window>"u"||ue()||window.matchMedia("(prefers-reduced-motion: reduce)").matches)}function O(e){const n=e.match(/\/projects\/geeb(?:\/(.*))?\/?$/);return n?(n[1]||"").replace(/\/+$/,""):null}function T(e=typeof location<"u"?location.pathname:""){return O(e)!==null}function de(e){const n=O(e);return n===null?E[""]:E[n]??E[""]}function fe(){const e=document.documentElement.scrollHeight-window.innerHeight;return e<=1?0:Math.min(1,Math.max(0,window.scrollY/e))}function S(e){const n=s?.container;n&&n.style.setProperty("--geeb-waves-scroll-mul",String(e))}function W(){if(!F){o.scrollMul=1,S(1);return}const e=fe(),n=ae,t=Math.max(n+.05,L);let r=0;e<=n?r=0:e>=t?r=1:r=(e-n)/(t-n);const l=r*r*(3-2*r);o.scrollMul=1-l,S(o.scrollMul)}let c=null;function _(){const e=s?.container;e&&(e.classList.add("is-scrolling"),c!=null&&clearTimeout(c),c=setTimeout(()=>{e.classList.remove("is-scrolling"),c=null},120)),W()}function pe(e){if(ce())return!1;if(s)return s.container!==e&&(s.container=e),!0;const n=new z({alpha:!0,premultipliedAlpha:!1}),t=n.gl;t.clearColor(0,0,0,0);let r=[.5,.5],l=[.5,.5],a=null;function D(u){const i=e.getBoundingClientRect();i.width===0||i.height===0||(l=[(u.clientX-i.left)/i.width,1-(u.clientY-i.top)/i.height])}function M(){l=[.5,.5]}function g(){const u=s?.container??e,i=u.offsetWidth||window.innerWidth,q=u.offsetHeight||window.innerHeight;n.setSize(i,q),a&&(a.uniforms.uResolution.value=[t.canvas.width,t.canvas.height,t.canvas.width/t.canvas.height])}const Y=new $(t),v=new K(t,{vertex:ie,fragment:le,transparent:!0,uniforms:{uTime:{value:0},uResolution:{value:[t.canvas.width,t.canvas.height,t.canvas.width/t.canvas.height]},uSpeed:{value:j},uInnerLines:{value:X},uOuterLines:{value:J},uWarpIntensity:{value:o.warpIntensity},uRotation:{value:o.rotationDeg*Math.PI/180},uEdgeFadeWidth:{value:Q},uColorCycleSpeed:{value:Z},uBrightness:{value:o.brightness*o.scrollMul},uColor1:{value:b(ee)},uColor2:{value:b(te)},uColor3:{value:b(ne)},uMouse:{value:new Float32Array([.5,.5])},uMouseInfluence:{value:re},uEnableMouse:{value:oe}}});a=v,window.addEventListener("resize",g),g();const U=new V(t,{geometry:Y,program:v});t.canvas.style.display="block",t.canvas.style.width="100%",t.canvas.style.height="100%",e.appendChild(t.canvas),window.addEventListener("pointermove",D),window.addEventListener("pointerleave",M),window.addEventListener("scroll",_,{passive:!0});let w=0;function x(u){w=requestAnimationFrame(x),a&&(o.rotationDeg+=(d.rotationDeg-o.rotationDeg)*y,o.warpIntensity+=(d.warpIntensity-o.warpIntensity)*y,o.brightness+=(d.brightness-o.brightness)*y,a.uniforms.uTime.value=u*.001,a.uniforms.uRotation.value=o.rotationDeg*Math.PI/180,a.uniforms.uWarpIntensity.value=o.warpIntensity,a.uniforms.uBrightness.value=o.brightness*o.scrollMul,r[0]+=.05*(l[0]-r[0]),r[1]+=.05*(l[1]-r[1]),a.uniforms.uMouse.value[0]=r[0],a.uniforms.uMouse.value[1]=r[1],n.render({scene:U}))}return w=requestAnimationFrame(x),s={container:e,program:v,destroy(){cancelAnimationFrame(w),window.removeEventListener("resize",g),window.removeEventListener("scroll",_),window.removeEventListener("pointermove",D),window.removeEventListener("pointerleave",M),t.canvas.parentNode&&t.canvas.parentNode.removeChild(t.canvas),t.getExtension("WEBGL_lose_context")?.loseContext()}},!0}function me(e,n){const t=de(e);d.rotationDeg=t.rotationDeg,d.warpIntensity=t.warpIntensity,d.brightness=t.brightness,F=t.scrollFade,L=t.scrollFadeEnd??I,n?.snap&&(o.rotationDeg=t.rotationDeg,o.warpIntensity=t.warpIntensity,o.brightness=t.brightness),W()}function N(){s&&(s.container.classList.remove("is-scrolling"),s.container.style.removeProperty("--geeb-waves-scroll-mul"),s.destroy(),s=null,F=!1,L=I,o.scrollMul=1,c!=null&&(clearTimeout(c),c=null))}function C(){return s!==null}const k="is-visible";let A=!1;function f(){return document.getElementById("geeb-line-waves")}function he(e){e.style.setProperty("--geeb-waves-fade-in",`${se}ms`),e.style.setProperty("--geeb-waves-fade-out",`${R}ms`),requestAnimationFrame(()=>{requestAnimationFrame(()=>e.classList.add(k))})}function G(e){e?.classList.remove(k)}function H(e,n){const t=f();if(!t)return;const r=!C();pe(t)&&(me(e,{snap:n||r}),he(t))}function ge(){const e=f();G(e),window.setTimeout(()=>{T(location.pathname)||N()},R)}function ve(){T(location.pathname)&&f()?H(location.pathname,!1):C()&&ge()}function we(e){e.newDocument?.getElementById("geeb-line-waves")||(C()||f())&&(G(f()),N())}function ye(){A||(A=!0,document.addEventListener("astro:page-load",ve),document.addEventListener("astro:before-swap",we))}ye();T(location.pathname)&&f()&&H(location.pathname,!0);
