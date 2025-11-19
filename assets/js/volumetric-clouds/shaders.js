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
 * Ray-Sphere Intersection Function
 * Natural pairing with SphereGeometry - no boxes!
 * Returns the near and far intersection distances
 */
vec2 hitSphere(vec3 orig, vec3 dir) {
    // Sphere radius 0.5 to match SphereGeometry(0.5)
    float radius = 0.5;
    float b = dot(orig, dir);
    float c = dot(orig, orig) - radius * radius;
    float discriminant = b * b - c;
    
    if (discriminant < 0.0) return vec2(-1.0); // No intersection
    
    float sqrtDisc = sqrt(discriminant);
    return vec2(-b - sqrtDisc, -b + sqrtDisc);
}


void main() {
    vec3 rayDir = normalize(vDirection);
    vec2 bounds = hitSphere(vOrigin, rayDir);

    // Discard if no intersection with sphere
    if (bounds.x < 0.0 && bounds.y < 0.0) {
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
