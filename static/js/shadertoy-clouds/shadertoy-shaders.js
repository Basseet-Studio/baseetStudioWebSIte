/**
 * Shadertoy Shaders - Vertex and Fragment shaders for volumetric clouds
 * 
 * This module contains the GLSL shaders converted from Shadertoy to work with Three.js.
 * The original shader is by Inigo Quilez and has been adapted to use Three.js uniforms
 * and conventions while maintaining the visual quality of the original.
 * 
 * Original Shadertoy: https://www.shadertoy.com/view/XslGRr
 * Copyright Inigo Quilez, 2013 - https://iquilezles.org/
 */

/**
 * Vertex Shader
 * Simple pass-through shader that provides UV coordinates and world position
 */
export const vertexShader = `
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * Fragment Shader
 * Volumetric cloud rendering using raymarching and fBM noise
 * Converted from Shadertoy GLSL to Three.js compatible GLSL
 */
export const fragmentShader = `
// Uniforms - Shadertoy variables mapped to Three.js
uniform float uTime;           // iTime
uniform vec2 uResolution;      // iResolution
uniform vec2 uMouse;           // iMouse (normalized 0-1)
uniform float uScroll;         // Scroll progress (0-1)
uniform sampler2D uChannel0;   // Noise texture
uniform sampler2D uChannel1;   // Blue noise texture
uniform sampler2D uChannel2;   // 3D noise texture (optional)
uniform sampler2D uChannel3;   // Additional texture (optional)
uniform int uLookMode;         // 0: sunset, 1: bright
uniform int uNoiseMethod;      // 0: 3D texture, 1: 2D with hardware interp, 2: 2D with software interp
uniform int uUseLOD;           // 0: no LOD, 1: yes LOD

varying vec2 vUv;
varying vec3 vWorldPosition;

// Camera setup function
mat3 setCamera(in vec3 ro, in vec3 ta, float cr) {
    vec3 cw = normalize(ta - ro);
    vec3 cp = vec3(sin(cr), cos(cr), 0.0);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = normalize(cross(cu, cw));
    return mat3(cu, cv, cw);
}

// 3D noise function using texture lookups
float noise(in vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);

    if (uNoiseMethod == 0) {
        // Method 0: one 3D texture lookup
        vec3 samplePos = p + f;
        return texture2D(uChannel2, (samplePos.xy + 0.5) / 32.0).x * 2.0 - 1.0;
    } else if (uNoiseMethod == 1) {
        // Method 1: two 2D texture lookups with hardware interpolation
        vec2 uv = (p.xy + vec2(37.0, 239.0) * p.z) + f.xy;
        vec2 rg = texture2D(uChannel0, (uv + 0.5) / 256.0).yx;
        return mix(rg.x, rg.y, f.z) * 2.0 - 1.0;
    } else {
        // Method 2: two 2D texture lookups with software interpolation
        // Note: texelFetch not available in WebGL 1.0, using texture2D instead
        ivec3 q = ivec3(p);
        vec2 uv = vec2(q.xy + ivec2(37, 239) * q.z);
        vec2 uv0 = (uv) / 256.0;
        vec2 uv1 = (uv + vec2(1.0, 0.0)) / 256.0;
        vec2 uv2 = (uv + vec2(0.0, 1.0)) / 256.0;
        vec2 uv3 = (uv + vec2(1.0, 1.0)) / 256.0;
        
        vec2 rg = mix(
            mix(texture2D(uChannel0, uv0), texture2D(uChannel0, uv1), f.x),
            mix(texture2D(uChannel0, uv2), texture2D(uChannel0, uv3), f.x),
            f.y
        ).yx;
        return mix(rg.x, rg.y, f.z) * 2.0 - 1.0;
    }
}

// Cloud density function with 5 octaves (highest quality)
float map5(in vec3 p) {
    vec3 q = p - vec3(0.0, 0.1, 1.0) * uTime;
    float f;
    f  = 0.50000 * noise(q); q = q * 2.02;
    f += 0.25000 * noise(q); q = q * 2.03;
    f += 0.12500 * noise(q); q = q * 2.01;
    f += 0.06250 * noise(q); q = q * 2.02;
    f += 0.03125 * noise(q);
    return clamp(1.5 - p.y - 2.0 + 1.75 * f, 0.0, 1.0);
}

