/**
 * Ported from tool-craft/clouds-playground/src/app/renderer/cloud-shader.ts
 * (Vanta.js CLOUDS raymarch). Site-specific additions:
 * - THREE CLOUD CARPETS at different altitudes (low / mid / high), each with
 *   its own XZ coverage mask, so you see gaps through one carpet down to the
 *   next and, through the low one, to the satellite ground.
 * - Each carpet is marched only inside its own slab (analytic ray/slab
 *   entry + exit), front-to-back, so the empty air between carpets costs
 *   nothing. Order flips with the ray direction (down: high->mid->low).
 * - Low carpet = lowest detail: fewer octaves, bigger soft blobs, fewer steps.
 * - uLightColor tints sunlight in integrate() / renderSkyClouds()
 * - Depth texture from the model pre-pass stops the march at the landmark,
 *   so towers poke through every carpet correctly.
 *
 * Altitudes (world units; shader = world x 0.4):
 *   high carpet  ~ 12.5 .. 17.5  (patchy, thin)
 *   mid carpet   ~ -2.4 .. 3.3   (the original deck, a bit more gappy)
 *   low carpet   ~ -16.5 .. -9.5 (big soft blobs, mostly covers the ground)
 * Keep camera anchor heights OUT of those ranges (see scenes/pages.ts).
 *
 * Split pipeline (see sky-composite-shader.ts):
 * - uCloudsOnly = 1 (runtime default): outputs ONLY clouds as premultiplied
 *   rgb + alpha into a low-res target. The sky photo is drawn full-res later.
 * - uCloudsOnly = 0: legacy single-pass path.
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

// ---- Carpet tuning (shader units) ---------------------------------------
// LOW (layer 0)
const float kLowY = -5.2;
const float kLowCoverFreq = 0.12;
const float kLowCoverBias = 0.08;    // <0 = more coverage, >0 = more gaps
const float kLowDensity = 1.0;
const float kLowSpeedMul = 0.9;
const float kLowClumpMul = 0.6;      // x uLowClumpScale
const float kLowShade = 0.82;        // sits under two carpets: a bit darker
// MID (layer 1) — the original deck: two sub-bands
const float kMidLowY = -0.22;
const float kMidHighY = 0.62;
const float kMidLowCoverFreq = 0.22;
const float kMidHighCoverFreq = 0.55;
const float kMidCoverBias = 0.16;
const float kMidLowDensity = 1.15;
const float kMidHighDensity = 0.55;
const float kMidLowSpeedMul = 1.35;
const float kMidHighSpeedMul = 0.55;
// HIGH (layer 2)
const float kHighY = 6.0;
const float kHighCoverFreq = 0.30;
const float kHighCoverBias = 0.24;   // patchy
const float kHighDensity = 0.5;
const float kHighSpeedMul = 0.5;
const float kHighShade = 1.05;

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

float coverageMask(in vec2 xz, in float freq, in float speedMul, in float yOffset, in float bias) {
  vec2 wind = vec2(0.5, 1.0) * 0.25 * uSpeed * speedMul * (iTime + constantTime);
  vec2 q = xz * freq - wind;
  float n = 0.65 * noise(vec3(q.x, yOffset, q.y));
  n += 0.35 * noise(vec3(q.x * 2.03 + 17.1, yOffset + 3.7, q.y * 2.03));
  float edge = mix(0.88, 0.34, clamp(uDensity, 0.0, 1.0)) + bias;
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
  in float coverBias,
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
  float mask = coverageMask(seeded.xz, coverFreq * distFreq, speedMul, coverOffset, coverBias);
  if (mask < 0.01) {
    return 0.0;
  }
  float f = detailFbm(seeded * (clumpScale * distFreq), octaves, speedMul);
  float detail = clamp(1.75 * f - 0.35, 0.0, 1.0);
  return clamp(h * mask * densScale * detail, 0.0, 1.0);
}

float spreadT() {
  return clamp(uVerticalSpread, 0.0, 1.0);
}
float lowHalf() { return mix(1.0, 1.5, spreadT()); }
float midLowHalf() { return mix(0.38, 0.85, spreadT()); }
float midHighHalf() { return mix(0.40, 0.80, spreadT()); }
float highHalf() { return mix(0.7, 1.1, spreadT()); }

// Slab bounds per layer (x = bottom, y = top).
vec2 layerSlab(in int layer) {
  if (layer == 0) return vec2(kLowY - lowHalf(), kLowY + lowHalf());
  if (layer == 1) {
    return vec2(
      min(kMidLowY - midLowHalf(), kMidHighY - midHighHalf()),
      max(kMidLowY + midLowHalf(), kMidHighY + midHighHalf())
    );
  }
  return vec2(kHighY - highHalf(), kHighY + highHalf());
}

float layerDensity(in int layer, in vec3 p, in int octaves, in float t) {
  float apart = max(uApart, 0.01);
  if (layer == 0) {
    return bandDensity(
      p, octaves, t,
      kLowCoverFreq * apart, kLowCoverBias, uLowClumpScale * kLowClumpMul, kLowDensity, kLowSpeedMul,
      23.9, kLowY, lowHalf()
    );
  }
  if (layer == 1) {
    float dLow = bandDensity(
      p, octaves, t,
      kMidLowCoverFreq * apart, kMidCoverBias, uLowClumpScale, kMidLowDensity, kMidLowSpeedMul,
      2.7, kMidLowY, midLowHalf()
    );
    float dHigh = bandDensity(
      p, octaves, t,
      kMidHighCoverFreq * apart, kMidCoverBias, uHighClumpScale, kMidHighDensity, kMidHighSpeedMul,
      11.3, kMidHighY, midHighHalf()
    );
    return clamp(max(dLow, dHigh), 0.0, 1.0);
  }
  return bandDensity(
    p, octaves, t,
    kHighCoverFreq * apart, kHighCoverBias, uHighClumpScale, kHighDensity, kHighSpeedMul,
    41.7, kHighY, highHalf()
  );
}

// fogCol: smooth sky colour for this ray, matched to the photo's horizon.
vec4 integrate(in vec4 sum, in float dif, in float den, in vec3 fogCol, in float t, in float highBand, in float shade) {
  float skyMix = clamp(uSkyMix, 0.0, 1.0);
  vec3 cloudShadowColor = uCloudColor * 0.5;
  vec3 baseSunlight = mix(vec3(1.0, 0.95, 0.85), vec3(1.0, 0.78, 0.55), mix(0.55, 0.28, highBand));
  vec3 sunlightColor = baseSunlight * uLightColor * uLightIntensity;
  vec3 cloudAmbient = mix(uCloudColor, uSkyZenith, 0.35 * skyMix);
  vec3 lin = (cloudAmbient * 1.4 + sunlightColor * dif) * shade;
  vec4 col = vec4(mix(vec3(1.0, 0.95, 0.8), cloudShadowColor, den), den);
  col.rgb *= lin;

  // Linear distance fog, capped: distant clouds soften but never vanish.
  float fogAmount = 0.85 * (1.0 - exp(-mix(0.008, 0.05, uFogDensity) * t));

  col.rgb = mix(col.rgb, fogCol, fogAmount);
  col.a *= mix(1.0, 0.6, fogAmount * skyMix);
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

// Static per-pixel dither (hides step banding at the low-res cloud target).
float stepDither() {
  return fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
}

/**
 * March one carpet between its slab entry/exit.
 * Returns false when marching must stop for ALL carpets
 * (opaque, or the landmark is in front of what's left).
 */
