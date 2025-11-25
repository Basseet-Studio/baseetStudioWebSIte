/**
 * Volumetric Cloud Shaders
 * Uses Raymarching inside a Box Volume
 */

export const vertexShader = `
varying vec3 vOrigin;
varying vec3 vDirection;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // Calculate ray origin and direction in OBJECT SPACE
    // This allows us to rotate/scale the box and have the volume follow
    vOrigin = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
    vDirection = position - vOrigin;
    
    gl_Position = projectionMatrix * mvPosition;
}
`;

export const fragmentShader = `
precision highp float;
precision highp sampler3D;

uniform sampler3D map;
uniform float threshold;
uniform float opacity;
uniform float steps;
uniform float time;
uniform vec3 lightDirection;
uniform vec3 cloudColor;

varying vec3 vOrigin;
varying vec3 vDirection;

// Blue Noise / Dithering
float hash(float n) {
    return fract(sin(n) * 43758.5453);
}

// Ray-Box Intersection
vec2 hitBox(vec3 orig, vec3 dir) {
    vec3 boxMin = vec3(-0.5);
    vec3 boxMax = vec3( 0.5);
    vec3 invDir = 1.0 / dir;
    vec3 tmin = (boxMin - orig) * invDir;
    vec3 tmax = (boxMax - orig) * invDir;
    vec3 t1 = min(tmin, tmax);
    vec3 t2 = max(tmin, tmax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    return vec2(tNear, tFar);
}

// Sample density with animation
float mapDensity(vec3 p) {
    // Keep p within box bounds
    if(max(abs(p.x), max(abs(p.y), abs(p.z))) > 0.5) return 0.0;

    vec3 texCoord = p + 0.5; // [0, 1]
    
    // Wind animation
    vec3 wind = vec3(0.0, 0.0, time * 0.05);
    vec3 samplePos = texCoord + wind;
    
    // Sample 3D noise directly
    float den = texture(map, samplePos).r;
    
    // Shaping
    // Thresholding to create gaps
    float t = threshold;
    den = smoothstep(t - 0.1, t + 0.1, den);
    
    // Height attenuation
    float distFromCenterY = abs(p.y) * 2.0;
    den *= smoothstep(1.0, 0.6, distFromCenterY);

    return den * opacity;
}

// IQ's Lighting Calculation
// "lighting is done with only one extra sample per raymarch step... directional derivative"
float getLight(vec3 p, vec3 lightDir, float den) {
    vec3 sundir = normalize(lightDir);
    
    // Directional derivative: sample towards the sun
    float denSun = mapDensity(p + 0.1 * sundir);
    
    // "dif = clamp((den - map(pos+0.3*sundir))/0.25, 0.0, 1.0 );"
    float dif = clamp((den - denSun) / 0.25, 0.0, 1.0);
    
    // "lin = vec3(0.65,0.65,0.75)*1.1 + 0.8*vec3(1.0,0.6,0.3)*dif;"
    // We can adjust these colors to match our theme (Blue/White)
    // Shadow/Ambient color
    vec3 amb = vec3(0.65, 0.7, 0.8); 
    // Sun/Highlight color
    vec3 sun = vec3(1.0, 0.9, 0.8); 
    
    float light = 0.5 + 0.5 * dif;
    
    return light; // Simplified return for integration
}

void main() {
    vec3 rayDir = normalize(vDirection);
    vec2 bounds = hitBox(vOrigin, rayDir);
    
    if (bounds.x > bounds.y) discard;
    
    float tStart = max(bounds.x, 0.0);
    float tEnd = bounds.y;
    
    if (tEnd < 0.0) discard;
    
    float distance = tEnd - tStart;
    float stepSize = distance / steps;
    
    // Dithering
    float noise = hash(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + time);
    vec3 pos = vOrigin + (tStart + noise * stepSize) * rayDir;
    
    vec4 sum = vec4(0.0);
    vec3 lightDir = normalize(lightDirection);
    
    // IQ's Raymarch Loop Structure
    for (float i = 0.0; i < 128.0; i++) {
        if (i >= steps) break;
        if (sum.a > 0.99) break;
        
        // Check bounds
        if (max(abs(pos.x), max(abs(pos.y), abs(pos.z))) > 0.5) break;
        
        float den = mapDensity(pos);
        
        if (den > 0.01) {
            // Lighting
            // Calculate diffuse based on directional derivative
            float denSun = mapDensity(pos + 0.05 * lightDir); // smaller step for derivative
            float dif = clamp((den - denSun) / 0.1, 0.0, 1.0);
            
            // Colors from IQ (adapted)
            vec3 lin = vec3(0.65, 0.65, 0.75) * 1.1 + 0.8 * vec3(1.0, 0.6, 0.3) * dif;
            
            // Mix density into color
            vec4 col = vec4(mix(vec3(1.0, 0.95, 0.8), vec3(0.25, 0.3, 0.35), den), den);
            col.xyz *= lin;
            
            col.a *= 0.4; // Scale opacity
            col.rgb *= col.a;
            sum += col * (1.0 - sum.a);
        }
        
        pos += rayDir * stepSize;
    }
    
    gl_FragColor = clamp(sum, 0.0, 1.0);
}
`;
