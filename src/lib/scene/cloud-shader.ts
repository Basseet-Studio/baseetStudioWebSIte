/**
 * Ported from tool-craft/clouds-playground/src/app/renderer/cloud-shader.ts
 * (Vanta.js CLOUDS raymarch). Site-specific additions:
 * - XZ coverage mask + two altitude bands (gaps of empty sky, not a density slab)
 * - uLightColor tints sunlight in integrate() / renderSkyClouds()
 * - Depth textures + background color from model pre-passes for behind/middle/in-front compositing
 *
 * Split pipeline (see sky-composite-shader.ts):
 * - uCloudsOnly = 1 (runtime default): outputs ONLY clouds as premultiplied
 *   rgb + alpha into a low-res target. The sky photo is drawn full-res later.
 * - uCloudsOnly = 0: legacy single-pass path.
 *
 * Horizon seam fixes:
 * - The march starts where the ray ENTERS the cloud slab (analytic), so the
 *   step budget is spent inside the clouds and the deck reaches the horizon
 *   instead of stopping short and leaving an empty milky band.
 * - Distant clouds fade toward the photo's OWN horizon row at that azimuth,
 *   so the cloud sea melts into the photo instead of meeting it at a hard line.
 */

export const cloudVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

export const cloudFragmentShader = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform vec2 iResolution;
uniform float iTime;

uniform float uSpeed;
uniform float uDensity;
uniform float uNoise;
uniform float uVerticalSpread;
uniform float uFogDensity;
uniform vec3 uSkyColor;
uniform vec3 uCloudColor;
uniform vec3 uSunDir;
uniform float uLightIntensity;
uniform vec3 uLightColor;

uniform vec3 uCameraPos;
uniform vec3 uCameraTarget;

uniform sampler2D tBackground;
uniform sampler2D tDepth;
uniform float uCameraNear;
uniform float uCameraFar;
uniform float uHasBackgroundColor;
uniform float uHasSceneDepth;
uniform float uWorldScale;
uniform mat4 uViewMatrix;
uniform float uDepthBias;
uniform float uQuality;
uniform float uSeed;
uniform float uLowClumpScale;
uniform float uHighClumpScale;
uniform float uApart;

uniform sampler2D tSkyALo;
uniform sampler2D tSkyAHi;
uniform sampler2D tSkyBLo;
uniform sampler2D tSkyBHi;
uniform float uSkyFullMixA;
uniform float uSkyFullMixB;
uniform float uSkyBlend;
uniform float uSkyYaw;
uniform float uSkyMix;
uniform vec3 uSkyHorizon;
uniform vec3 uSkyZenith;
uniform float uSkyFloor;
uniform float uFocal;
uniform float uCloudsOnly;

float hash(float p) {
  p = fract(p * 0.011);
  p *= (p + 7.5);
  p *= (p + p);
  return fract(p);
}

float noise(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n = p.x + p.y * 57.0 + 113.0 * p.z;
  return mix(
    mix(mix(hash(n + 0.0), hash(n + 1.0), f.x), mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
    mix(mix(hash(n + 113.0), hash(n + 114.0), f.x), mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y),
    f.z
  );
}

const float constantTime = 1000.0;

const float kLowCoverFreq = 0.22;
const float kHighCoverFreq = 0.55;
const float kLowDensity = 1.15;
const float kHighDensity = 0.55;
const float kLowSpeedMul = 1.35;
const float kHighSpeedMul = 0.55;

// Cloud slab bounds (shader units) and max march distance.
const float kSlabTop = 2.0;
const float kSlabBottom = -3.0;
const float kMaxT = 250.0;

// Minimum sun elevation used for cloud lighting (sin of ~5 deg).
const float kMinSunY = 0.087;

vec2 seedShift() {
  return vec2(uSeed * 17.13, uSeed * 9.71);
}

float detailFbm(in vec3 p, in int octaves, in float speedMul) {
  vec3 speed1 = vec3(0.5, 0.01, 1.0) * 0.5 * uSpeed * speedMul;
  vec3 q = p - speed1 * (iTime + constantTime);
  float f = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    if (i >= octaves) break;
    f += amp * noise(q) * (1.0 + uNoise);
    q *= 2.0 + 0.02 * float(i);
    amp *= 0.5;
  }
  return f;
}