bool marchLayer(
  in int layer,
  inout vec4 sum,
  in vec3 ro,
  in vec3 rd,
  in vec3 lightDir,
  in vec3 fogCol,
  in float sceneViewZ,
  in bool useSceneDepth,
  in float q,
  in float dither
) {
  vec2 slab = layerSlab(layer);
  float t0;
  float t1;
  if (abs(rd.y) < 1e-5) {
    if (ro.y < slab.x || ro.y > slab.y) return true;
    t0 = 0.0;
    t1 = kMaxT;
  } else {
    float ta = (slab.x - ro.y) / rd.y;
    float tb = (slab.y - ro.y) / rd.y;
    t0 = max(min(ta, tb), 0.0);
    t1 = min(max(ta, tb), kMaxT);
  }
  if (t1 <= t0) return true;

  int maxSteps;
  int octCap;
  float shade;
  if (layer == 0) {
    maxSteps = max(6, int(ceil(24.0 * q)));
    octCap = q > 0.6 ? 3 : 2;
    shade = kLowShade;
  } else if (layer == 1) {
    maxSteps = max(12, int(ceil(64.0 * q)));
    octCap = max(2, int(ceil(5.0 * q)));
    shade = 1.0;
  } else {
    maxSteps = max(6, int(ceil(18.0 * q)));
    octCap = max(2, int(ceil(4.0 * q)));
    shade = kHighShade;
  }
  float stepMul = mix(1.8, 1.0, q);
  float minSpan = (t1 - t0) / float(maxSteps);

  float t = t0 + max(0.075, 0.02 * t0) * stepMul * dither;
  for (int i = 0; i < 64; i++) {
    if (i >= maxSteps || t > t1) break;
    if (sum.a > 0.99) return false;
    vec3 pos = ro + t * rd;
    if (useSceneDepth && isSampleBehindScene(pos, sceneViewZ)) return false;

    int oct = t < 6.0 ? octCap : (t < 16.0 ? octCap - 1 : (t < 40.0 ? octCap - 2 : 2));
    oct = max(2, oct);
    float den = layerDensity(layer, pos, oct, t);
    if (den > 0.01) {
      int lightOct = oct > 3 ? 3 : oct;
      float dif = clamp((den - layerDensity(layer, pos + 0.3 * lightDir, lightOct, t)) / 0.45, 0.0, 1.0);
      float hb = layer == 2 ? 1.0 : (layer == 1 ? highBandWeight(pos.y) : 0.0);
      sum = integrate(sum, dif, den, fogCol, t, hb, shade);
    }
    t += max(max(0.075, 0.02 * t) * stepMul, minSpan);
  }
  return true;
}

vec4 raymarch(in vec3 ro, in vec3 rd, in vec3 fogCol, in float sceneViewZ, in bool useSceneDepth) {
  vec4 sum = vec4(0.0);
  float q = clamp(uQuality, 0.2, 1.0);
  float dither = stepDither();
  vec3 lightDir = normalize(vec3(uSunDir.x, max(uSunDir.y, kMinSunY), uSunDir.z));

  // Front-to-back: looking down -> high, mid, low. Looking up -> low, mid, high.
  bool down = rd.y < 0.0;
  for (int k = 0; k < 3; k++) {
    int layer = down ? 2 - k : k;
    if (!marchLayer(layer, sum, ro, rd, lightDir, fogCol, sceneViewZ, useSceneDepth, q, dither)) break;
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
