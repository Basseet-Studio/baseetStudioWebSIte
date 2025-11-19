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
uniform sampler3D map;
uniform float threshold;
uniform float opacity;
uniform float steps;

varying vec3 vOrigin;
varying vec3 vDirection;

/**
 * Ray-Box Intersection Function
 * Calculates the near and far intersection points of a ray with a unit box
 * centered at origin with bounds [-0.5, 0.5]
 * 
 * @param origin - Ray origin in object space
 * @param direction - Ray direction (normalized)
 * @return vec2 - (tNear, tFar) intersection distances along ray
 */
vec2 hitBox(vec3 origin, vec3 direction) {
    // Box bounds: -0.5 to 0.5 in all dimensions
    const vec3 boxMin = vec3(-0.5);
    const vec3 boxMax = vec3(0.5);
    
    // Calculate intersection distances for all three axes
    vec3 invDir = 1.0 / direction;
    vec3 tMin = (boxMin - origin) * invDir;
    vec3 tMax = (boxMax - origin) * invDir;
    
    // Swap tMin and tMax if direction is negative
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    
    // Find the largest tNear and smallest tFar
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    
    return vec2(tNear, tFar);
}

void main() {
    // Normalize ray direction
    vec3 rayDir = normalize(vDirection);
    
    // Calculate ray-box intersection
    vec2 bounds = hitBox(vOrigin, rayDir);
    
    // If ray misses the box, discard fragment
    if (bounds.x > bounds.y) {
        discard;
    }
    
    // Ensure we start from the box surface (not behind camera)
    bounds.x = max(bounds.x, 0.0);
    
    // Calculate step size for raymarching
    float distance = bounds.y - bounds.x;
    float stepSize = distance / steps;
    
    // Initialize raymarching variables
    vec3 pos = vOrigin + bounds.x * rayDir;
    vec4 accumColor = vec4(0.0);
    
    // Raymarching loop
    for (float i = 0.0; i < steps; i++) {
        // Sample 3D texture at current position
        // Transform from object space [-0.5, 0.5] to texture space [0, 1]
        vec3 texCoord = pos + 0.5;
        float density = texture(map, texCoord).r;
        
        // Apply threshold with smoothstep for soft cloud edges
        // smoothstep creates a smooth transition between 0 and 1
        float cloudDensity = smoothstep(threshold - 0.1, threshold + 0.1, density);
        
        // Calculate color contribution for this step
        // White clouds with density-based opacity
        vec4 color = vec4(1.0, 1.0, 1.0, cloudDensity * opacity);
        
        // Front-to-back alpha blending
        // Accumulate color weighted by current alpha and remaining transparency
        accumColor.rgb += (1.0 - accumColor.a) * color.rgb * color.a;
        accumColor.a += (1.0 - accumColor.a) * color.a;
        
        // Early exit if opacity is high enough (optimization)
        if (accumColor.a >= 0.95) {
            break;
        }
        
        // March along ray
        pos += rayDir * stepSize;
    }
    
    // Output final color
    gl_FragColor = accumColor;
}
`;

// Make shaders globally available for non-module usage
if (typeof window !== 'undefined') {
    window.vertexShader = vertexShader;
    window.fragmentShader = fragmentShader;
}