// Cloud density function with 4 octaves
float map4(in vec3 p) {
    vec3 q = p - vec3(0.0, 0.1, 1.0) * uTime;
    float f;
    f  = 0.50000 * noise(q); q = q * 2.02;
    f += 0.25000 * noise(q); q = q * 2.03;
    f += 0.12500 * noise(q); q = q * 2.01;
    f += 0.06250 * noise(q);
    return clamp(1.5 - p.y - 2.0 + 1.75 * f, 0.0, 1.0);
}

// Cloud density function with 3 octaves
float map3(in vec3 p) {
    vec3 q = p - vec3(0.0, 0.1, 1.0) * uTime;
    float f;
    f  = 0.50000 * noise(q); q = q * 2.02;
    f += 0.25000 * noise(q); q = q * 2.03;
    f += 0.12500 * noise(q);
    return clamp(1.5 - p.y - 2.0 + 1.75 * f, 0.0, 1.0);
}

// Cloud density function with 2 octaves (lowest quality, for distant clouds)
float map2(in vec3 p) {
    vec3 q = p - vec3(0.0, 0.1, 1.0) * uTime;
    float f;
    f  = 0.50000 * noise(q);
    q = q * 2.02;
    f += 0.25000 * noise(q);
    return clamp(1.5 - p.y - 2.0 + 1.75 * f, 0.0, 1.0);
}

// Sun direction constant
const vec3 sundir = vec3(-0.7071, 0.0, -0.7071);

// Raymarch through the cloud volume with LOD support
vec4 raymarch(in vec3 ro, in vec3 rd, in vec3 bgcol, in ivec2 px) {
    vec4 sum = vec4(0.0);
    
    // Dithered start position using blue noise
    float t = 0.05 * texture2D(uChannel1, vec2(px & 255) / 256.0).x;
    
    // March with map5 (highest detail, 40 steps)
    for (int i = 0; i < 40; i++) {
        vec3 pos = ro + t * rd;
        if (pos.y < -3.0 || pos.y > 2.0 || sum.a > 0.99) break;
        
        float den = map5(pos);
        if (den > 0.01) {
            float dif = clamp((den - map5(pos + 0.3 * sundir)) / 0.6, 0.0, 1.0);
            vec3 lin = vec3(1.0, 0.6, 0.3) * dif + vec3(0.91, 0.98, 1.05);
            vec4 col = vec4(mix(vec3(1.0, 0.95, 0.8), vec3(0.25, 0.3, 0.35), den), den);
            col.xyz *= lin;
            col.xyz = mix(col.xyz, bgcol, 1.0 - exp(-0.003 * t * t));
            col.w *= 0.4;
            col.rgb *= col.a;
            sum += col * (1.0 - sum.a);
        }
        t += max(0.06, 0.05 * t);
    }
    
    // March with map4 (40 steps)
    for (int i = 0; i < 40; i++) {
        vec3 pos = ro + t * rd;
        if (pos.y < -3.0 || pos.y > 2.0 || sum.a > 0.99) break;
        
        float den = map4(pos);
        if (den > 0.01) {
            float dif = clamp((den - map4(pos + 0.3 * sundir)) / 0.6, 0.0, 1.0);
            vec3 lin = vec3(1.0, 0.6, 0.3) * dif + vec3(0.91, 0.98, 1.05);
            vec4 col = vec4(mix(vec3(1.0, 0.95, 0.8), vec3(0.25, 0.3, 0.35), den), den);
            col.xyz *= lin;
            col.xyz = mix(col.xyz, bgcol, 1.0 - exp(-0.003 * t * t));
            col.w *= 0.4;
            col.rgb *= col.a;
            sum += col * (1.0 - sum.a);
        }
        t += max(0.06, 0.05 * t);
    }
    
    // March with map3 (30 steps)
    for (int i = 0; i < 30; i++) {
        vec3 pos = ro + t * rd;
        if (pos.y < -3.0 || pos.y > 2.0 || sum.a > 0.99) break;
        
        float den = map3(pos);
        if (den > 0.01) {
            float dif = clamp((den - map3(pos + 0.3 * sundir)) / 0.6, 0.0, 1.0);
            vec3 lin = vec3(1.0, 0.6, 0.3) * dif + vec3(0.91, 0.98, 1.05);
            vec4 col = vec4(mix(vec3(1.0, 0.95, 0.8), vec3(0.25, 0.3, 0.35), den), den);
            col.xyz *= lin;
            col.xyz = mix(col.xyz, bgcol, 1.0 - exp(-0.003 * t * t));
            col.w *= 0.4;
            col.rgb *= col.a;
            sum += col * (1.0 - sum.a);
        }
        t += max(0.06, 0.05 * t);
    }
    
    // March with map2 (lowest detail, 30 steps)
    for (int i = 0; i < 30; i++) {
        vec3 pos = ro + t * rd;
        if (pos.y < -3.0 || pos.y > 2.0 || sum.a > 0.99) break;
        
        float den = map2(pos);
        if (den > 0.01) {
            float dif = clamp((den - map2(pos + 0.3 * sundir)) / 0.6, 0.0, 1.0);
            vec3 lin = vec3(1.0, 0.6, 0.3) * dif + vec3(0.91, 0.98, 1.05);
            vec4 col = vec4(mix(vec3(1.0, 0.95, 0.8), vec3(0.25, 0.3, 0.35), den), den);
            col.xyz *= lin;
            col.xyz = mix(col.xyz, bgcol, 1.0 - exp(-0.003 * t * t));
            col.w *= 0.4;
            col.rgb *= col.a;
            sum += col * (1.0 - sum.a);
        }
        t += max(0.06, 0.05 * t);
    }
    
    return clamp(sum, 0.0, 1.0);
}

