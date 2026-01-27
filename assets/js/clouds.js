/**
 * ============================================================================
 * VOLUMETRIC CLOUDS SHADER - Baseet Studio
 * ============================================================================
 * 
 * Based on Inigo Quilez's famous "Clouds" shader (ShaderToy XslGRr)
 * Procedural volumetric clouds using raymarching - NO TEXTURES NEEDED!
 * 
 * Creates a "flying through clouds" experience - camera is AT cloud level,
 * gently drifting forward through an infinite procedural cloudscape.
 * 
 * ============================================================================
 * HOW IT WORKS:
 * ============================================================================
 * 1. Camera is positioned INSIDE the cloud layer, looking forward
 * 2. Procedural 3D noise creates infinite, non-repeating cloud formations
 * 3. Raymarching samples cloud density along view rays
 * 4. Gentle camera movement creates the sensation of flight
 * 5. Clouds naturally "loop" because noise is mathematically infinite
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
    // CUSTOMIZATION PARAMETERS - OPTIMIZED FOR PERFORMANCE
    // ==========================================================================
    
    // COVERAGE: How much of the sky has clouds (0.0 to 1.0)
    const float COVERAGE = 0.42;
    
    // CLOUD_SCALE: Size of the clouds (higher = smaller individual clouds)
    const float CLOUD_SCALE = 0.5;
    
    // CLOUD_SPEED: Animation speed
    const float CLOUD_SPEED = 0.1;
    
    // CLOUD_DENSITY: How thick/opaque clouds appear
    const float CLOUD_DENSITY = 0.65;
    
    // ==========================================================================
    // LIGHTING PARAMETERS
    // ==========================================================================
    
    vec3 sunDir = normalize(vec3(-0.7, 0.5, -0.6));
    const vec3 CLOUD_COLOR = vec3(1.0, 0.98, 0.95);
    const vec3 SHADOW_COLOR = vec3(0.4, 0.45, 0.6);
    
    // ==========================================================================
    // SKY PARAMETERS
    // ==========================================================================
    
    const vec3 SKY_HORIZON = vec3(0.7, 0.82, 0.95);
    const vec3 SKY_ZENITH = vec3(0.35, 0.55, 0.85);
    
    // ==========================================================================
    // CLOUD LAYER PARAMETERS
    // ==========================================================================
    
    const float CAMERA_HEIGHT = 1.5;
    const float CLOUD_HEIGHT_MIN = -2.0;
    const float CLOUD_HEIGHT_MAX = 5.0;
    const float MAX_DISTANCE = 60.0;
    
    // ==========================================================================
    // OPTIMIZED NOISE - Simple and fast!
    // ==========================================================================
    
    // Fast hash
    float hash(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }
    
    // Simple 3D noise - fast version
    float noise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);  // Cubic interpolation
      
      return mix(
        mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z
      );
    }
    
    // ==========================================================================
    // CLOUD DENSITY - Clean FBM, no expensive Worley
    // ==========================================================================
    
    float cloudDensity(vec3 p, int octaves) {
      vec3 q = p * CLOUD_SCALE;
      q.y *= 0.5;  // Flatten vertically
      q.z -= u_time * CLOUD_SPEED;
      
      // Large scale variation to create separate cloud clusters
      float largeMask = noise(q * 0.3) * 0.4;
      
      // Simple FBM - 4 octaves max for performance
      float fbm = 0.0;
      float amp = 0.5;
      float freq = 1.0;
      
      for(int i = 0; i < 4; i++) {
        if(i >= octaves) break;
        fbm += amp * noise(q * freq);
        freq *= 2.0;
        amp *= 0.5;
      }
      
      // Add large scale mask to create gaps between cloud groups
      fbm = fbm * (0.7 + largeMask);
      
      // Coverage threshold
      float density = fbm - (1.0 - COVERAGE);
      
      // Sharper edges for more distinct individual clouds
      return smoothstep(0.0, 0.08, density);
    }
    
    float map4(vec3 p) { return cloudDensity(p, 4); }
    float map2(vec3 p) { return cloudDensity(p, 2); }
    
    // ==========================================================================
    // RAYMARCHING - Optimized with fewer steps
    // ==========================================================================
    
    vec4 raymarch(vec3 ro, vec3 rd, vec3 bgcol) {
      vec4 sum = vec4(0.0);
      float t = 0.5;
      
      // Reduced to 50 steps for performance
      for(int i = 0; i < 50; i++) {
        if(sum.a > 0.95 || t > MAX_DISTANCE) break;
        
        vec3 pos = ro + t * rd;
        
        // Skip if outside cloud layer
        if(pos.y < CLOUD_HEIGHT_MIN || pos.y > CLOUD_HEIGHT_MAX) {
          t += 0.8;
          continue;
        }
        
        float density = map4(pos);
        
        if(density > 0.01) {
          // Simple lighting
          float lit = clamp((density - map2(pos + sunDir * 0.5)) / 0.4 + 0.5, 0.0, 1.0);
          vec3 col = mix(SHADOW_COLOR, CLOUD_COLOR, lit);
          
          // Distance fade
          col = mix(col, bgcol, 1.0 - exp(-0.002 * t * t));
          
          // Accumulate
          float alpha = density * CLOUD_DENSITY;
          col *= alpha;
          sum += vec4(col, alpha) * (1.0 - sum.a);
        }
        
        // Adaptive stepping
        t += max(0.1, 0.05 * t) * (1.0 + 2.0 * (1.0 - density));
      }
      
      if(sum.a > 0.001) sum.rgb /= sum.a;
      return clamp(sum, 0.0, 1.0);
    }
    
    // ==========================================================================
    // SKY COLOR
    // ==========================================================================
    
    vec3 getSkyColor(vec3 rd) {
      float t = max(0.0, rd.y);
      vec3 sky = mix(SKY_HORIZON, SKY_ZENITH, t);
      
      // Sun glow
      float sunAmount = clamp(dot(rd, sunDir), 0.0, 1.0);
      sky += vec3(1.0, 0.9, 0.7) * pow(sunAmount, 32.0) * 0.3;
      sky += vec3(1.0, 0.7, 0.4) * pow(sunAmount, 8.0) * 0.2;
      
      return sky;
    }
    
    // ==========================================================================
    // MAIN
    // ==========================================================================
    
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
      
      // Camera - flying through clouds
      float flySpeed = u_time * 0.15;
      vec3 ro = vec3(
        sin(u_time * 0.02) * 0.5,
        CAMERA_HEIGHT + sin(u_time * 0.015) * 0.3,
        flySpeed
      );
      
      vec3 ta = vec3(
        ro.x + sin(u_time * 0.01) * 0.3,
        ro.y,
        ro.z + 5.0
      );
      
      // Mouse look
      vec2 m = u_mouse * 2.0 - 1.0;
      ta.x += m.x * 0.3;
      ta.y += m.y * 0.2;
      
      // Camera matrix
      vec3 cw = normalize(ta - ro);
      vec3 cu = normalize(cross(cw, vec3(0,1,0)));
      vec3 cv = cross(cu, cw);
      
      vec3 rd = normalize(uv.x * cu + uv.y * cv + 1.4 * cw);
      
      // Render
      vec3 sky = getSkyColor(rd);
      vec4 clouds = raymarch(ro, rd, sky);
      
      vec3 col = mix(sky, clouds.rgb, clouds.a);
      
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
