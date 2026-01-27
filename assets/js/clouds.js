/**
 * ============================================================================
 * VOLUMETRIC CLOUDS SHADER - Baseet Studio
 * ============================================================================
 * 
 * Based on Inigo Quilez's famous "Clouds" shader (ShaderToy XslGRr)
 * Procedural volumetric clouds using raymarching - NO TEXTURES NEEDED!
 * 
 * ============================================================================
 * HOW IT WORKS:
 * ============================================================================
 * 1. We create 3D noise using a hash function
 * 2. Layer multiple octaves of noise (FBM - Fractal Brownian Motion) for detail
 * 3. Use raymarching to step through the sky and sample cloud density
 * 4. Apply lighting by comparing density towards the sun
 * 5. Blend clouds over a sky gradient background
 * 
 * ============================================================================
 * HOW TO CUSTOMIZE THE CLOUDS:
 * ============================================================================
 * 
 * COVERAGE (line ~75): Controls how much of the sky has clouds
 *   - 0.3 = sparse clouds (30% coverage)
 *   - 0.5 = medium clouds (50% coverage)  
 *   - 0.7 = overcast (70% coverage)
 * 
 * CLOUD_SCALE (line ~80): Controls cloud size
 *   - Lower values = bigger, puffier clouds
 *   - Higher values = smaller, more detailed clouds
 * 
 * CLOUD_SPEED (line ~83): Animation speed
 *   - Lower = slower drifting clouds
 *   - Higher = faster moving clouds
 * 
 * CLOUD_HEIGHT_MIN/MAX (line ~140): Cloud layer altitude
 *   - Adjust to position clouds higher or lower in the sky
 * 
 * CLOUD_DENSITY (line ~125): How thick/opaque the clouds appear
 *   - Lower = wispy, transparent clouds
 *   - Higher = dense, solid clouds
 * 
 * SUN_DIRECTION (line ~108): Light source direction
 *   - vec3(x, y, z) - change to move sun position
 * 
 * CLOUD_COLOR / SHADOW_COLOR (line ~115): Cloud appearance
 *   - Adjust RGB values to change cloud tint
 * 
 * EDGE_SOFTNESS (line ~100): How sharp or fluffy cloud edges are
 *   - Lower = sharper edges
 *   - Higher = softer, more diffuse edges
 * 
 * NOISE_VARIATION (line ~85): Adds variety to cloud shapes
 *   - Higher = more varied, interesting cloud formations
 * 
 * ============================================================================
 */

