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
// Returns vec2(near, far). if near > far, no intersection.
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
float sampleDensity(vec3 p) {
    // p is in object space [-0.5, 0.5]
    vec3 texCoord = p + 0.5; // [0, 1]
    
    // Animate texture coordinates
    // Move texture opposite to "wind"
    vec3 wind = vec3(0.0, 0.0, time * 0.05); 
    vec3 samplePos = texCoord + wind;
    
    float d = texture(map, samplePos).r;
    
    // Noise shaping
    // Smoothstep for soft clouds
    float t = threshold;
    return smoothstep(t - 0.1, t + 0.1, d) * opacity;
}

// Lighting: Beer's Law + Powder Effect + Phase Function
float getLight(vec3 p, vec3 lightDir, vec3 viewDir) {
    float stepSize = 0.05;
    float density = 0.0;
    vec3 q = p;
    
    // March towards light
    for(int i=0; i<4; i++) {
        q += lightDir * stepSize;
        // Simple bounds check (approximate)
        if(max(abs(q.x), max(abs(q.y), abs(q.z))) > 0.5) break;
        
        density += sampleDensity(q);
    }
    
    // Beer's Law
    float transmittance = exp(-density * 2.0);
    
    // Powder Effect (dark edges)
    float powder = 1.0 - exp(-density * 4.0);
    
    // Phase Function (Henyey-Greenstein) - directional scattering
    // float g = 0.4; // forward scattering
    // float cosTheta = dot(normalize(viewDir), lightDir);
    // float phase = (1.0 - g*g) / pow(1.0 + g*g - 2.0*g*cosTheta, 1.5) / 12.56; // Normalized
    
    // Simplified phase for performance/aesthetics
    float phase = 1.0; 

    return transmittance * (0.5 + 0.5 * powder) * phase;
}

void main() {
    vec3 rayDir = normalize(vDirection);
    vec2 bounds = hitBox(vOrigin, rayDir);
    
    // No intersection
    if (bounds.x > bounds.y) discard;
    
    // Handle camera inside box
    // If tNear < 0, we are inside. Start at 0.
    float tStart = max(bounds.x, 0.0);
    float tEnd = bounds.y;
    
    // If tEnd < 0, box is behind us
    if (tEnd < 0.0) discard;
    
    float distance = tEnd - tStart;
    float stepSize = distance / steps;
    
    // Dithering
    float noise = hash(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + time);
    vec3 pos = vOrigin + (tStart + noise * stepSize) * rayDir;
    
    vec4 accumColor = vec4(0.0);
    vec3 lightDir = normalize(lightDirection);
    
    for (float i = 0.0; i < 64.0; i++) {
        if (i >= steps) break;
        
        // Check if we left the box (redundant with tEnd but safe)
        if (max(abs(pos.x), max(abs(pos.y), abs(pos.z))) > 0.501) break;
        
        float density = sampleDensity(pos);
        
        if (density > 0.001) {
            float light = getLight(pos, lightDir, rayDir);
            
            vec3 col = cloudColor * light;
            
            // Ambient
            col += vec3(0.05, 0.1, 0.2) * 0.3;
            
            vec4 src = vec4(col, density);
            src.rgb *= src.a;
            accumColor = accumColor + src * (1.0 - accumColor.a);
        }
        
        if (accumColor.a >= 0.99) break;
        
        pos += rayDir * stepSize;
    }
    
    gl_FragColor = accumColor;
}
`;
