/**
 * ============================================================================
 * SHOPPING BAGS SHADER - ChopShop (B2C Shopping Platform)
 * ============================================================================
 * Floating package/bag outlines with rose accents.
 * Rose palette matching ChopShop brand (#E11D48).
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
    
    // Shopping bag shape (rectangle with handle)
    float shoppingBag(vec2 p, vec2 size, float angle) {
      // Rotate
      vec2 rp = vec2(
        p.x * cos(angle) - p.y * sin(angle),
        p.x * sin(angle) + p.y * cos(angle)
      );
      
      // Bag body - rounded rectangle
      vec2 d = abs(rp) - size;
      float body = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
      float bodyShape = smoothstep(0.002, 0.0, body) - smoothstep(0.0, -0.003, body);
      
      // Handle (arc above bag)
      float handleY = rp.y - size.y - 0.005;
      float handleDist = length(vec2(rp.x, handleY)) - 0.008;
      float handle = smoothstep(0.002, 0.0, abs(handleDist)) * step(0.0, handleY) * step(abs(rp.x), size.x * 0.5);
      
      return bodyShape + handle;
    }
    
    // Price tag shape
    float priceTag(vec2 p, float size) {
      vec2 sp = p / size;
      float rect = max(abs(sp.x) - 0.6, abs(sp.y) - 0.4);
      float tag = smoothstep(0.05, 0.0, rect) - smoothstep(0.0, -0.08, rect);
      // Hole
      float hole = smoothstep(0.15, 0.1, length(sp - vec2(0.4, 0.2)));
      return tag * (1.0 - hole * 0.5);
    }
    
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float aspect = u_resolution.x / u_resolution.y;
      vec2 p = uv;
      p.x *= aspect;
      
      float t = u_time * 0.1;
      
      // Soft rose gradient background
      vec3 bgTop = vec3(1.0, 0.95, 0.96);    // Light rose
      vec3 bgBottom = vec3(0.992, 0.80, 0.83); // Soft pink
      vec3 color = mix(bgBottom, bgTop, uv.y);
      
      // Floating shopping bags (outlines)
      for (int i = 0; i < 8; i++) {
        float fi = float(i);
        float seed = hash(vec2(fi * 7.13, fi * 3.71));
        
        // Gentle float motion
        float x = fract(seed + t * (0.01 + seed * 0.015)) * (aspect + 0.3) - 0.15;
        float y = fract(seed * 5.17 + t * (0.025 + seed * 0.01));
        
        // Sway
        x += sin(t * 0.3 + fi * 2.1) * 0.04;
        y += cos(t * 0.2 + fi * 1.7) * 0.02;
        
        // Mouse
        x += (u_mouse.x - 0.5) * 0.01;
        y += (u_mouse.y - 0.5) * 0.01;
        
        vec2 size = vec2(0.015 + seed * 0.01, 0.02 + seed * 0.012);
        float angle = sin(t * 0.2 + fi * 1.3) * 0.2;
        
        float bag = shoppingBag(p - vec2(x, y), size, angle);
        
        // Color variation - rose tones
        vec3 bagColor;
        float cs = hash(vec2(fi * 13.7, fi * 9.3));
        if (cs > 0.66) {
          bagColor = vec3(0.882, 0.114, 0.282); // Rose (#E11D48)
        } else if (cs > 0.33) {
          bagColor = vec3(0.984, 0.443, 0.522); // Light rose
        } else {
          bagColor = vec3(0.957, 0.6, 0.65); // Soft pink
        }
        
        color = mix(color, bagColor, bag * (0.3 + seed * 0.2));
      }
      
      // Floating price tags
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float seed = hash(vec2(fi * 11.3, fi * 7.9));
        
        float x = fract(seed * 3.7 + t * 0.015) * aspect;
        float y = fract(seed * 5.1 + t * 0.03);
        
        float angle = t * 0.2 + fi * 1.5;
        vec2 rp = p - vec2(x, y);
        vec2 rotP = vec2(
          rp.x * cos(angle) - rp.y * sin(angle),
          rp.x * sin(angle) + rp.y * cos(angle)
        );
        
        float tag = priceTag(rotP, 0.015 + seed * 0.008);
        vec3 tagColor = vec3(0.976, 0.835, 0.184); // Gold tag
        color = mix(color, tagColor, tag * 0.2);
      }
      
      // Sparkle particles
      for (int i = 0; i < 6; i++) {
        float fi = float(i);
        float seed = hash(vec2(fi * 17.3, fi * 11.9));
        float x = fract(seed * 4.7 + t * 0.02) * aspect;
        float y = fract(seed * 6.3 + t * 0.03);
        float dist = length(p - vec2(x, y));
        float sparkle = smoothstep(0.004, 0.0, dist) * (0.5 + 0.5 * sin(t * 3.0 + fi * 2.0));
        color += vec3(0.882, 0.114, 0.282) * sparkle * 0.25;
      }
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  class ShoppingRenderer {
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
    const renderer = new ShoppingRenderer(canvas);
    renderer.start();
    window.shoppingRenderer = renderer;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
