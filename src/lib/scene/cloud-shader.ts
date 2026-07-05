/**
 * Ported from tool-craft/clouds-playground/src/app/renderer/cloud-shader.ts
 * (Vanta.js CLOUDS raymarch). Site-specific additions:
 * - uLightColor tints sunlight in integrate() / renderSkyClouds()
 * - Depth textures + background color from model pre-passes for behind/middle/in-front compositing
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

float fbm(in vec3 p, in int octaves) {
  vec3 speed1 = vec3(0.5, 0.01, 1.0) * 0.5 * uSpeed;
  vec3 q = p - speed1 * (iTime + constantTime);
  float f = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    if (i >= octaves) break;
    f += amp * noise(q) * (1.0 + uNoise);
    q *= 2.0 + 0.02 * float(i);
    amp *= 0.5;
  }
  float coverageBias = (uDensity - 0.6) * 2.2;
  float verticalScale = mix(2.6, 1.2, clamp(uVerticalSpread, 0.0, 1.0));
  return clamp(1.5 - p.y * verticalScale - 2.0 + coverageBias + 1.75 * f, 0.0, 1.0);
}

vec4 integrate(in vec4 sum, in float dif, in float den, in vec3 bgcol, in float t) {
  vec3 cloudShadowColor = uCloudColor * 0.5;
  vec3 baseSunlight = mix(vec3(1.0, 0.95, 0.85), vec3(1.0, 0.78, 0.55), 0.4);
  vec3 sunlightColor = baseSunlight * uLightColor * uLightIntensity;
  vec3 lin = uCloudColor * 1.4 + sunlightColor * dif;
  vec4 col = vec4(mix(vec3(1.0, 0.95, 0.8), cloudShadowColor, den), den);
  col.rgb *= lin;
  float fogAmount = 1.0 - exp(-mix(0.0006, 0.02, uFogDensity) * t * t);
  col.rgb = mix(col.rgb, bgcol, fogAmount);
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

vec4 raymarch(in vec3 ro, in vec3 rd, in vec3 bgcol, in float sceneViewZ, in bool useSceneDepth) {
  vec4 sum = vec4(0.0);
  float t = 0.0;

  for (int i = 0; i < 20; i++) {
    vec3 pos = ro + t * rd;
    if (pos.y < -3.0 || pos.y > 2.0 || sum.a > 0.99) break;
    if (useSceneDepth && isSampleBehindScene(pos, sceneViewZ)) break;
    float den = fbm(pos, 5);
    if (den > 0.01) {
      float dif = clamp((den - fbm(pos + 0.3 * uSunDir, 5)) / 0.6, 0.0, 1.0);
      sum = integrate(sum, dif, den, bgcol, t);
    }
    t += max(0.075, 0.02 * t);
  }
  for (int i = 0; i < 25; i++) {
    vec3 pos = ro + t * rd;
    if (pos.y < -3.0 || pos.y > 2.0 || sum.a > 0.99) break;
    if (useSceneDepth && isSampleBehindScene(pos, sceneViewZ)) break;
    float den = fbm(pos, 4);
    if (den > 0.01) {
      float dif = clamp((den - fbm(pos + 0.3 * uSunDir, 4)) / 0.6, 0.0, 1.0);
      sum = integrate(sum, dif, den, bgcol, t);
    }
    t += max(0.075, 0.02 * t);
  }
  for (int i = 0; i < 30; i++) {
    vec3 pos = ro + t * rd;
    if (pos.y < -3.0 || pos.y > 2.0 || sum.a > 0.99) break;
    if (useSceneDepth && isSampleBehindScene(pos, sceneViewZ)) break;
    float den = fbm(pos, 3);
    if (den > 0.01) {
      float dif = clamp((den - fbm(pos + 0.3 * uSunDir, 3)) / 0.6, 0.0, 1.0);
      sum = integrate(sum, dif, den, bgcol, t);
    }
    t += max(0.075, 0.02 * t);
  }
  for (int i = 0; i < 40; i++) {
    vec3 pos = ro + t * rd;
    if (pos.y < -3.0 || pos.y > 2.0 || sum.a > 0.99) break;
    if (useSceneDepth && isSampleBehindScene(pos, sceneViewZ)) break;
    float den = fbm(pos, 2);
    if (den > 0.01) {
      float dif = clamp((den - fbm(pos + 0.3 * uSunDir, 2)) / 0.6, 0.0, 1.0);
      sum = integrate(sum, dif, den, bgcol, t);
    }
    t += max(0.075, 0.02 * t);
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

vec4 renderSkyClouds(in vec3 ro, in vec3 rd, in float sceneViewZ, in bool useSceneDepth) {
  float sun = clamp(dot(uSunDir, rd), 0.0, 1.0);
  vec3 sunColor = vec3(1.0, 0.6, 0.2) * uLightColor * uLightIntensity;
  vec3 sunGlareColor = vec3(1.0, 0.4, 0.2) * uLightColor * uLightIntensity;

  vec3 col = uSkyColor - rd.y * 0.2 * vec3(1.0, 0.5, 1.0) + 0.15 * 0.5;
  col += 0.2 * sunColor * pow(sun, 8.0);

  vec4 res = raymarch(ro, rd, col, sceneViewZ, useSceneDepth);
  col = col * (1.0 - res.w) + res.xyz;

  col += 0.2 * sunGlareColor * pow(sun, 3.0);

  return vec4(col, clamp(res.w, 0.0, 1.0));
}

void main() {
  vec2 fragCoord = vUv * iResolution;
  vec2 p = (-iResolution.xy + 2.0 * fragCoord) / iResolution.y;

  vec3 ro = uCameraPos * uWorldScale;
  vec3 ta = uCameraTarget * uWorldScale + vec3(0.0, -1.0, 0.0);
  mat3 ca = setCamera(ro, ta, 0.0);
  vec3 rd = ca * normalize(vec3(p.xy, 1.5));

  bool useSceneDepth = uHasSceneDepth > 0.5;
  float sceneViewZ = useSceneDepth ? sceneViewZAt(vUv) : -uCameraFar;

  vec4 skyCloud = renderSkyClouds(ro, rd, sceneViewZ, useSceneDepth);

  if (uHasBackgroundColor > 0.5) {
    vec3 behind = texture2D(tBackground, vUv).rgb;
    float cover = clamp(skyCloud.a + 0.08, 0.0, 1.0);
    skyCloud.rgb = mix(behind, skyCloud.rgb, cover);
  }

  gl_FragColor = vec4(skyCloud.rgb, 1.0);
}
`
