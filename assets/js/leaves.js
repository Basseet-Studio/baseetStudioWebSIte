/**
 * ============================================================================
 * FLOATING LEAVES SHADER - Numu (Habit Tracking App)
 * ============================================================================
 * Gentle floating leaf particles with nature tones.
 * Purple/green palette matching Numu brand (#AF52DE).
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
    
    // Hash function for pseudo-random values
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    
    // Smooth noise
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
    
    // Leaf shape SDF
    float leafShape(vec2 p, float size) {
      p /= size;
      float r = length(p);
      float a = atan(p.y, p.x);
      float leaf = r - 0.5 * (1.0 + 0.3 * cos(a * 2.0)) * (1.0 - smoothstep(0.0, 0.8, r));
      return smoothstep(0.02, 0.0, leaf) * size;
    }
    
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float aspect = u_resolution.x / u_resolution.y;
      vec2 p = uv;
      p.x *= aspect;
      
      float t = u_time * 0.15;
      
      // Gentle gradient background
      vec3 bgTop = vec3(0.94, 1.0, 0.96);    // Light mint
      vec3 bgBottom = vec3(0.78, 0.94, 0.82); // Soft green
      vec3 color = mix(bgBottom, bgTop, uv.y);
      
      // Add subtle purple tint (Numu brand)
      color += vec3(0.03, 0.0, 0.05) * (1.0 - uv.y);
      
      // Floating leaves
      float leafAlpha = 0.0;
      for (int i = 0; i < 12; i++) {
        float fi = float(i);
        float seed = hash(vec2(fi * 7.13, fi * 3.71));
        
        // Leaf position - gentle floating motion
        float x = fract(seed + t * (0.02 + seed * 0.03)) * (aspect + 0.4) - 0.2;
        float y = fract(seed * 5.17 + t * (0.04 + seed * 0.02) + sin(t + fi) * 0.03);
        
        // Gentle swaying
        x += sin(t * 0.5 + fi * 1.7) * 0.08;
        y += cos(t * 0.3 + fi * 2.3) * 0.04;
        
        // Mouse interaction
        x += (u_mouse.x - 0.5) * 0.02;
        y += (u_mouse.y - 0.5) * 0.02;
        
        float size = 0.02 + seed * 0.025;
        
        // Rotation
        float angle = t * 0.3 + fi * 1.2 + sin(t + fi) * 0.5;
        vec2 d = p - vec2(x, y);
        vec2 rd = vec2(
          d.x * cos(angle) - d.y * sin(angle),
          d.x * sin(angle) + d.y * cos(angle)
        );
        
        float leaf = leafShape(rd, size);
        
        // Color variation - purples and greens
        vec3 leafColor;
        if (seed > 0.5) {
          leafColor = mix(vec3(0.686, 0.322, 0.871), vec3(0.749, 0.353, 0.949), seed); // Purple tones
        } else {
          leafColor = mix(vec3(0.3, 0.7, 0.4), vec3(0.4, 0.8, 0.3), seed); // Green tones
        }
        
        float alpha = leaf * (0.3 + seed * 0.3);
        color = mix(color, leafColor, alpha);
        leafAlpha = max(leafAlpha, alpha);
      }
      
      // Subtle floating particles (pollen/dust)
      for (int i = 0; i < 8; i++) {
        float fi = float(i);
        float seed = hash(vec2(fi * 11.3, fi * 7.9));
        float x = fract(seed * 3.7 + t * 0.03) * aspect;
        float y = fract(seed * 5.1 + t * 0.05);
        float dist = length(p - vec2(x, y));
        float particle = smoothstep(0.005, 0.0, dist);
        color += vec3(0.686, 0.322, 0.871) * particle * 0.2;
      }
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  class LeafRenderer {
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

    const renderer = new LeafRenderer(canvas);
    renderer.start();
    window.leafRenderer = renderer;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