float coverageMask(in vec2 xz, in float freq, in float speedMul, in float yOffset) {
  vec2 wind = vec2(0.5, 1.0) * 0.25 * uSpeed * speedMul * (iTime + constantTime);
  vec2 q = xz * freq - wind;
  float n = 0.65 * noise(vec3(q.x, yOffset, q.y));
  n += 0.35 * noise(vec3(q.x * 2.03 + 17.1, yOffset + 3.7, q.y * 2.03));
  float edge = mix(0.88, 0.34, clamp(uDensity, 0.0, 1.0));
  return smoothstep(edge, edge + 0.20, n);
}

float heightWindow(in float y, in float center, in float halfWidth) {
  return smoothstep(center - halfWidth, center - halfWidth * 0.35, y)
    * (1.0 - smoothstep(center + halfWidth * 0.35, center + halfWidth, y));
}

float highBandWeight(in float y) {
  return smoothstep(-0.4, 0.8, y);
}

float bandDensity(
  in vec3 p,
  in int octaves,
  in float t,
  in float coverFreq,
  in float clumpScale,
  in float densScale,
  in float speedMul,
  in float coverOffset,
  in float yCenter,
  in float yHalf
) {
  float distFreq = mix(1.0, 0.78, smoothstep(0.0, 36.0, t));
  float h = heightWindow(p.y, yCenter, yHalf);
  if (h < 0.01) {
    return 0.0;
  }
  vec3 seeded = p;
  seeded.xz += seedShift();
  float mask = coverageMask(seeded.xz, coverFreq * distFreq, speedMul, coverOffset);
  if (mask < 0.01) {
    return 0.0;
  }
  float f = detailFbm(seeded * (clumpScale * distFreq), octaves, speedMul);
  float detail = clamp(1.75 * f - 0.35, 0.0, 1.0);
  return clamp(h * mask * densScale * detail, 0.0, 1.0);
}

float cloudDensity(in vec3 p, in int octaves, in float t) {
  float spread = clamp(uVerticalSpread, 0.0, 1.0);
  float yHalfLow = mix(0.38, 0.85, spread);
  float yHalfHigh = mix(0.40, 0.80, spread);
  float apart = max(uApart, 0.01);
  float dLow = bandDensity(
    p, octaves, t,
    kLowCoverFreq * apart, uLowClumpScale, kLowDensity, kLowSpeedMul,
    2.7, -0.22, yHalfLow
  );
  float dHigh = bandDensity(
    p, octaves, t,
    kHighCoverFreq * apart, uHighClumpScale, kHighDensity, kHighSpeedMul,
    11.3, 0.62, yHalfHigh
  );
  return clamp(max(dLow, dHigh), 0.0, 1.0);
}

// fogCol: smooth sky colour for this ray, matched to the photo's horizon.
vec4 integrate(in vec4 sum, in float dif, in float den, in vec3 fogCol, in float t, in float highBand) {
  float skyMix = clamp(uSkyMix, 0.0, 1.0);
  vec3 cloudShadowColor = uCloudColor * 0.5;
  vec3 baseSunlight = mix(vec3(1.0, 0.95, 0.85), vec3(1.0, 0.78, 0.55), mix(0.55, 0.28, highBand));
  vec3 sunlightColor = baseSunlight * uLightColor * uLightIntensity;
  vec3 cloudAmbient = mix(uCloudColor, uSkyZenith, 0.35 * skyMix);
  vec3 lin = cloudAmbient * 1.4 + sunlightColor * dif;
  vec4 col = vec4(mix(vec3(1.0, 0.95, 0.8), cloudShadowColor, den), den);
  col.rgb *= lin;

  float fogAmount = 1.0 - exp(-mix(0.0006, 0.02, uFogDensity) * t * t);
  fogAmount = mix(fogAmount, 1.0, 0.32 * smoothstep(8.0, 42.0, t));

  col.rgb = mix(col.rgb, fogCol, fogAmount);
  col.a *= mix(1.0, 0.35, fogAmount * skyMix);
  col.rgb = mix(col.rgb, fogCol, highBand * 0.25 * skyMix);

  col.a *= 0.4;
  col.rgb *= col.a;
  return sum + col * (1.0 - sum.a);
}

float sceneViewZAt(vec2 uv) {
  float fragCoordZ = texture2D(tDepth, uv).x;
  if (fragCoordZ >= 1.0) {
    return -uCameraFar;
  }
  return (uCameraNear * uCameraFar) / ((uCameraFar - uCameraNear) * fragCoordZ - uCameraFar);
}

float sampleViewZ(vec3 cloudPos) {
  vec3 worldPos = cloudPos / uWorldScale;
  return (uViewMatrix * vec4(worldPos, 1.0)).z;
}

bool isSampleBehindScene(vec3 cloudPos, float sceneViewZ) {
  float sampleZ = sampleViewZ(cloudPos);
  return sampleZ < sceneViewZ + uDepthBias;
}

