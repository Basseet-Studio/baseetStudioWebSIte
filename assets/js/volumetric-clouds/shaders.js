/**
 * Volumetric Cloud Raymarching Shaders
 * Implements vertex and fragment shaders for volumetric cloud rendering
 */

/**
 * Vertex Shader
 * Calculates ray origin (camera position in object space) and ray direction
 * for each vertex, passing them to the fragment shader as varyings
 */
export const vertexShader = `
varying vec3 vOrigin;
varying vec3 vDirection;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // Calculate vOrigin: camera position in object space
    // Transform camera position from world space to object space
    vOrigin = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
    
    // Calculate vDirection: ray direction from camera to vertex
    // This is the direction from camera to the current vertex in object space
    vDirection = position - vOrigin;
    
    gl_Position = projectionMatrix * mvPosition;
}
`;

/**
 * Fragment Shader
 * Implements raymarching algorithm with box intersection
 * Samples 3D texture along ray and accumulates color/opacity
 */
/**
 * Fragment Shader
 * Implements raymarching algorithm with box intersection
 * Samples 3D texture along ray and accumulates color/opacity
 */
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

// Blue Noise Dithering
// Simple hash function to generate pseudo-blue noise
float hash(float n) {
    return fract(sin(n) * 43758.5453);
}

// Ray-Sphere Intersection
vec2 hitSphere(vec3 orig, vec3 dir) {
    float radius = 0.5;
    float b = dot(orig, dir);
    float c = dot(orig, orig) - radius * radius;
    float discriminant = b * b - c;
    
    if (discriminant < 0.0) return vec2(-1.0);
    
    float sqrtDisc = sqrt(discriminant);
    return vec2(-b - sqrtDisc, -b + sqrtDisc);
}

// Sample density from texture
float sampleDensity(vec3 p) {
    vec3 texCoord = p + 0.5;
    // Animate texture lookup slightly for "flowing" clouds
    vec3 offset = vec3(time * 0.02, 0.0, 0.0); 
    float d = texture(map, texCoord + offset).r;
    
    // Apply threshold
    return smoothstep(threshold - 0.1, threshold + 0.1, d) * opacity;
}

// Lighting calculation (Beer's Law + Directional Derivative)
float getLight(vec3 p, vec3 lightDir) {
    float stepSize = 0.05;
    float density = 0.0;
    vec3 q = p;
    
    // Short march towards light
    for(int i=0; i<4; i++) {
        q += lightDir * stepSize;
        // Check if outside unit sphere (approx)
        if(length(q) > 0.5) break;
        
        float d = sampleDensity(q);
        density += d;
    }
    
    // Beer's Law: exp(-density * absorption)
    float transmittance = exp(-density * 2.0);
    
    // Powder effect (dark edges, bright center) - optional, but adds realism
    float powder = 1.0 - exp(-density * 4.0);
    
    // Combine
    return transmittance * (0.5 + 0.5 * powder); // Mix for artistic control
}

void main() {
    vec3 rayDir = normalize(vDirection);
    vec2 bounds = hitSphere(vOrigin, rayDir);

    if (bounds.x < 0.0 && bounds.y < 0.0) discard;
    
    bounds.x = max(bounds.x, 0.0);
    
    float distance = bounds.y - bounds.x;
    float stepSize = distance / steps;
    
    // Blue Noise Jitter
    float noise = hash(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + time);
    vec3 pos = vOrigin + (bounds.x + noise * stepSize) * rayDir;
    
    vec4 accumColor = vec4(0.0);
    vec3 lightDir = normalize(lightDirection); // Use uniform
    
    for (float i = 0.0; i < 64.0; i++) {
        if(i >= steps) break;
        
        float density = sampleDensity(pos);
        
        if (density > 0.001) {
            // Calculate lighting
            float light = getLight(pos, lightDir);
            
            // Color with lighting
            vec3 col = cloudColor * light;
            
            // Ambient light (shadows aren't pitch black)
            col += vec3(0.1, 0.15, 0.2) * 0.2; 
            
            // Alpha blending (Front-to-back)
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