(function () {
  'use strict';

  // ============================================================================
  // WEBGL SUPPORT CHECK
  // ============================================================================
  function isWebGLSupported() {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch {
      return false;
    }
  }

  // ============================================================================
  // VERTEX SHADER - Simple fullscreen quad (no changes needed here)
  // ============================================================================
  const vertexShaderSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    
    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // ============================================================================
  // FRAGMENT SHADER - The magic happens here!
  // ============================================================================
  const fragmentShaderSource = `
    precision highp float;
    
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    
    varying vec2 v_uv;
    
    // ==========================================================================
    // CUSTOMIZATION PARAMETERS - Tweak these to change cloud appearance!
    // ==========================================================================
    
    // COVERAGE: How much of the sky has clouds (0.0 to 1.0)
    // 0.3 = sparse, 0.5 = medium, 0.7 = overcast
    const float COVERAGE = 0.42;
    
    // CLOUD_SCALE: Size of the clouds
    // Lower = bigger clouds, Higher = smaller clouds
    const float CLOUD_SCALE = 0.4;
    
    // CLOUD_SPEED: How fast clouds drift across the sky
    const float CLOUD_SPEED = 0.025;
    
    // NOISE_VARIATION: Adds variety to cloud shapes (higher = more varied)
    const float NOISE_VARIATION = 1.5;
    
    // VERTICAL_SCALE: Stretches clouds vertically for more variety
    const float VERTICAL_SCALE = 0.7;
    
    // EDGE_SOFTNESS: How soft/fluffy the cloud edges are (0.1 to 0.5)
    const float EDGE_SOFTNESS = 0.25;
    
    // CLOUD_DENSITY: How thick/opaque clouds appear (0.2 to 0.6)
    const float CLOUD_DENSITY = 0.4;
    
    // ==========================================================================
    // LIGHTING PARAMETERS
    // ==========================================================================
    
    // SUN_DIRECTION: Where the light comes from (will be normalized)
    // Tweak x,y,z to move sun position
    vec3 sunDir = normalize(vec3(-0.7, 0.5, -0.6));
    
    // CLOUD_COLOR: Bright parts of clouds (sun-lit areas)
    const vec3 CLOUD_COLOR = vec3(1.1, 1.05, 1.0);
    
    // SHADOW_COLOR: Dark parts of clouds (shaded areas)  
    const vec3 SHADOW_COLOR = vec3(0.35, 0.4, 0.55);
    
    // ==========================================================================
    // SKY PARAMETERS
    // ==========================================================================
    
    // SKY_COLOR_HORIZON: Sky color near the horizon
    const vec3 SKY_HORIZON = vec3(0.75, 0.85, 0.95);
    
    // SKY_COLOR_ZENITH: Sky color looking straight up
    const vec3 SKY_ZENITH = vec3(0.35, 0.55, 0.85);
    
    // ==========================================================================
    // CLOUD LAYER PARAMETERS
    // ==========================================================================
    
    // CLOUD_HEIGHT_MIN: Bottom of cloud layer
    const float CLOUD_HEIGHT_MIN = 0.3;
    
    // CLOUD_HEIGHT_MAX: Top of cloud layer
    const float CLOUD_HEIGHT_MAX = 3.5;
    
    // MAX_DISTANCE: How far to render clouds
    const float MAX_DISTANCE = 60.0;
    
    // ==========================================================================
    // NOISE FUNCTIONS - These generate the cloud shapes
    // ==========================================================================
    
    // Hash function - creates pseudo-random values
    float hash(float n) {
      return fract(sin(n) * 43758.5453123);
    }
    
    // 3D Value Noise - the building block for clouds
    float noise(vec3 x) {
      vec3 p = floor(x);
      vec3 f = fract(x);
      
      // Smooth interpolation (removes blocky artifacts)
      f = f * f * (3.0 - 2.0 * f);
      
      // Use prime numbers for better distribution
      float n = p.x + p.y * 157.0 + 113.0 * p.z;
      
      // Trilinear interpolation of 8 corners
      return mix(
        mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
            mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
        mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
            mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y), f.z
      );
    }
    
    // ==========================================================================
    // CLOUD DENSITY FUNCTION - The heart of the cloud generation
    // ==========================================================================
    
    float cloudDensity(vec3 p, int octaves) {
      // Apply scale to position
      vec3 q = p * CLOUD_SCALE;
      
      // Add vertical variation for more interesting shapes
      q.y *= VERTICAL_SCALE;
      
      // Animate: clouds drift with time
      // Change the vec3 to alter drift direction (currently drifting in Z)
      q -= vec3(0.0, 0.0, u_time * CLOUD_SPEED);
      
      // Add some large-scale variation for more interesting cloud groups
      float largeScale = noise(q * 0.3) * NOISE_VARIATION;
      q += largeScale * 0.5;
      
      // =======================================================================
      // FBM (Fractal Brownian Motion) - Layer multiple noise octaves
      // Each octave adds finer detail
      // =======================================================================
      float fbm = 0.0;
      float amp = 0.5;    // Starting amplitude
      float freq = 1.0;   // Starting frequency
      float maxAmp = 0.0; // Track total amplitude for normalization
      
      for(int i = 0; i < 5; i++) {
        if(i >= octaves) break;
        fbm += amp * noise(q * freq);
        maxAmp += amp;
        
        // Each octave: double frequency, halve amplitude
        freq *= 2.03;  // Slightly off 2.0 to reduce repetition
        amp *= 0.5;
      }
      
      // Normalize FBM to 0-1 range
      fbm /= maxAmp;
      
      // =======================================================================
      // COVERAGE THRESHOLD - This is what creates distinct clouds!
      // =======================================================================
      // Only show clouds where noise exceeds (1 - COVERAGE)
      // Higher coverage = lower threshold = more clouds
      float threshold = 1.0 - COVERAGE;
      float density = fbm - threshold;
      
      // Smooth the edges with smoothstep (controlled by EDGE_SOFTNESS)
      density = smoothstep(0.0, EDGE_SOFTNESS, density);
      
      return density;
    }
    
    // Different detail levels for performance optimization
    float map5(vec3 p) { return cloudDensity(p, 5); } // High detail - main rendering
    float map4(vec3 p) { return cloudDensity(p, 4); } // Medium detail - secondary
    float map3(vec3 p) { return cloudDensity(p, 3); } // Low detail - lighting/shadows
    
    // ==========================================================================
    // LIGHTING INTEGRATION - Accumulates cloud color along the ray
    // ==========================================================================
    
    vec4 integrate(vec4 sum, float lighting, float density, vec3 bgcol, float dist) {
      // Mix between shadow and lit color based on lighting
      vec3 col = mix(SHADOW_COLOR, CLOUD_COLOR, lighting);
      
      // Distance fog - clouds fade into sky color at distance
      float fogAmount = 1.0 - exp(-0.0015 * dist * dist);
      col = mix(col, bgcol, fogAmount);
      
      // Accumulate with premultiplied alpha blending
      float alpha = density * CLOUD_DENSITY;
      col *= alpha;
      
      // Front-to-back compositing
      return sum + vec4(col, alpha) * (1.0 - sum.a);
    }
    
    // ==========================================================================
    // RAYMARCHING - Steps through the cloud volume
    // ==========================================================================
    
    vec4 raymarch(vec3 rayOrigin, vec3 rayDir, vec3 bgcol) {
      vec4 sum = vec4(0.0);
      
      // Calculate where ray enters and exits the cloud layer
      float tmin = (CLOUD_HEIGHT_MIN - rayOrigin.y) / rayDir.y;
      float tmax = (CLOUD_HEIGHT_MAX - rayOrigin.y) / rayDir.y;
      
      // Ensure tmin < tmax
      if(tmin > tmax) {
        float tmp = tmin; tmin = tmax; tmax = tmp;
      }
      
      // Clamp to valid range
      tmin = max(0.0, tmin);
      tmax = min(MAX_DISTANCE, tmax);
      
      // Early exit if no intersection with cloud layer
      if(tmin > tmax) return sum;
      
      float t = tmin;
      
      // =======================================================================
      // RAYMARCH LOOP - Sample cloud density at steps along ray
      // =======================================================================
      // More iterations = higher quality but slower
      // 64 is a good balance for web
      for(int i = 0; i < 64; i++) {
        // Early exit if cloud is opaque or ray goes too far
        if(sum.a > 0.99 || t > tmax) break;
        
        vec3 pos = rayOrigin + t * rayDir;
        
        // Sample cloud density at this position
        float density = map5(pos);
        
        if(density > 0.01) {
          // ===================================================================
          // LIGHTING - Sample density towards sun to determine shadowing
          // ===================================================================
          float sunSample = map3(pos + sunDir * 0.6);
          float lighting = clamp((density - sunSample) / 0.5 + 0.5, 0.0, 1.0);
          
          // Add this sample's contribution
          sum = integrate(sum, lighting, density, bgcol, t);
        }
        
        // =====================================================================
        // ADAPTIVE STEP SIZE - Bigger steps in empty space, smaller in clouds
        // =====================================================================
        float stepSize = max(0.05, 0.03 * t);
        stepSize *= (1.0 + 2.0 * (1.0 - density)); // Larger steps when no clouds
        t += stepSize;
      }
      
      // Unpremultiply alpha for final color
      if(sum.a > 0.001) {
        sum.rgb /= sum.a;
      }
      
      return clamp(sum, 0.0, 1.0);
    }
    
    // ==========================================================================
    // SKY COLOR - Gradient background behind clouds
    // ==========================================================================
    
    vec3 getSkyColor(vec3 rd) {
      // Vertical gradient from horizon to zenith
      float t = max(0.0, rd.y);
      vec3 sky = mix(SKY_HORIZON, SKY_ZENITH, t);
      
      // Sun glow effect
      float sunAmount = clamp(dot(rd, sunDir), 0.0, 1.0);
      
      // Sharp sun disk
      sky += vec3(1.0, 0.9, 0.7) * pow(sunAmount, 32.0) * 0.4;
      // Soft sun halo
      sky += vec3(1.0, 0.7, 0.4) * pow(sunAmount, 8.0) * 0.25;
      
      return sky;
    }
    
    // ==========================================================================
    // MAIN - Entry point
    // ==========================================================================
    
    void main() {
      // Convert pixel coordinates to normalized UV (-1 to 1, aspect corrected)
      vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
      
      // ========================================================================
      // CAMERA SETUP
      // ========================================================================
      
      // Camera position - moves forward over time
      vec3 ro = vec3(0.0, 0.0, u_time * 0.04);
      
      // Camera target - looking up at the clouds
      vec3 ta = vec3(0.0, 1.8, ro.z + 2.5);
      
      // Mouse influence on camera (optional - adds interactivity)
      vec2 m = u_mouse * 2.0 - 1.0;
      ta.x += m.x * 0.4;
      ta.y += m.y * 0.25;
      
      // Build camera matrix
      vec3 cw = normalize(ta - ro);           // Camera forward
      vec3 cp = vec3(0.0, 1.0, 0.0);          // World up
      vec3 cu = normalize(cross(cw, cp));     // Camera right
      vec3 cv = cross(cu, cw);                // Camera up
      
      // Create ray direction from camera through pixel
      // The 1.5 controls field of view (lower = wider)
      vec3 rd = normalize(uv.x * cu + uv.y * cv + 1.5 * cw);
      
      // ========================================================================
      // RENDER
      // ========================================================================
      
      // Get sky background color
      vec3 bgcol = getSkyColor(rd);
      
      // Raymarch through clouds
      vec4 clouds = raymarch(ro, rd, bgcol);
      
      // Composite clouds over sky
      vec3 col = mix(bgcol, clouds.rgb, clouds.a);
      
      // ========================================================================
      // POST-PROCESSING
      // ========================================================================
      
      // Subtle tone mapping (prevents over-bright areas)
      col = col / (1.0 + col * 0.15);
      
      // Gamma correction for display
      col = pow(col, vec3(0.95));
      
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  // ============================================================================
  // CLOUDS RENDERER CLASS - WebGL setup and rendering loop
  // ============================================================================
  // 
  // This class handles:
  // - WebGL context creation
  // - Shader compilation
  // - Uniform management  
  // - Animation loop with pause/resume
  // - Mouse interaction
  // - Performance optimization (renders at 50% resolution)
  //
  // ============================================================================

  class CloudsRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      
      // Create WebGL context with performance settings
      this.gl = canvas.getContext('webgl', { 
        antialias: false,      // Disable for performance
        alpha: false,          // No transparency needed
        powerPreference: 'default'  // Balance power/performance
      }) || canvas.getContext('experimental-webgl');
      
      if (!this.gl) {
        console.warn('WebGL not supported');
        return;
      }
      
      this.program = null;
      this.startTime = Date.now();
      this.mouseX = 0.5;
      this.mouseY = 0.5;
      this.isRunning = false;
      this.animationId = null;
      
      this.init();
    }
    
    createShader(type, source) {
      const gl = this.gl;
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      
      return shader;
    }
    
    createProgram(vertexShader, fragmentShader) {
      const gl = this.gl;
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return null;
      }
      
      return program;
    }
    
    init() {
      const gl = this.gl;
      
      // Create shaders
      const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexShaderSource);
      const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
      
      if (!vertexShader || !fragmentShader) {
        console.error('Failed to create shaders');
        return;
      }
      
      // Create program
      this.program = this.createProgram(vertexShader, fragmentShader);
      if (!this.program) {
        console.error('Failed to create program');
        return;
      }
      
      gl.useProgram(this.program);
      
      // Create geometry (full screen quad)
      const positions = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1
      ]);
      
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      
      // Setup attributes
      const positionLocation = gl.getAttribLocation(this.program, 'a_position');
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      
      // Get uniform locations
      this.uniforms = {
        time: gl.getUniformLocation(this.program, 'u_time'),
        resolution: gl.getUniformLocation(this.program, 'u_resolution'),
        mouse: gl.getUniformLocation(this.program, 'u_mouse')
      };
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initial resize
      this.resize();
      
      console.log('Clouds shader initialized successfully');
    }
    
    setupEventListeners() {
      // Mouse move
      document.addEventListener('mousemove', (e) => {
        this.mouseX = e.clientX / window.innerWidth;
        this.mouseY = 1.0 - e.clientY / window.innerHeight;
      });
      
      // Touch move
      document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
          this.mouseX = e.touches[0].clientX / window.innerWidth;
          this.mouseY = 1.0 - e.touches[0].clientY / window.innerHeight;
        }
      }, { passive: true });
      
      // Resize
      window.addEventListener('resize', () => this.resize());
      
      // Visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pause();
        } else {
          this.start();
        }
      });
      
      // Intersection observer
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.start();
          } else {
            this.pause();
          }
        });
      }, { threshold: 0.1 });
      
      observer.observe(this.canvas);
    }
    
    // ========================================================================
    // RESIZE HANDLER
    // ========================================================================
    // Renders at lower resolution for performance
    // Change 'scale' to adjust quality vs performance:
    // - 0.25 = very fast, lower quality
    // - 0.5 = balanced (default)
    // - 1.0 = full resolution, slower
    // ========================================================================
    resize() {
      const scale = 0.5; // ADJUST THIS FOR QUALITY VS PERFORMANCE
      const width = Math.floor(this.canvas.clientWidth * scale);
      const height = Math.floor(this.canvas.clientHeight * scale);
      
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
    
    render() {
      if (!this.program || !this.isRunning) return;
      
      const gl = this.gl;
      const time = (Date.now() - this.startTime) / 1000;
      
      // Update uniforms
      gl.uniform1f(this.uniforms.time, time);
      gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
      gl.uniform2f(this.uniforms.mouse, this.mouseX, this.mouseY);
      
      // Draw
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      
      this.animationId = requestAnimationFrame(() => this.render());
    }
    
    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.render();
    }
    
    pause() {
      this.isRunning = false;
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    }
    
    destroy() {
      this.pause();
      if (this.gl && this.program) {
        this.gl.deleteProgram(this.program);
      }
    }
  }

  // Initialize when DOM is ready
  function init() {
    const canvas = document.getElementById('clouds-canvas');
    if (!canvas) {
      console.log('No clouds canvas found');
      return;
    }
    
    // Check if mobile and if should be disabled
    const container = document.querySelector('.clouds-container');
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (container && container.dataset.disableMobile === 'true' && isMobile) {
      container.classList.add('clouds-fallback');
      return;
    }
    
    if (!isWebGLSupported()) {
      console.log('WebGL not supported, using fallback');
      if (container) {
        container.classList.add('clouds-fallback');
      }
      return;
    }
    
    const renderer = new CloudsRenderer(canvas);
    renderer.start();
    
    // Expose for debugging
    window.cloudsRenderer = renderer;
  }
  
  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
