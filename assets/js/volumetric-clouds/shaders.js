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
 */
vec2 hitSphere(vec3 origin, vec3 direction) {
    float radius = 0.5;
    float b = dot(origin, direction);
    float c = dot(origin, origin) - radius * radius;
    float h = b * b - c;
    
    if (h < 0.0) return vec2(-1.0); // No intersection
    
    h = sqrt(h);
    return vec2(-b - h, -b + h);
}


void main() {
    vec3 rayDir = normalize(vDirection);
    vec2 bounds = hitSphere(vOrigin, rayDir);

    
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
        // Check if we've marched out of the sphere (radius 0.5)
        if (length(pos) > 0.5) {
            break;
        }


        vec3 texCoord = pos + 0.5;
        
        // Sample noise
        float density = texture(map, texCoord).r;
        
        // Calculate distance to sphere edge for soft fading
        float distFromCenter = length(pos);
        float distToEdge = 0.5 - distFromCenter;
        float edgeFade = smoothstep(0.0, fadeDistance, distToEdge);

        
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