// Main render function - combines sky, clouds, and sun glare
vec4 render(in vec3 ro, in vec3 rd, in ivec2 px) {
    // Background sky
    float sun = clamp(dot(sundir, rd), 0.0, 1.0);
    vec3 col = vec3(0.6, 0.71, 0.75) - rd.y * 0.2 * vec3(1.0, 0.5, 1.0) + 0.15 * 0.5;
    col += 0.2 * vec3(1.0, 0.6, 0.1) * pow(sun, 8.0);
    
    // Clouds
    vec4 res = raymarch(ro, rd, col, px);
    col = col * (1.0 - res.w) + res.xyz;
    
    // Sun glare
    col += vec3(0.2, 0.08, 0.04) * pow(sun, 3.0);
    
    return vec4(col, 1.0);
}

void main() {
    // Convert from UV coordinates to Shadertoy-style fragCoord
    vec2 fragCoord = vUv * uResolution;
    
    // Normalized pixel coordinates (from -1 to 1)
    vec2 p = (2.0 * fragCoord - uResolution) / uResolution.y;
    vec2 m = uMouse;
    
    // Camera setup
    vec3 ro = 4.0 * normalize(vec3(sin(3.0 * m.x), 0.8 * m.y, cos(3.0 * m.x))) - vec3(0.0, 0.1, 0.0);
    vec3 ta = vec3(0.0, -1.0, 0.0);
    mat3 ca = setCamera(ro, ta, 0.07 * cos(0.25 * uTime));
    
    // Ray direction
    vec3 rd = ca * normalize(vec3(p.xy, 1.5));
    
    // Render the scene
    gl_FragColor = render(ro, rd, ivec2(fragCoord - 0.5));
}
`;

/**
 * Get shader material configuration for Three.js
 * 
 * @param {Object} textures - Object containing channel0, channel1, channel2, channel3 textures
 * @param {Object} options - Optional configuration overrides
 * @returns {Object} Shader material configuration object
 */
export function getShaderConfig(textures, options = {}) {
    return {
        uniforms: {
            uTime: { value: 0.0 },
            uResolution: { value: options.resolution || { x: window.innerWidth, y: window.innerHeight } },
            uMouse: { value: options.mouse || { x: 0.5, y: 0.5 } },
            uScroll: { value: 0.0 },
            uChannel0: { value: textures.channel0 || null },
            uChannel1: { value: textures.channel1 || null },
            uChannel2: { value: textures.channel2 || null },
            uChannel3: { value: textures.channel3 || null },
            uLookMode: { value: options.lookMode !== undefined ? options.lookMode : 1 },
            uNoiseMethod: { value: options.noiseMethod !== undefined ? options.noiseMethod : 1 },
            uUseLOD: { value: options.useLOD !== undefined ? options.useLOD : 1 }
        },
        vertexShader,
        fragmentShader
    };
}