bool marchStep(
  inout vec4 sum,
  inout float t,
  in vec3 ro,
  in vec3 rd,
  in vec3 lightDir,
  in vec3 fogCol,
  in int oct,
  in float stepMul,
  in float sceneViewZ,
  in bool useSceneDepth
) {
  vec3 pos = ro + t * rd;
  if (pos.y < kSlabBottom || pos.y > kSlabTop || sum.a > 0.99 || t > kMaxT) return false;
  if (useSceneDepth && isSampleBehindScene(pos, sceneViewZ)) return false;
  float den = cloudDensity(pos, oct, t);
  if (den > 0.01) {
    int lightOct = oct > 3 ? 3 : oct;
    float dif = clamp((den - cloudDensity(pos + 0.3 * lightDir, lightOct, t)) / 0.45, 0.0, 1.0);
    sum = integrate(sum, dif, den, fogCol, t, highBandWeight(pos.y));
  }
  t += max(0.075, 0.02 * t) * stepMul;
  return true;
}

vec4 raymarch(in vec3 ro, in vec3 rd, in vec3 fogCol, in float sceneViewZ, in bool useSceneDepth) {
  vec4 sum = vec4(0.0);

  // Start where the ray enters the slab; skip rays that never reach it.
  float t = 0.0;
  if (ro.y > kSlabTop) {
    if (rd.y > -1e-4) return sum;
    t = (kSlabTop - ro.y) / rd.y;
  } else if (ro.y < kSlabBottom) {
    if (rd.y < 1e-4) return sum;
    t = (kSlabBottom - ro.y) / rd.y;
  }
  if (t > kMaxT) return sum;
  t += 0.01;

  float q = clamp(uQuality, 0.2, 1.0);
  float stepMul = mix(1.8, 1.0, q);
  int maxA = max(4, int(ceil(20.0 * q)));
  int maxB = max(4, int(ceil(25.0 * q)));
  int maxC = max(4, int(ceil(30.0 * q)));
  int maxD = max(4, int(ceil(40.0 * q)));
  int octA = max(2, int(ceil(5.0 * q)));
  int octB = max(2, int(ceil(4.0 * q)));
  int octC = max(2, int(ceil(3.0 * q)));
  int octD = 2;

  vec3 lightDir = normalize(vec3(uSunDir.x, max(uSunDir.y, kMinSunY), uSunDir.z));

  bool go = true;
  for (int i = 0; i < 20; i++) {
    if (i >= maxA || !go) break;
    go = marchStep(sum, t, ro, rd, lightDir, fogCol, octA, stepMul, sceneViewZ, useSceneDepth);
  }
  for (int i = 0; i < 25; i++) {
    if (i >= maxB || !go) break;
    go = marchStep(sum, t, ro, rd, lightDir, fogCol, octB, stepMul, sceneViewZ, useSceneDepth);
  }
  for (int i = 0; i < 30; i++) {
    if (i >= maxC || !go) break;
    go = marchStep(sum, t, ro, rd, lightDir, fogCol, octC, stepMul, sceneViewZ, useSceneDepth);
  }
  for (int i = 0; i < 40; i++) {
    if (i >= maxD || !go) break;
    go = marchStep(sum, t, ro, rd, lightDir, fogCol, octD, stepMul, sceneViewZ, useSceneDepth);
  }

  return clamp(sum, 0.0, 1.0);
}

mat3 setCamera(in vec3 ro, in vec3 ta, in float cr) {
  vec3 cw = normalize(ta - ro);
  vec3 cp = vec3(sin(cr), cos(cr), 0.0);
  vec3 cu = normalize(cross(cw, cp));
  vec3 cv = normalize(cross(cu, cw));
  return mat3(cu, cv, cw);
}

vec2 equirectUv(in vec3 d) {
  return vec2(
    atan(d.z, d.x) * 0.15915494309 + 0.5,
    asin(clamp(d.y, -1.0, 1.0)) * 0.31830988618 + 0.5
  );
}

vec3 yawDir(in vec3 rd, in float yaw) {
  float cy = cos(yaw);
  float sy = sin(yaw);
  return vec3(rd.x * cy - rd.z * sy, rd.y, rd.x * sy + rd.z * cy);
}

// Photo colour just above the horizon at this ray's azimuth (lo-res = pre-blurred).
vec3 photoHorizon(in vec3 rd) {
  vec3 d = yawDir(rd, uSkyYaw);
  float u = equirectUv(d).x;
  vec3 a = texture2D(tSkyALo, vec2(u, 0.505)).rgb;
  vec3 b = texture2D(tSkyBLo, vec2(u, 0.505)).rgb;
  return mix(a, b, clamp(uSkyBlend, 0.0, 1.0));
}

