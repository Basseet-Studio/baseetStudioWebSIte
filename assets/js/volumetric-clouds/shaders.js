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
export const fragmentShader = `
precision highp float;
precision highp sampler3D;

uniform sampler3D map;
uniform float threshold;
uniform float opacity;
uniform float steps;
uniform float time;

varying vec3 vOrigin;
varying vec3 vDirection;

// Random function for jitter
float random(vec3 co) {
    return fract(sin(dot(co.xyz ,vec3(12.9898,78.233, 45.5432))) * 43758.5453);
}

/**
 * Ray-Box Intersection Function (AABB)
 * Professional implementation matching Three.js BoxGeometry bounds
 * Returns the near and far intersection distances
 */
vec2 hitBox(vec3 orig, vec3 dir) {
    const vec3 box_min = vec3(-0.5);
    const vec3 box_max = vec3(0.5);
    vec3 inv_dir = 1.0 / dir;
    vec3 tmin_tmp = (box_min - orig) * inv_dir;
    vec3 tmax_tmp = (box_max - orig) * inv_dir;
    vec3 tmin = min(tmin_tmp, tmax_tmp);
    vec3 tmax = max(tmin_tmp, tmax_tmp);
    float t0 = max(tmin.x, max(tmin.y, tmin.z));
    float t1 = min(tmax.x, min(tmax.y, tmax.z));
    return vec2(t0, t1);
}


void main() {
    vec3 rayDir = normalize(vDirection);
    vec2 bounds = hitBox(vOrigin, rayDir);

    // Discard if no intersection with box
    if (bounds.x > bounds.y) {
        discard;
    }
    
    // Ensure we start from a valid position
    bounds.x = max(bounds.x, 0.0);
    
    float distance = bounds.y - bounds.x;
    float stepSize = distance / steps;
    
    // Add jitter to start position to reduce banding
    float jitter = random(gl_FragCoord.xyz + time) * stepSize;
    vec3 pos = vOrigin + (bounds.x + jitter) * rayDir;
    
    vec4 accumColor = vec4(0.0);
    
    // Soft edge fade factors
    float fadeDistance = 0.3; // Very soft edges
    
    for (float i = 0.0; i < steps; i++) {
        // Map position to texture coordinates [0, 1]
        // pos is in range [-0.5, 0.5] within the box
        vec3 texCoord = pos + 0.5;
        
        // Sample noise density from texture
        float density = texture(map, texCoord).r;
        
        // Apply threshold with soft smoothstep (Three.js approach)
        // Wider range for fluffier clouds
        density = smoothstep(threshold - 0.15, threshold + 0.15, density) * opacity;
        
        // Optional: Simple gradient shading for depth
        float shading = texture(map, texCoord + vec3(-0.01)).r - texture(map, texCoord + vec3(0.01)).r;
        float shadingFactor = shading * 3.0 + ((texCoord.x + texCoord.y) * 0.25) + 0.2;
        
        if (density > 0.001) {
            // Accumulate color with front-to-back alpha compositing
            vec4 color = vec4(1.0, 1.0, 1.0, density);
            
            // Apply shading for variation
            color.rgb *= shadingFactor;
            
            accumColor.rgb += (1.0 - accumColor.a) * color.rgb * color.a;
            accumColor.a += (1.0 - accumColor.a) * color.a;
        }
        
        if (accumColor.a >= 0.98) {
            break;
        }
        
        pos += rayDir * stepSize;
    }
    
    gl_FragColor = accumColor;
}
`;
