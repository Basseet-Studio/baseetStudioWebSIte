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
 * Ray-Box Intersection Function
 */
vec2 hitBox(vec3 origin, vec3 direction) {
    const vec3 boxMin = vec3(-0.5);
    const vec3 boxMax = vec3(0.5);
    
    vec3 invDir = 1.0 / direction;
    vec3 tMin = (boxMin - origin) * invDir;
    vec3 tMax = (boxMax - origin) * invDir;
    
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    
    return vec2(tNear, tFar);
}

void main() {
    vec3 rayDir = normalize(vDirection);
    vec2 bounds = hitBox(vOrigin, rayDir);
    
    if (bounds.x > bounds.y) {
        discard;
    }
    
    bounds.x = max(bounds.x, 0.0);
    
    float distance = bounds.y - bounds.x;
    float stepSize = distance / steps;
    
    // Add jitter to start position to reduce banding
    float jitter = random(gl_FragCoord.xyz + time) * stepSize;
    vec3 pos = vOrigin + (bounds.x + jitter) * rayDir;
    
    vec4 accumColor = vec4(0.0);
    
    // Soft edge fade factors
    float fadeDistance = 0.1; // Distance from box edge to start fading
    
    for (float i = 0.0; i < steps; i++) {
        // Check if we've marched out of the box
        if (pos.x < -0.5 || pos.x > 0.5 || pos.y < -0.5 || pos.y > 0.5 || pos.z < -0.5 || pos.z > 0.5) {
            break;
        }

        vec3 texCoord = pos + 0.5;
        
        // Sample noise
        float density = texture(map, texCoord).r;
        
        // Calculate distance to nearest box edge for soft fading
        vec3 distToEdge = 0.5 - abs(pos);
        float minEdgeDist = min(min(distToEdge.x, distToEdge.y), distToEdge.z);
        float edgeFade = smoothstep(0.0, fadeDistance, minEdgeDist);
        
        // Apply threshold and edge fade
        // Use a softer smoothstep range for fluffier look
        float cloudDensity = smoothstep(threshold - 0.15, threshold + 0.15, density);
        cloudDensity *= edgeFade;
        
        if (cloudDensity > 0.001) {
            // Color calculation
            vec4 color = vec4(1.0, 1.0, 1.0, cloudDensity * opacity);
            
            // Lighting approximation (simple density-based shading)
            // Denser parts are darker (self-shadowing)
            float shadow = exp(-cloudDensity * 2.0);
            color.rgb *= mix(0.8, 1.0, shadow);
            
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