vec3 sampleEquirect(in sampler2D tex, in vec3 rd, in float yaw) {
  vec3 d = yawDir(rd, yaw);
  float floorAmount = clamp(uSkyFloor, 0.0, 1.0);
  if (d.y < 0.0 && floorAmount > 0.0) {
    // Below the horizon: continue the photo's horizon row and sink slowly
    // into a soft cloud-sea tone (wide band, no hard edge).
    vec2 uv = equirectUv(d);
    vec3 horizonCol = texture2D(tex, vec2(uv.x, 0.505)).rgb;
    vec3 sea = mix(horizonCol, mix(uSkyHorizon, uCloudColor, 0.5), 0.5) * 0.85;
    float t = smoothstep(0.0, 0.35, -d.y) * floorAmount;
    return mix(horizonCol, sea, t);
  }
  return texture2D(tex, equirectUv(d)).rgb;
}

vec3 sampleSkySlot(in sampler2D lo, in sampler2D hi, in float fullMix, in vec3 rd, in float yaw) {
  vec3 a = sampleEquirect(lo, rd, yaw);
  vec3 b = sampleEquirect(hi, rd, yaw);
  return mix(a, b, clamp(fullMix, 0.0, 1.0));
}

vec4 renderSkyClouds(in vec3 ro, in vec3 rd, in float sceneViewZ, in bool useSceneDepth) {
  float sun = clamp(dot(uSunDir, rd), 0.0, 1.0);
  vec3 sunColor = vec3(1.0, 0.6, 0.2) * uLightColor * uLightIntensity;
  vec3 sunGlareColor = vec3(1.0, 0.4, 0.2) * uLightColor * uLightIntensity;

  vec3 procedural = uSkyColor - rd.y * 0.2 * vec3(1.0, 0.5, 1.0) + 0.15 * 0.5;
  procedural += 0.2 * sunColor * pow(sun, 8.0);

  float skyMix = clamp(uSkyMix, 0.0, 1.0);

  // Fog colour: the photo's own horizon at this azimuth, rising to zenith.
  vec3 horizonPhoto = photoHorizon(rd);
  vec3 photoGradient = mix(horizonPhoto, uSkyZenith, smoothstep(0.0, 0.6, rd.y));
  vec3 fogCol = mix(procedural, photoGradient, skyMix);

  vec4 res = raymarch(ro, rd, fogCol, sceneViewZ, useSceneDepth);

  if (uCloudsOnly > 0.5) return res;

  vec3 texA = sampleSkySlot(tSkyALo, tSkyAHi, uSkyFullMixA, rd, uSkyYaw);
  vec3 texB = sampleSkySlot(tSkyBLo, tSkyBHi, uSkyFullMixB, rd, uSkyYaw);
  vec3 texCol = mix(texA, texB, clamp(uSkyBlend, 0.0, 1.0));
  vec3 sky = mix(procedural, texCol, skyMix);

  vec3 col = sky * (1.0 - res.w) + res.xyz;
  col += 0.2 * sunGlareColor * pow(sun, 3.0) * mix(1.0, 0.15, skyMix);

  return vec4(col, clamp(res.w, 0.0, 1.0));
}

void main() {
  vec2 fragCoord = vUv * iResolution;
  vec2 p = (-iResolution.xy + 2.0 * fragCoord) / iResolution.y;

  vec3 ro = uCameraPos * uWorldScale;
  vec3 ta = uCameraTarget * uWorldScale;
  mat3 ca = setCamera(ro, ta, 0.0);
  float focal = max(0.05, uFocal);
  vec3 rd = ca * normalize(vec3(p.xy, focal));

  bool useSceneDepth = uHasSceneDepth > 0.5;
  float sceneViewZ = useSceneDepth ? sceneViewZAt(vUv) : -uCameraFar;

  vec4 skyCloud = renderSkyClouds(ro, rd, sceneViewZ, useSceneDepth);

  if (uCloudsOnly > 0.5) {
    gl_FragColor = skyCloud;
    return;
  }

  if (uHasBackgroundColor > 0.5) {
    vec4 behind = texture2D(tBackground, vUv);
    float cover = clamp(skyCloud.a + 0.08, 0.0, 1.0);
    skyCloud.rgb = mix(skyCloud.rgb, behind.rgb, behind.a * (1.0 - cover));
  }

  gl_FragColor = vec4(skyCloud.rgb, 1.0);
}
`
