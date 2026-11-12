/**
 * Full-resolution sky pass. Samples the equirect sky photo per pixel at device
 * resolution and composites the (lower-res, premultiplied) cloud render target
 * over it exactly once. Equirect helpers mirror cloud-shader.ts — keep in sync.
 */

export const skyCompositeVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

export const skyCompositeFragmentShader = /* glsl */ `
precision highp float;
varying vec2 vUv;

uniform vec2 uResolution;
uniform sampler2D tClouds;
uniform sampler2D tBackground;
uniform float uHasBackgroundColor;
uniform sampler2D tMiddle;
uniform float uHasMiddle;

uniform vec3 uCameraPos;
uniform vec3 uCameraTarget;
uniform float uWorldScale;
uniform float uFocal;

uniform vec3 uSkyColor;
uniform vec3 uCloudColor;
uniform vec3 uSunDir;
uniform vec3 uLightColor;
uniform float uLightIntensity;

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
uniform float uSkyFloor;

mat3 setCamera(in vec3 ro, in vec3 ta) {
  vec3 cw = normalize(ta - ro);
  vec3 cp = vec3(0.0, 1.0, 0.0);
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

vec3 sampleEquirect(in sampler2D tex, in vec3 rd, in float yaw) {
  float cy = cos(yaw);
  float sy = sin(yaw);
  vec3 d = vec3(rd.x * cy - rd.z * sy, rd.y, rd.x * sy + rd.z * cy);
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
  return mix(sampleEquirect(lo, rd, yaw), sampleEquirect(hi, rd, yaw), clamp(fullMix, 0.0, 1.0));
}

void main() {
  vec2 p = (2.0 * vUv - 1.0) * vec2(uResolution.x / max(1.0, uResolution.y), 1.0);
  vec3 ro = uCameraPos * uWorldScale;
  vec3 ta = uCameraTarget * uWorldScale;
  vec3 rd = setCamera(ro, ta) * normalize(vec3(p, max(0.05, uFocal)));

  float sun = clamp(dot(uSunDir, rd), 0.0, 1.0);
  vec3 sunColor = vec3(1.0, 0.6, 0.2) * uLightColor * uLightIntensity;
  vec3 sunGlareColor = vec3(1.0, 0.4, 0.2) * uLightColor * uLightIntensity;

  vec3 procedural = uSkyColor - rd.y * 0.2 * vec3(1.0, 0.5, 1.0) + 0.075;
  procedural += 0.2 * sunColor * pow(sun, 8.0);

  float skyMix = clamp(uSkyMix, 0.0, 1.0);
  vec3 texA = sampleSkySlot(tSkyALo, tSkyAHi, uSkyFullMixA, rd, uSkyYaw);
  vec3 texB = sampleSkySlot(tSkyBLo, tSkyBHi, uSkyFullMixB, rd, uSkyYaw);
  vec3 sky = mix(procedural, mix(texA, texB, clamp(uSkyBlend, 0.0, 1.0)), skyMix);

  // Middle models sit between sky and clouds: the cloud raymarch already
  // stopped at their depth, so cloud alpha here = clouds IN FRONT of them.
  if (uHasMiddle > 0.5) {
    vec4 mid = texture2D(tMiddle, vUv);
    sky = mix(sky, mid.rgb, mid.a);
  }
  vec4 clouds = texture2D(tClouds, vUv);
  vec3 col = sky * (1.0 - clouds.a) + clouds.rgb;

  col += 0.2 * sunGlareColor * pow(sun, 3.0) * mix(1.0, 0.15, skyMix);

  if (uHasBackgroundColor > 0.5) {
    vec4 behind = texture2D(tBackground, vUv);
    float cover = clamp(clouds.a + 0.08, 0.0, 1.0);
    col = mix(col, behind.rgb, behind.a * (1.0 - cover));
  }

  gl_FragColor = vec4(col, 1.0);
}
`
