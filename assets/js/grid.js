/**
 * ============================================================================
 * DATA GRID SHADER - Matrix (Data Intelligence Platform)
 * ============================================================================
 * Pulsing grid lines and data-rain effect with cyan tones.
 * Cyan palette matching Matrix brand (#0891B2).
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
    
    float hash1(float p) {
      return fract(sin(p * 127.1) * 43758.5453);
    }
    
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float aspect = u_resolution.x / u_resolution.y;
      vec2 p = uv;
      p.x *= aspect;
      
      float t = u_time * 0.15;
      
      // Cool gradient background
      vec3 bgTop = vec3(0.93, 0.99, 1.0);    // Ice white
      vec3 bgBottom = vec3(0.81, 0.97, 0.99); // Light cyan
      vec3 color = mix(bgBottom, bgTop, uv.y);
      
      // Grid lines
      float gridSize = 0.06;
      vec2 grid = mod(p, gridSize);
      float lineWidth = 0.001;
      
      // Horizontal and vertical grid lines
      float hLine = smoothstep(lineWidth, 0.0, abs(grid.y));
      float vLine = smoothstep(lineWidth, 0.0, abs(grid.x));
      float gridLines = max(hLine, vLine);
      
      // Pulse effect - grid lines pulse outward from center
      vec2 center = vec2(aspect * 0.5, 0.5);
      float distFromCenter = length(p - center);
      float pulse = sin(distFromCenter * 15.0 - t * 3.0) * 0.5 + 0.5;
      
      // Mouse proximity glow
      vec2 mouseP = vec2(u_mouse.x * aspect, u_mouse.y);
      float mouseDist = length(p - mouseP);
      float mouseGlow = smoothstep(0.3, 0.0, mouseDist);
      
      // Apply grid with pulse and mouse glow
      vec3 gridColor = vec3(0.033, 0.569, 0.698); // Cyan (#0891B2)
      float gridAlpha = gridLines * (0.08 + pulse * 0.06 + mouseGlow * 0.15);
      color = mix(color, gridColor, gridAlpha);
      
      // Intersection dots (where grid lines cross)
      vec2 nearestIntersection = (floor(p / gridSize) + 0.5) * gridSize;
      // Use round instead since we want nearest, but floor+0.5 works too
      nearestIntersection = floor(p / gridSize) * gridSize;
      float dotDist = length(p - nearestIntersection);
      float dot = smoothstep(0.003, 0.001, dotDist);
      float dotPulse = sin(nearestIntersection.x * 50.0 + nearestIntersection.y * 50.0 + t * 2.0) * 0.5 + 0.5;
      color = mix(color, gridColor, dot * (0.2 + dotPulse * 0.3 + mouseGlow * 0.4));
      
      // Data rain columns
      for (int i = 0; i < 12; i++) {
        float fi = float(i);
        float seed = hash(vec2(fi * 7.13, fi * 3.71));
        
        // Column position
        float colX = seed * aspect;
        
        // Rain drop position (falling)
        float speed = 0.1 + seed * 0.08;
        float dropY = fract(-t * speed + seed * 7.0);
        
        // Column width
        float colWidth = 0.002;
        float inCol = smoothstep(colWidth, 0.0, abs(p.x - colX));
        
        // Trail (fading upward from drop)
        float trailLength = 0.08 + seed * 0.06;
        float trail = smoothstep(trailLength, 0.0, p.y - dropY) * step(dropY, p.y);
        trail *= inCol;
        
        // Drop head (bright point)
        float dropDist = length(vec2(p.x - colX, p.y - dropY));
        float dropHead = smoothstep(0.005, 0.0, dropDist);
        
        // Characters shimmer along trail
        float charY = floor((p.y - dropY) * 60.0);
        float charFlicker = step(0.7, hash(vec2(colX * 100.0, charY + floor(t * 2.0))));
        trail *= (0.5 + charFlicker * 0.5);
        
        vec3 rainColor = vec3(0.033, 0.569, 0.698); // Cyan
        color = mix(color, rainColor, trail * 0.15 + dropHead * 0.4);
      }
      
      // Floating data nodes
      for (int i = 0; i < 6; i++) {
        float fi = float(i);
        float seed = hash(vec2(fi * 17.3, fi * 11.9));
        
        float x = fract(seed * 3.7 + t * 0.01) * aspect;
        float y = 0.2 + seed * 0.6 + sin(t * 0.3 + fi * 1.5) * 0.05;
        
        float dist = length(p - vec2(x, y));
        
        // Node circle
        float node = smoothstep(0.008, 0.005, dist) - smoothstep(0.005, 0.003, dist);
        // Inner dot
        float inner = smoothstep(0.003, 0.0, dist);
        float nodePulse = 0.5 + 0.5 * sin(t * 2.0 + fi * 1.7);
        
        color = mix(color, vec3(0.033, 0.569, 0.698), (node + inner) * (0.3 + nodePulse * 0.2));
        
        // Connection lines between nearby nodes
        if (i < 5) {
          float nextSeed = hash(vec2((fi + 1.0) * 17.3, (fi + 1.0) * 11.9));
          float nx = fract(nextSeed * 3.7 + t * 0.01) * aspect;
          float ny = 0.2 + nextSeed * 0.6 + sin(t * 0.3 + (fi + 1.0) * 1.5) * 0.05;
          
          // Line between nodes
          vec2 a = vec2(x, y);
          vec2 b = vec2(nx, ny);
          vec2 pa = p - a;
          vec2 ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          float lineDist = length(pa - ba * h);
          float line = smoothstep(0.002, 0.0, lineDist);
          color = mix(color, vec3(0.033, 0.569, 0.698), line * 0.06);
        }
      }
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  class GridRenderer {
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
    const renderer = new GridRenderer(canvas);
    renderer.start();
    window.gridRenderer = renderer;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
