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

import * as THREE from 'three';

/**
 * Vertex Shader
 * Simple pass-through shader that provides UV coordinates
 */
export const vertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * Fragment Shader
 * Volumetric cloud rendering using raymarching and fBM noise
 * Converted from Shadertoy GLSL to Three.js compatible GLSL
 * 
 * This is the "bright" look (LOOK=1) from the original shader
 */
export const fragmentShader = `
precision highp float;

// Uniforms - Shadertoy variables mapped to Three.js
uniform float uTime;           // iTime
uniform vec2 uResolution;      // iResolution
uniform vec2 uMouse;           // iMouse (normalized 0-1)
uniform float uScroll;         // Scroll progress (0-1)
uniform sampler2D uChannel0;   // Noise texture (256x256 RGBA)
uniform sampler2D uChannel1;   // Blue noise texture for dithering
uniform sampler2D uChannel2;   // 3D noise texture (optional)
uniform sampler2D uChannel3;   // Additional texture (optional)
uniform float uDebugMode;      // Debug visualization mode (float for GLSL compatibility)

varying vec2 vUv;

// Camera setup function - creates a camera matrix from position/target
mat3 setCamera(in vec3 ro, in vec3 ta, float cr) {
    vec3 cw = normalize(ta - ro);
    vec3 cp = vec3(sin(cr), cos(cr), 0.0);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = normalize(cross(cu, cw));
    return mat3(cu, cv, cw);
}

// 3D noise function using 2D texture lookups with hardware interpolation
// Uses quintic interpolation for C2 continuity (smoother than cubic)
// This matches the improved method from Inigo Quilez
float noise(in vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    
    // Quintic Hermite interpolation for C2 continuity
    // This produces much smoother results than cubic (3x^2 - 2x^3)
    f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

    // 2D texture lookup with proper offset for 3D noise simulation
    // The magic numbers 37.0 and 239.0 are primes to reduce correlation
    vec2 uv = (p.xy + vec2(37.0, 239.0) * p.z) + f.xy;
    
    // Sample the noise texture with proper normalization
    // Adding 0.5 centers the lookup within the texel
    vec2 rg = texture2D(uChannel0, (uv + 0.5) / 256.0).yx;
    
    // Interpolate between the two samples using the z-component
    // and map from [0,1] to [-1,1] range
    return mix(rg.x, rg.y, f.z) * 2.0 - 1.0;
}

// Cloud density functions with different octave counts (LOD)
// Using slightly varied frequency multipliers to prevent alignment artifacts
// map5: highest quality (5 octaves)
float map5(in vec3 p) {
    vec3 q = p - vec3(0.0, 0.1, 1.0) * uTime;
    float f;
    f  = 0.50000 * noise(q); q = q * 2.02;
    f += 0.25000 * noise(q); q = q * 2.03;
    f += 0.12500 * noise(q); q = q * 2.01;
    f += 0.06250 * noise(q); q = q * 2.02;
    f += 0.03125 * noise(q);
    // Smoother density falloff with smoothstep for softer cloud edges
    float density = 1.5 - p.y - 2.0 + 1.75 * f;
    return smoothstep(0.0, 0.4, density) * clamp(density, 0.0, 1.0);
}

// map4: 4 octaves
float map4(in vec3 p) {
    vec3 q = p - vec3(0.0, 0.1, 1.0) * uTime;
    float f;
    f  = 0.50000 * noise(q); q = q * 2.02;
    f += 0.25000 * noise(q); q = q * 2.03;
    f += 0.12500 * noise(q); q = q * 2.01;
    f += 0.06250 * noise(q);
    float density = 1.5 - p.y - 2.0 + 1.75 * f;
    return smoothstep(0.0, 0.4, density) * clamp(density, 0.0, 1.0);
}

// map3: 3 octaves
float map3(in vec3 p) {
    vec3 q = p - vec3(0.0, 0.1, 1.0) * uTime;
    float f;
    f  = 0.50000 * noise(q); q = q * 2.02;
    f += 0.25000 * noise(q); q = q * 2.03;
    f += 0.12500 * noise(q);
    float density = 1.5 - p.y - 2.0 + 1.75 * f;
    return smoothstep(0.0, 0.4, density) * clamp(density, 0.0, 1.0);
}

// map2: lowest quality (2 octaves) for distant clouds
float map2(in vec3 p) {
    vec3 q = p - vec3(0.0, 0.1, 1.0) * uTime;
    float f;
    f  = 0.50000 * noise(q);
    q = q * 2.02;
    f += 0.25000 * noise(q);
    float density = 1.5 - p.y - 2.0 + 1.75 * f;
    return smoothstep(0.0, 0.4, density) * clamp(density, 0.0, 1.0);
}

// Sun direction (normalized)
const vec3 sundir = vec3(-0.7071, 0.0, -0.7071);

// Raymarch through the cloud volume
// Uses LOD (Level of Detail) - higher quality for nearby clouds
vec4 raymarch(in vec3 ro, in vec3 rd, in vec3 bgcol, in vec2 fragCoord) {
    vec4 sum = vec4(0.0);
    
    // Improved dithering using interleaved gradient noise pattern
    // This reduces banding artifacts significantly better than simple blue noise
    vec2 ditherUV = fragCoord / 256.0;
    float dither = texture2D(uChannel1, ditherUV).x;
    // Add screen-space variation to break up patterns
    float screenNoise = fract(sin(dot(fragCoord, vec2(12.9898, 78.233))) * 43758.5453);
    float t = 0.05 * mix(dither, screenNoise, 0.3);
    
    // March with map5 (highest detail, 40 steps)
    for (int i = 0; i < 40; i++) {
        vec3 pos = ro + t * rd;
        if (pos.y < -3.0 || pos.y > 2.0 || sum.a > 0.99) break;
        
        float den = map5(pos);
        if (den > 0.01) {
            // Improved lighting with softer shadow falloff
            // Using larger offset and smoother gradient for more natural light scattering
            float dif = clamp((den - map5(pos + 0.4 * sundir)) / 0.8, 0.0, 1.0);
            // Smooth the lighting transition
            dif = smoothstep(0.0, 1.0, dif);
            // Warmer sunlight, cooler ambient for realistic cloud illumination
            vec3 lin = vec3(1.0, 0.7, 0.4) * dif + vec3(0.85, 0.92, 1.0);
            // Softer color gradient based on density
            vec4 col = vec4(mix(vec3(1.0, 0.97, 0.92), vec3(0.35, 0.4, 0.5), smoothstep(0.0, 0.8, den)), den);
            col.xyz *= lin;
            // Distance fog with softer falloff
            col.xyz = mix(col.xyz, bgcol, 1.0 - exp(-0.0025 * t * t));
            col.w *= 0.35;
            // Front-to-back compositing
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
            float dif = clamp((den - map4(pos + 0.4 * sundir)) / 0.8, 0.0, 1.0);
            dif = smoothstep(0.0, 1.0, dif);
            vec3 lin = vec3(1.0, 0.7, 0.4) * dif + vec3(0.85, 0.92, 1.0);
            vec4 col = vec4(mix(vec3(1.0, 0.97, 0.92), vec3(0.35, 0.4, 0.5), smoothstep(0.0, 0.8, den)), den);
            col.xyz *= lin;
            col.xyz = mix(col.xyz, bgcol, 1.0 - exp(-0.0025 * t * t));
            col.w *= 0.35;
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
            float dif = clamp((den - map3(pos + 0.4 * sundir)) / 0.8, 0.0, 1.0);
            dif = smoothstep(0.0, 1.0, dif);
            vec3 lin = vec3(1.0, 0.7, 0.4) * dif + vec3(0.85, 0.92, 1.0);
            vec4 col = vec4(mix(vec3(1.0, 0.97, 0.92), vec3(0.35, 0.4, 0.5), smoothstep(0.0, 0.8, den)), den);
            col.xyz *= lin;
            col.xyz = mix(col.xyz, bgcol, 1.0 - exp(-0.0025 * t * t));
            col.w *= 0.35;
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
            float dif = clamp((den - map2(pos + 0.4 * sundir)) / 0.8, 0.0, 1.0);
            dif = smoothstep(0.0, 1.0, dif);
            vec3 lin = vec3(1.0, 0.7, 0.4) * dif + vec3(0.85, 0.92, 1.0);
            vec4 col = vec4(mix(vec3(1.0, 0.97, 0.92), vec3(0.35, 0.4, 0.5), smoothstep(0.0, 0.8, den)), den);
            col.xyz *= lin;
            col.xyz = mix(col.xyz, bgcol, 1.0 - exp(-0.0025 * t * t));
            col.w *= 0.35;
            col.rgb *= col.a;
            sum += col * (1.0 - sum.a);
        }
        t += max(0.06, 0.05 * t);
    }
    
    return clamp(sum, 0.0, 1.0);
}

// Main render function - combines sky, clouds, and sun glare
vec4 render(in vec3 ro, in vec3 rd, in vec2 fragCoord) {
    // Background sky gradient
    float sun = clamp(dot(sundir, rd), 0.0, 1.0);
    vec3 col = vec3(0.6, 0.71, 0.75) - rd.y * 0.2 * vec3(1.0, 0.5, 1.0) + 0.15 * 0.5;
    col += 0.2 * vec3(1.0, 0.6, 0.1) * pow(sun, 8.0);
    
    // Raymarch clouds
    vec4 res = raymarch(ro, rd, col, fragCoord);
    col = col * (1.0 - res.w) + res.xyz;
    
    // Sun glare
    col += vec3(0.2, 0.08, 0.04) * pow(sun, 3.0);
    
    return vec4(col, 1.0);
}

void main() {
    // Convert from UV coordinates to Shadertoy-style fragCoord
    vec2 fragCoord = vUv * uResolution;
    
    // Debug mode visualizations (use float comparisons)
    if (uDebugMode > 0.5 && uDebugMode < 1.5) {
        // Show UV coordinates (red-green gradient)
        gl_FragColor = vec4(vUv, 0.0, 1.0);
        return;
    }
    if (uDebugMode > 1.5 && uDebugMode < 2.5) {
        // Show normalized screen coordinates
        vec2 p = (2.0 * fragCoord - uResolution) / uResolution.y;
        gl_FragColor = vec4(p * 0.5 + 0.5, 0.0, 1.0);
        return;
    }
    if (uDebugMode > 2.5 && uDebugMode < 3.5) {
        // Show ray direction
        vec2 p = (2.0 * fragCoord - uResolution) / uResolution.y;
        vec3 rd = normalize(vec3(p.xy, 1.5));
        gl_FragColor = vec4(rd * 0.5 + 0.5, 1.0);
        return;
    }
    if (uDebugMode > 3.5 && uDebugMode < 4.5) {
        // Show noise texture
        vec4 tex = texture2D(uChannel0, vUv);
        gl_FragColor = tex;
        return;
    }
    if (uDebugMode > 4.5 && uDebugMode < 5.5) {
        // Show blue solid color (simplest test)
        gl_FragColor = vec4(0.4, 0.6, 0.9, 1.0);
        return;
    }
    
    // Normalized pixel coordinates (from -aspect to aspect, -1 to 1)
    vec2 p = (2.0 * fragCoord - uResolution) / uResolution.y;
    
    // Mouse position (normalized 0-1, default to center)
    vec2 m = uMouse;
    
    // Camera setup - orbit around the scene based on mouse
    vec3 ro = 4.0 * normalize(vec3(sin(3.0 * m.x), 0.8 * m.y, cos(3.0 * m.x))) - vec3(0.0, 0.1, 0.0);
    vec3 ta = vec3(0.0, -1.0, 0.0);
    mat3 ca = setCamera(ro, ta, 0.07 * cos(0.25 * uTime));
    
    // Ray direction
    vec3 rd = ca * normalize(vec3(p.xy, 1.5));
    
    // Render the scene
    gl_FragColor = render(ro, rd, fragCoord);
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
            uResolution: { value: options.resolution || new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uMouse: { value: options.mouse || new THREE.Vector2(0.5, 0.5) },
            uScroll: { value: 0.0 },
            uChannel0: { value: textures.channel0 || null },
            uChannel1: { value: textures.channel1 || null },
            uChannel2: { value: textures.channel2 || null },
            uChannel3: { value: textures.channel3 || null },
            uLookMode: { value: options.lookMode !== undefined ? parseFloat(options.lookMode) : 1.0 },
            uNoiseMethod: { value: options.noiseMethod !== undefined ? parseFloat(options.noiseMethod) : 1.0 },
            uDebugMode: { value: options.debugMode !== undefined ? parseFloat(options.debugMode) : 0.0 }
        },
        vertexShader,
        fragmentShader
    };
}
