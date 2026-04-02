/**
 * ============================================================================
 * KITCHEN STEAM SHADER - DeshiKitchen (Restaurant Platform)
 * ============================================================================
 * Rising steam/spice wisps with warm orange tones.
 * Orange palette matching DeshiKitchen brand (#F97316).
 * ============================================================================
 */

(function () {
  'use strict';

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

  const vertexShaderSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentShaderSource = `
    precision highp float;
    
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float u_scroll;
    
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
    
    // FBM for steam/smoke
    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }
    
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float aspect = u_resolution.x / u_resolution.y;
      vec2 p = uv;
      p.x *= aspect;
      
      float t = u_time * 0.1;
      
      // Warm gradient background
      vec3 bgTop = vec3(1.0, 0.99, 0.93);    // Warm white
      vec3 bgBottom = vec3(0.996, 0.91, 0.77); // Soft amber
      vec3 color = mix(bgBottom, bgTop, uv.y);
      
      // Rising steam wisps
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float seed = hash(vec2(fi * 7.3, fi * 3.1));
        
        // Steam source position spread across bottom
        float baseX = 0.15 + seed * (aspect - 0.3);
        
        // Rising motion with drift
        float rise = fract(t * (0.08 + seed * 0.04) + seed * 5.0);
        float y = rise;
        float x = baseX + sin(t * 0.3 + fi * 2.0 + y * 3.0) * 0.08 * (0.5 + y);
        
        // Mouse interaction - steam follows mouse gently
        x += (u_mouse.x - 0.5) * 0.03 * y;
        
        // Steam shape using FBM noise
        vec2 steamUV = (p - vec2(x, y)) * 4.0;
        float steamNoise = fbm(steamUV + vec2(t * 0.5, -t * 1.5));
        
        // Wisp shape - widens as it rises
        float width = 0.03 + y * 0.06;
        float dist = length(vec2((p.x - x) / width, (p.y - y) * 2.0));
        float steam = smoothstep(1.0, 0.0, dist) * steamNoise;
        
        // Fade in from bottom, fade out at top
        float fade = smoothstep(0.0, 0.15, y) * smoothstep(1.0, 0.6, y);
        steam *= fade;
        
        // Warm steam color
        vec3 steamColor = mix(
          vec3(1.0, 0.95, 0.9),  // Light steam
          vec3(0.976, 0.569, 0.086), // Orange tint
          0.1 + seed * 0.15
        );
        
        color = mix(color, steamColor, steam * 0.3);
      }
      
      // Floating spice particles
      for (int i = 0; i < 8; i++) {
        float fi = float(i);
        float seed = hash(vec2(fi * 13.7, fi * 9.3));
        
        float x = fract(seed * 3.7 + t * 0.02 + sin(t + fi) * 0.01) * aspect;
        float y = fract(seed * 5.1 + t * 0.04);
        
        // Gentle swirl
        x += sin(t * 0.5 + fi * 1.3) * 0.03;
        y += cos(t * 0.3 + fi * 1.7) * 0.02;
        
        float dist = length(p - vec2(x, y));
        float particle = smoothstep(0.004, 0.0, dist);
        
        // Spice colors - orange, red, yellow
        vec3 spiceColor;
        if (seed > 0.66) {
          spiceColor = vec3(0.976, 0.451, 0.086); // Orange
        } else if (seed > 0.33) {
          spiceColor = vec3(0.898, 0.224, 0.078); // Red pepper
        } else {
          spiceColor = vec3(0.976, 0.78, 0.086); // Turmeric yellow
        }
        
        color = mix(color, spiceColor, particle * 0.35);
      }
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  class KitchenRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!this.gl) return;
      this.isRunning = false;
      this.animationId = null;
      this.startTime = Date.now();
      this.mouseX = 0.5;
      this.mouseY = 0.5;
      this.scrollY = 0;
      this.program = null;
      this.uniforms = {};
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

    createProgram(vs, fs) {
      const gl = this.gl;
      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return null;
      }
      return program;
    }

    init() {
      const gl = this.gl;
      const vs = this.createShader(gl.VERTEX_SHADER, vertexShaderSource);
      const fs = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
      if (!vs || !fs) return;
      this.program = this.createProgram(vs, fs);
      if (!this.program) return;
      gl.useProgram(this.program);

      const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(this.program, 'a_position');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      this.uniforms = {
        time: gl.getUniformLocation(this.program, 'u_time'),
        resolution: gl.getUniformLocation(this.program, 'u_resolution'),
        mouse: gl.getUniformLocation(this.program, 'u_mouse'),
        scroll: gl.getUniformLocation(this.program, 'u_scroll'),
      };
      this.setupEventListeners();
      this.resize();
    }

    setupEventListeners() {
      document.addEventListener('mousemove', (e) => {
        this.mouseX = e.clientX / window.innerWidth;
        this.mouseY = 1.0 - e.clientY / window.innerHeight;
      });
      document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
          this.mouseX = e.touches[0].clientX / window.innerWidth;
          this.mouseY = 1.0 - e.touches[0].clientY / window.innerHeight;
        }
      }, { passive: true });
      window.addEventListener('scroll', () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        this.scrollY = window.scrollY / Math.max(1, max);
      }, { passive: true });
      window.addEventListener('resize', () => this.resize());
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.pause();
        else this.start();
      });
    }

    resize() {
      const scale = 0.5;
      const w = Math.floor(this.canvas.clientWidth * scale);
      const h = Math.floor(this.canvas.clientHeight * scale);
      this.canvas.width = w;
      this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }

    render() {
      if (!this.program || !this.isRunning) return;
      const gl = this.gl;
      const time = (Date.now() - this.startTime) / 1000;
      gl.uniform1f(this.uniforms.time, time);
      gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
      gl.uniform2f(this.uniforms.mouse, this.mouseX, this.mouseY);
      gl.uniform1f(this.uniforms.scroll, this.scrollY);
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
      if (this.gl && this.program) this.gl.deleteProgram(this.program);
    }
  }

  function init() {
    const canvas = document.getElementById('clouds-canvas');
    if (!canvas) return;
    const container = document.querySelector('.clouds-global-bg');
    if (!isWebGLSupported()) {
      if (container) container.classList.add('webgl-fallback');
      return;
    }
    const renderer = new KitchenRenderer(canvas);
    renderer.start();
    window.kitchenRenderer = renderer;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
