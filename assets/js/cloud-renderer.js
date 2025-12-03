/**
 * CloudRenderer - Volumetric cloud rendering system using Three.js
 * 
 * This module implements real-time volumetric cloud rendering using
 * raymarching techniques in GLSL shaders. The clouds are rendered
 * as a full-screen effect behind the hero section.
 */

import * as THREE from 'three';

/**
 * Vertex Shader
 * 
 * This shader performs a simple pass-through transformation:
 * 1. Transforms vertex positions from object space to clip space using the projection and model-view matrices
 * 2. Passes UV coordinates to the fragment shader for texture sampling
 * 
 * The vertex shader uses a full-screen quad (2x2 plane) that covers the entire viewport
 * in normalized device coordinates (-1 to 1 in both x and y).
 */
const vertexShader = `
  // Vertex attributes provided by Three.js geometry
  // position: vec3 - vertex position in object space
  // uv: vec2 - texture coordinates (0 to 1 range)
  
  // Varying variable to pass UV coordinates to fragment shader
  varying vec2 vUv;
  
  void main() {
    // Pass UV coordinates to fragment shader
    // These will be interpolated across the quad's surface
    vUv = uv;
    
    // Transform vertex position to clip space
    // projectionMatrix: transforms from view space to clip space (orthographic projection)
    // modelViewMatrix: transforms from object space to view space
    // position: vertex position in object space
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Fragment Shader
 * 
 * This shader implements volumetric cloud rendering using raymarching techniques.
 * It samples a 3D noise field to create organic cloud shapes with realistic lighting.
 */
const fragmentShader = `
  precision highp float;
  
  // Uniforms passed from JavaScript
  uniform float uTime;           // Elapsed time for animation
  uniform vec2 uResolution;      // Viewport dimensions
  uniform sampler2D uNoise;      // Noise texture for procedural patterns
  
  // Varying from vertex shader
  varying vec2 vUv;
  
  /**
   * 3D Noise Function
   * 
   * Samples a 2D noise texture to create a 3D noise field.
   * Uses the z-coordinate to offset the texture lookup, creating variation in 3D space.
   * 
   * @param p - 3D position to sample noise at
   * @return float - Noise value in range [0, 1]
   */
  float noise(vec3 p) {
    // Sample the 2D noise texture using x and y coordinates
    // Add z-coordinate as an offset to create 3D variation
    // The 0.1 factor controls how quickly the noise changes along the z-axis
    vec2 uv = p.xy + p.z * 0.1;
    
    // Sample the noise texture and return the red channel
    return texture2D(uNoise, uv * 0.1).r;
  }
  
  /**
   * Fractal Brownian Motion (FBM)
   * 
   * Combines multiple octaves of noise at different frequencies and amplitudes
   * to create organic, natural-looking patterns. Each octave adds finer detail.
   * 
   * This implementation uses 6 octaves as specified in the design document.
   * Time-based animation is applied to create subtle cloud movement.
   * 
   * @param p - 3D position to sample FBM at
   * @return float - FBM value (accumulated noise across octaves)
   */
  float fbm(vec3 p) {
    float value = 0.0;      // Accumulated noise value
    float amplitude = 0.8;  // Starting amplitude for first octave (increased for denser clouds)
    float frequency = 1.0;  // Starting frequency for first octave
    
    // Animate the position based on time
    // This creates slow, drifting cloud movement
    vec3 animatedPos = p + vec3(uTime * 1.0, uTime * -0.2, uTime * -1.0) * 0.5;
    
    // Accumulate 6 octaves of noise
    // Each octave has higher frequency (finer detail) and lower amplitude (less influence)
    for (int i = 0; i < 6; i++) {
      // Sample noise at current frequency and add to accumulated value
      value += amplitude * noise(animatedPos * frequency);
      
      // Increase frequency for next octave (finer detail)
      // Factor of 2.02 creates slight variation from pure doubling
      frequency *= 2.02;
      
      // Decrease amplitude for next octave (less influence)
      amplitude *= 0.5;
      
      // Add slight rotation to each octave for more organic variation
      animatedPos = animatedPos * 1.0 + 0.21;
    }
    
    return value;
  }
  
  /**
   * Signed Distance Field for Sphere
   * 
   * Calculates the signed distance from a point to a sphere's surface.
   * Positive values are outside the sphere, negative values are inside.
   * 
   * @param p - 3D position to evaluate
   * @param r - Radius of the sphere
   * @return float - Signed distance to sphere surface
   */
  float sdSphere(vec3 p, float r) {
    return length(p) - r;
  }
  
  /**
   * Scene Function
   * 
   * Defines the volumetric density of the cloud at any point in 3D space.
   * Creates multiple scattered cloud blobs using repeating space and noise.
   * 
   * Returns negative distance for volumetric rendering - areas with negative
   * values are considered "inside" the cloud volume and will accumulate density
   * during raymarching.
   * 
   * @param p - 3D position to evaluate scene density at
   * @return float - Density value (negative = inside cloud volume)
   */
  float scene(vec3 p) {
    // Sample FBM noise to create organic cloud patterns
    float f = fbm(p * 0.8);
    
    // Create a larger bounding volume to contain the clouds
    float boundingSphere = sdSphere(p, 3.5);
    
    // Combine bounding sphere with noise to create scattered cloud blobs
    // The noise creates natural variation and multiple cloud formations
    float density = -boundingSphere + f * 1.5;
    
    return density;
  }
  
  /**
   * Test Sphere Function
   * Returns positive distance for a solid sphere (for testing/visualization)
   * This sphere will be rendered as a solid object, not volumetric
   */
  float testSphere(vec3 p) {
    // Animated floating sphere - moves in a circle
    vec3 spherePos = vec3(
      sin(uTime * 0.5) * 1.5,  // X: circular motion
      cos(uTime * 0.3) * 0.8,  // Y: bobbing motion
      0.0                       // Z: centered
    );
    return sdSphere(p - spherePos, 0.3);  // Small sphere with radius 0.3
  }
  
  // Raymarching constants
  const int MAX_STEPS = 100;      // Maximum number of steps along the ray
  const float MARCH_SIZE = 0.08;  // Step size for each raymarch iteration
  
  // Lighting constants
  const vec3 SUN_DIR = normalize(vec3(1.0, 0.0, 0.0));  // Direction to sun (light source)
  const float LIGHT_OFFSET = 0.3;                        // Offset distance for directional derivative
  
  /**
   * Directional Derivative Lighting
   * 
   * Approximates light scattering through the cloud volume using a directional derivative.
   * This technique samples density at the current point and at an offset along the sun direction,
   * then calculates the difference to approximate how much light reaches this point.
   * 
   * The directional derivative method is computationally efficient compared to full
   * volumetric light transport, while still producing convincing lighting effects.
   * 
   * Algorithm:
   * 1. Sample density at current position
   * 2. Sample density at position offset toward the sun
   * 3. Calculate difference (derivative) along sun direction
   * 4. Use derivative to determine how much light penetrates to this point
   * 
   * @param p - 3D position to calculate lighting at
   * @return float - Diffuse lighting value [0, 1]
   */
  float calculateLighting(vec3 p) {
    // Sample density at current point
    float densityHere = scene(p);
    
    // Sample density at offset position along sun direction
    // Moving toward the sun to see how much cloud is blocking the light
    vec3 lightSamplePos = p + SUN_DIR * LIGHT_OFFSET;
    float densityTowardSun = scene(lightSamplePos);
    
    // Calculate directional derivative
    // If density decreases toward the sun, more light reaches this point
    // If density increases toward the sun, this point is in shadow
    float derivative = densityHere - densityTowardSun;
    
    // Convert derivative to diffuse lighting value
    // Positive derivative (less density toward sun) = more light
    // Normalize and clamp to [0, 1] range
    float diffuse = clamp(derivative * 2.0, 0.0, 1.0);
    
    return diffuse;
  }
  
  /**
   * Volumetric Raymarching Function
   * 
   * Marches a ray through the volume, sampling density at regular intervals.
   * Accumulates density and lighting along the ray to create volumetric clouds.
   * 
   * Algorithm:
   * 1. Start at ray origin
   * 2. Step forward by MARCH_SIZE for each iteration (up to MAX_STEPS)
   * 3. Sample density at current position using scene function
   * 4. If density is positive (inside cloud), calculate lighting and accumulate color
   * 5. Continue until max steps reached or ray exits volume
   * 
   * @param ro - Ray origin (starting position)
   * @param rd - Ray direction (normalized)
   * @return vec4 - Accumulated color and alpha (rgb, a)
   */
  vec4 raymarch(vec3 ro, vec3 rd) {
    float depth = 0.0;
    vec3 p = ro + depth * rd;
    
    vec4 res = vec4(0.0);
    
    // Color palette for clouds
    const vec3 ambientColor = vec3(0.60, 0.60, 0.75);  // Cool blue-gray for shadowed areas
    const vec3 sunColor = vec3(1.0, 0.6, 0.3);         // Warm orange-yellow for lit areas
    
    // Test sphere color (bright magenta for visibility)
    const vec3 sphereColor = vec3(1.0, 0.2, 0.8);
    
    // March along the ray for MAX_STEPS iterations
    for (int i = 0; i < MAX_STEPS; i++) {
      // Check for solid test sphere first
      float sphereDist = testSphere(p);
      if (sphereDist < 0.01) {
        // Hit the solid sphere - render it with bright color and return immediately
        return vec4(sphereColor, 1.0);
      }
      
      // Sample density at current position
      float density = scene(p);
      
      // If density is positive, we're inside the cloud volume
      if (density > 0.0) {
        // Calculate lighting at this point using directional derivative
        float diffuse = calculateLighting(p);
        
        // Blend ambient and sun colors based on diffuse lighting (from article)
        vec3 lin = vec3(0.60, 0.60, 0.75) * 1.1 + 0.8 * vec3(1.0, 0.6, 0.3) * diffuse;
        
        // Create color with density-based mixing (from the article)
        vec4 color = vec4(mix(vec3(1.0, 1.0, 1.0), vec3(0.0, 0.0, 0.0), density), density);
        color.rgb *= lin;
        color.rgb *= color.a;
        
        // Accumulate using alpha blending (from article)
        res += color * (1.0 - res.a);
      }
      
      depth += MARCH_SIZE;
      p = ro + depth * rd;
    }
    
    // Return accumulated result
    return res;
  }
  
  /**
   * Main Fragment Shader Entry Point
   * 
   * Renders the final image by:
   * 1. Setting up the ray for this pixel
   * 2. Rendering the sky background with sun glow
   * 3. Raymarching through the cloud volume
   * 4. Compositing clouds over the sky using alpha blending
   */
  void main() {
    // Convert UV coordinates to normalized device coordinates [-1, 1]
    vec2 uv = vUv * 2.0 - 1.0;
    
    // Adjust for aspect ratio to prevent stretching
    uv.x *= uResolution.x / uResolution.y;
    
    // Set up ray for raymarching
    vec3 rayOrigin = vec3(0.0, 0.0, 5.0);      // Camera position
    vec3 rayDirection = normalize(vec3(uv, -1.0));  // Ray direction through this pixel
    
    // === Sky Background Rendering ===
    
    // Sky color palette
    const vec3 skyBaseColor = vec3(0.7, 0.7, 0.90);      // Light blue-gray base
    const vec3 skyGradientColor = vec3(0.90, 0.75, 0.90); // Lighter top color
    const vec3 sunGlowColor = vec3(1.0, 0.5, 0.3);       // Warm orange-yellow sun
    
    // Create vertical gradient for sky
    // Use ray direction's y component to blend from base to gradient color
    float gradientFactor = rayDirection.y * 0.5 + 0.5;  // Remap from [-1,1] to [0,1]
    vec3 skyColor = mix(skyBaseColor, skyGradientColor, gradientFactor);
    
    // Add sun glow effect
    // Calculate how aligned the ray is with the sun direction
    float sunAlignment = dot(rayDirection, SUN_DIR);
    
    // Create sun glow using power function for falloff
    // Higher power = tighter glow around sun
    float sunGlow = pow(max(sunAlignment, 0.0), 8.0) * 0.8;
    
    // Add sun glow to sky color
    skyColor += sunGlowColor * sunGlow;
    
    // === Cloud Rendering ===
    
    // Raymarch through cloud volume
    vec4 cloudResult = raymarch(rayOrigin, rayDirection);
    
    // === Final Compositing ===
    
    // Composite clouds over sky using alpha blending
    // Formula: finalColor = cloudColor * alpha + skyColor * (1 - alpha)
    vec3 finalColor = cloudResult.rgb + skyColor * (1.0 - cloudResult.a);
    
    // Output final color
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * CloudRenderer class
 * Manages the Three.js scene, shaders, and animation loop for volumetric clouds
 */
export class CloudRenderer {
  /**
   * Create a CloudRenderer instance
   * @param {string} containerSelector - CSS selector for the container element
   */
  constructor(containerSelector) {
    this.containerSelector = containerSelector;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.material = null;
    this.mesh = null;
    this.texture = null;
    this.animationFrameId = null;
    this.isAnimating = false;
    this.startTime = null;
    this.resizeTimeoutId = null;
    
    // Bind methods that will be used as event listeners
    this.boundHandleResize = this.handleResize.bind(this);
    this.debouncedResize = this.debounceResize.bind(this);
    this.boundHandleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.boundHandleContextLost = this.handleContextLost.bind(this);
    this.boundHandleContextRestored = this.handleContextRestored.bind(this);
  }

  /**
   * Check if WebGL is available in the browser
   * @returns {boolean} True if WebGL is supported
   */
  isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Load noise texture with error handling
   * @param {string} texturePath - Path to the noise texture
   * @returns {Promise<THREE.Texture>} Loaded texture or fallback
   */
  async loadTexture(texturePath) {
    return new Promise((resolve) => {
      const textureLoader = new THREE.TextureLoader();
      
      textureLoader.load(
        texturePath,
        // Success callback
        (texture) => {
          // Set texture filtering to LinearFilter for smooth interpolation
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          
          // Set texture wrapping to RepeatWrapping for tiling
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          
          resolve(texture);
        },
        // Progress callback (optional)
        undefined,
        // Error callback
        (error) => {
          console.error('Failed to load noise texture:', error);
          
          // Create fallback 1x1 white texture
          const fallbackTexture = new THREE.DataTexture(
            new Uint8Array([255, 255, 255, 255]),
            1,
            1,
            THREE.RGBAFormat
          );
          fallbackTexture.needsUpdate = true;
          
          // Apply same settings to fallback texture
          fallbackTexture.minFilter = THREE.LinearFilter;
          fallbackTexture.magFilter = THREE.LinearFilter;
          fallbackTexture.wrapS = THREE.RepeatWrapping;
          fallbackTexture.wrapT = THREE.RepeatWrapping;
          
          resolve(fallbackTexture);
        }
      );
    });
  }

  /**
   * Initialize the cloud renderer
   * Sets up Three.js scene, camera, renderer, shaders, and starts animation
   * @returns {Promise<void>}
   */
  async init() {
    try {
      // Check WebGL support
      if (!this.isWebGLAvailable()) {
        console.warn('WebGL not supported, clouds disabled');
        return;
      }

      // Validate container element exists
      const container = document.querySelector(this.containerSelector);
      if (!container) {
        console.error('Cloud container not found:', this.containerSelector);
        return;
      }

      // Create Three.js scene
      this.scene = new THREE.Scene();

      // Create orthographic camera with correct bounds
      // Using -1 to 1 for normalized device coordinates
      this.camera = new THREE.OrthographicCamera(
        -1, // left
        1,  // right
        1,  // top
        -1, // bottom
        0,  // near
        2   // far
      );
      this.camera.position.z = 1;

      // Create WebGLRenderer with alpha and antialias settings
      this.renderer = new THREE.WebGLRenderer({
        alpha: true,      // Transparent background for layering
        antialias: false  // Performance optimization
      });

      // Set pixel ratio capped at 2x for performance
      const pixelRatio = Math.min(window.devicePixelRatio, 2);
      this.renderer.setPixelRatio(pixelRatio);

      // Set renderer size to match container
      this.renderer.setSize(window.innerWidth, window.innerHeight);

      // Append canvas to container element
      container.appendChild(this.renderer.domElement);

      // Load noise texture
      // Try textures directory first (static folder), fallback to noise directory
      this.texture = await this.loadTexture('/textures/blue-noise-256.png');

      // Define shader uniforms
      // Uniforms are values passed from JavaScript to the shaders
      this.uniforms = {
        // uTime: Elapsed time in seconds for animation
        // Range: [0, ∞) - continuously increases during animation
        // Purpose: Drives cloud movement and time-based transformations
        uTime: { value: 0.0 },
        
        // uResolution: Viewport dimensions in pixels
        // Range: [width, height] where both are positive integers
        // Purpose: Maintains correct aspect ratio and ray directions
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        
        // uNoise: Noise texture sampler for procedural patterns
        // Type: 2D texture (sampler2D)
        // Purpose: Provides noise data for cloud density generation via FBM
        uNoise: { value: this.texture }
      };

      // Create ShaderMaterial with custom vertex and fragment shaders
      this.material = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: this.uniforms,
        transparent: true  // Enable alpha blending for compositing clouds over background
      });

      // Create full-screen quad geometry
      // PlaneGeometry with 2x2 dimensions covers normalized device coordinates (-1 to 1)
      const geometry = new THREE.PlaneGeometry(2, 2);
      
      // Create mesh combining geometry and material
      this.mesh = new THREE.Mesh(geometry, this.material);
      
      // Add mesh to scene
      this.scene.add(this.mesh);

      // Add window resize event listener with debouncing
      window.addEventListener('resize', this.debouncedResize);

      // Add page visibility event listener
      document.addEventListener('visibilitychange', this.boundHandleVisibilityChange);

      // Add WebGL context loss handlers
      if (this.renderer && this.renderer.domElement) {
        this.renderer.domElement.addEventListener('webglcontextlost', this.boundHandleContextLost, false);
        this.renderer.domElement.addEventListener('webglcontextrestored', this.boundHandleContextRestored, false);
      }

      // Start animation loop
      this.startTime = performance.now();
      this.isAnimating = true;
      this.animate();

      console.log('CloudRenderer initialized successfully');
    } catch (error) {
      console.error('CloudRenderer initialization failed:', error);
      // Fail silently to avoid breaking page functionality
    }
  }

  /**
   * Animation loop
   * Updates uniforms and renders the scene on each frame
   * Uses requestAnimationFrame for optimal frame pacing
   */
  animate() {
    // Only continue animation if isAnimating flag is true
    if (!this.isAnimating) {
      return;
    }

    // Request next frame
    // Store the animation frame ID so we can cancel it later
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Calculate elapsed time in seconds
    const currentTime = performance.now();
    const elapsedTime = (currentTime - this.startTime) / 1000;

    // Update uTime uniform with elapsed time
    if (this.material && this.material.uniforms && this.material.uniforms.uTime) {
      this.material.uniforms.uTime.value = elapsedTime;
    }

    // Render the scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Pause the animation loop
   * Cancels the animation frame request and sets isAnimating to false
   */
  pause() {
    // Set animation state to false
    this.isAnimating = false;

    // Cancel the pending animation frame request
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Resume the animation loop
   * Restarts the animation loop if it was paused
   */
  resume() {
    // Only resume if not already animating
    if (!this.isAnimating) {
      // Reset start time to maintain continuous animation
      // Adjust startTime to account for the pause duration
      if (this.startTime !== null && this.material && this.material.uniforms && this.material.uniforms.uTime) {
        const pausedTime = this.material.uniforms.uTime.value;
        this.startTime = performance.now() - (pausedTime * 1000);
      }

      // Set animation state to true
      this.isAnimating = true;

      // Restart animation loop
      this.animate();
    }
  }

  /**
   * Handle window resize events
   * Updates renderer size, camera, and shader uniforms to match new viewport dimensions
   * Maintains aspect ratio to prevent stretching
   */
  handleResize() {
    // Get current window dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Update renderer size
    if (this.renderer) {
      this.renderer.setSize(width, height);
    }

    // Update uResolution uniform
    if (this.material && this.material.uniforms && this.material.uniforms.uResolution) {
      this.material.uniforms.uResolution.value.set(width, height);
    }

    // Note: Aspect ratio is maintained in the fragment shader
    // The shader adjusts UV coordinates based on uResolution to prevent stretching
  }

  /**
   * Debounced resize handler for performance
   * Delays the actual resize operation until resize events stop firing
   * This prevents excessive re-renders during continuous resize operations
   */
  debounceResize() {
    // Clear any existing timeout
    if (this.resizeTimeoutId !== null) {
      clearTimeout(this.resizeTimeoutId);
    }

    // Set a new timeout to call handleResize after 150ms of no resize events
    this.resizeTimeoutId = setTimeout(() => {
      this.handleResize();
      this.resizeTimeoutId = null;
    }, 150);
  }

  /**
   * Handle page visibility changes
   * Pauses animation when page is hidden, resumes when visible
   * This conserves resources when the page is not being viewed
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden, pause animation
      this.pause();
    } else {
      // Page is visible, resume animation
      this.resume();
    }
  }

  /**
   * Handle WebGL context loss
   * Prevents default behavior to allow context restoration
   * Pauses animation to conserve resources
   * @param {Event} event - The webglcontextlost event
   */
  handleContextLost(event) {
    // Prevent default to allow context restoration
    event.preventDefault();
    
    // Pause animation
    this.pause();
    
    console.warn('WebGL context lost');
  }

  /**
   * Handle WebGL context restoration
   * Reinitializes the renderer and resumes animation
   */
  async handleContextRestored() {
    console.log('WebGL context restored, reinitializing...');
    
    try {
      // Reinitialize the renderer
      await this.init();
    } catch (error) {
      console.error('Failed to reinitialize after context restore:', error);
    }
  }

  /**
   * Clean up resources and dispose of Three.js objects
   * Removes event listeners, cancels animation, and disposes of Three.js resources
   */
  dispose() {
    // Cancel animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Stop animation
    this.isAnimating = false;

    // Remove event listeners
    window.removeEventListener('resize', this.debouncedResize);
    document.removeEventListener('visibilitychange', this.boundHandleVisibilityChange);

    // Remove WebGL context event listeners
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.removeEventListener('webglcontextlost', this.boundHandleContextLost, false);
      this.renderer.domElement.removeEventListener('webglcontextrestored', this.boundHandleContextRestored, false);
    }

    // Clear any pending resize timeout
    if (this.resizeTimeoutId !== null) {
      clearTimeout(this.resizeTimeoutId);
      this.resizeTimeoutId = null;
    }

    // Dispose of Three.js resources
    if (this.mesh) {
      // Remove mesh from scene
      if (this.scene) {
        this.scene.remove(this.mesh);
      }

      // Dispose of geometry
      if (this.mesh.geometry) {
        this.mesh.geometry.dispose();
      }

      this.mesh = null;
    }

    // Dispose of material
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }

    // Dispose of texture
    if (this.texture) {
      this.texture.dispose();
      this.texture = null;
    }

    // Dispose of renderer
    if (this.renderer) {
      // Remove canvas from DOM
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }

      this.renderer.dispose();
      this.renderer = null;
    }

    // Clear scene
    if (this.scene) {
      this.scene = null;
    }

    // Clear camera
    if (this.camera) {
      this.camera = null;
    }

    console.log('CloudRenderer disposed successfully');
  }
}
