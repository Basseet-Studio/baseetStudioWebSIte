# Volumetric Clouds Implementation Tasks

## Overview

This document provides a step-by-step task breakdown for implementing volumetric clouds with scroll behavior on the Baseet Studio website. Tasks are organized by phase and include code snippets, file locations, and completion criteria.

---

## Phase 1: Three.js Foundation (Week 1)

### Task 1.1: Install Three.js Dependency

**Objective**: Add Three.js to the Hugo project

**Steps**:
1. Add Three.js to package.json
2. Verify Hugo can bundle it

**Files to modify**:
- `package.json`

**Code**:
```json
{
  "dependencies": {
    "three": "^0.160.0"
  }
}
```

**Commands**:
```bash
npm install three --save
```

**Completion Criteria**:
- [ ] Three.js installed via npm
- [ ] No installation errors
- [ ] `node_modules/three` directory exists

---

### Task 1.2: Create Volumetric Clouds JavaScript Module

**Objective**: Create the main Three.js cloud renderer

**Files to create**:
- `assets/js/volumetric-clouds.js`

**Code**:
```javascript
import * as THREE from 'three';

// Improved Perlin Noise Generator
class ImprovedNoise {
    constructor() {
        this.p = new Uint8Array(512);
        const random = Math.random;
        for (let i = 0; i < 256; i++) {
            this.p[i] = Math.floor(random() * 256);
        }
        for (let i = 0; i < 256; i++) {
            this.p[256 + i] = this.p[i];
        }
    }

    noise(x, y, z) {
        const p = this.p;
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);

        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);

        const A = p[X] + Y;
        const AA = p[A] + Z;
        const AB = p[A + 1] + Z;
        const B = p[X + 1] + Y;
        const BA = p[B] + Z;
        const BB = p[B + 1] + Z;

        return this.lerp(
            w,
            this.lerp(
                v,
                this.lerp(u, this.grad(p[AA], x, y, z), this.grad(p[BA], x - 1, y, z)),
                this.lerp(u, this.grad(p[AB], x, y - 1, z), this.grad(p[BB], x - 1, y - 1, z))
            ),
            this.lerp(
                v,
                this.lerp(u, this.grad(p[AA + 1], x, y, z - 1), this.grad(p[BA + 1], x - 1, y, z - 1)),
                this.lerp(u, this.grad(p[AB + 1], x, y - 1, z - 1), this.grad(p[BB + 1], x - 1, y - 1, z - 1))
            )
        );
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(t, a, b) {
        return a + t * (b - a);
    }

    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
}

// Generate 3D Perlin Noise Texture
function generate3DTexture(size = 128) {
    const data = new Uint8Array(size * size * size);
    const perlin = new ImprovedNoise();
    const scale = 0.05;

    let i = 0;
    for (let z = 0; z < size; z++) {
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const nx = x * scale;
                const ny = y * scale;
                const nz = z * scale;

                // Multi-octave Perlin noise
                let value = 0;
                value += perlin.noise(nx, ny, nz) * 0.5;
                value += perlin.noise(nx * 2, ny * 2, nz * 2) * 0.25;
                value += perlin.noise(nx * 4, ny * 4, nz * 4) * 0.125;
                value += perlin.noise(nx * 8, ny * 8, nz * 8) * 0.0625;

                data[i++] = Math.floor((value + 1) * 127.5); // Normalize to 0-255
            }
        }
    }

    const texture = new THREE.Data3DTexture(data, size, size, size);
    texture.format = THREE.RedFormat;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;

    return texture;
}

// Vertex Shader
const vertexShader = `
varying vec3 vOrigin;
varying vec3 vDirection;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vOrigin = vec3(inverse(modelMatrix) * vec4(cameraPosition, 1.0));
    vDirection = position - vOrigin;
    gl_Position = projectionMatrix * mvPosition;
}
`;

// Fragment Shader
const fragmentShader = `
precision highp float;
precision highp sampler3D;

uniform sampler3D map;
uniform float threshold;
uniform float opacity;
uniform float steps;

varying vec3 vOrigin;
varying vec3 vDirection;

vec2 hitBox(vec3 orig, vec3 dir) {
    const vec3 box_min = vec3(-0.5);
    const vec3 box_max = vec3(0.5);
    vec3 inv_dir = 1.0 / dir;
    vec3 tmin_tmp = (box_min - orig) * inv_dir;
    vec3 tmax_tmp = (box_max - orig) * inv_dir;
    vec3 tmin = min(tmin_tmp, tmax_tmp);
    vec3 tmax = max(tmin_tmp, tmax_tmp);
    float t0 = max(tmin.x, max(tmin.y, tmin.z));
    float t1 = min(tmax.x, min(tmax.y, tmax.z));
    return vec2(t0, t1);
}

void main() {
    vec3 rayDir = normalize(vDirection);
    vec2 bounds = hitBox(vOrigin, rayDir);
    
    if (bounds.x > bounds.y) discard;
    
    bounds.x = max(bounds.x, 0.0);
    
    vec3 p = vOrigin + bounds.x * rayDir;
    vec3 inc = 1.0 / abs(rayDir);
    float delta = min(inc.x, min(inc.y, inc.z)) / steps;
    
    vec4 ac = vec4(1.0, 1.0, 1.0, 0.0);
    
    for (float t = bounds.x; t < bounds.y; t += delta) {
        float d = texture(map, p + 0.5).r;
        d = smoothstep(threshold - 0.1, threshold + 0.1, d) * opacity;
        
        float alpha = (1.0 - ac.a) * d;
        ac.rgb = mix(ac.rgb, vec3(1.0), alpha);
        ac.a += alpha;
        
        if (ac.a >= 0.95) break;
        
        p += rayDir * delta;
    }
    
    gl_FragColor = ac;
    if (gl_FragColor.a < 0.01) discard;
}
`;

// Main Volumetric Cloud Renderer Class
class VolumetricCloudRenderer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with id "${containerId}" not found`);
            return;
        }

        // Configuration
        this.config = {
            textureSize: options.textureSize || 128,
            threshold: options.threshold || 0.25,
            opacity: options.opacity || 0.25,
            steps: options.steps || 100.0,
            rotationSpeed: options.rotationSpeed || 0.0005
        };

        // Mobile detection
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (this.isMobile) {
            this.config.textureSize = 64;
            this.config.steps = 50.0;
        }

        this.isAnimating = false;
        this.init();
    }

    init() {
        // Check WebGL support
        if (!this.checkWebGLSupport()) {
            console.warn('WebGL not supported, falling back to CSS clouds');
            return;
        }

        // Scene setup
        this.scene = new THREE.Scene();

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.camera.position.z = 3;

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: !this.isMobile,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2));
        this.container.appendChild(this.renderer.domElement);

        // Generate 3D noise texture
        console.log('Generating 3D noise texture...');
        const texture = generate3DTexture(this.config.textureSize);
        console.log('3D texture generated');

        // Create cloud geometry
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                map: { value: texture },
                threshold: { value: this.config.threshold },
                opacity: { value: this.config.opacity },
                steps: { value: this.config.steps }
            },
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false
        });

        this.cloudMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.cloudMesh);

        // Event listeners
        window.addEventListener('resize', () => this.onResize());

        // Visibility change listener
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAnimation();
            } else if (this.container.style.opacity !== '0') {
                this.startAnimation();
            }
        });

        // Start animation
        this.startAnimation();
    }

    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                     (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    animate() {
        if (!this.isAnimating) return;

        requestAnimationFrame(() => this.animate());

        // Gentle cloud rotation
        this.cloudMesh.rotation.y += this.config.rotationSpeed;
        this.cloudMesh.rotation.x += this.config.rotationSpeed * 0.4;

        this.renderer.render(this.scene, this.camera);
    }

    startAnimation() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animate();
        }
    }

    stopAnimation() {
        this.isAnimating = false;
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setVisibility(visible) {
        this.container.style.opacity = visible ? '1' : '0';
        if (visible) {
            this.startAnimation();
        } else {
            this.stopAnimation();
        }
    }

    destroy() {
        this.stopAnimation();
        if (this.renderer) {
            this.renderer.dispose();
            this.container.removeChild(this.renderer.domElement);
        }
    }
}

export default VolumetricCloudRenderer;
```

**Completion Criteria**:
- [ ] File created at `assets/js/volumetric-clouds.js`
- [ ] All classes defined (ImprovedNoise, VolumetricCloudRenderer)
- [ ] Shaders defined as template literals
- [ ] No syntax errors

---

### Task 1.3: Create Scroll Manager Module

**Objective**: Implement scroll state machine with stagger/delay

**Files to create**:
- `assets/js/scroll-manager.js`

**Code**:
```javascript
class ScrollManager {
    constructor(cloudRenderer) {
        this.cloudRenderer = cloudRenderer;
        this.state = 'CLOUD_MODE'; // CLOUD_MODE, TRANSITIONING, SITE_MODE
        this.scrollAccumulator = 0;
        this.lastScrollTime = Date.now();
        this.scrollDirection = null;
        this.scrollUpStartTime = null;

        // Configuration
        this.config = {
            scrollThreshold: 150,      // px to trigger transition down
            staggerDelay: 300,          // ms before allowing scroll-up transition
            transitionDuration: 600,    // ms for fade transition
        };

        this.init();
    }

    init() {
        // Prevent page bounce
        document.documentElement.style.overscrollBehavior = 'none';
        document.body.classList.add('cloud-mode');

        // Passive false to allow preventDefault
        window.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        window.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        window.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
    }

    onWheel(event) {
        if (this.state === 'TRANSITIONING') {
            event.preventDefault();
            return;
        }

        const currentDirection = event.deltaY > 0 ? 'down' : 'up';

        // Reset accumulator if direction changed
        if (this.scrollDirection !== currentDirection) {
            this.scrollAccumulator = 0;
            this.scrollDirection = currentDirection;
        }

        this.lastScrollTime = Date.now();

        if (this.state === 'CLOUD_MODE') {
            this.handleCloudMode(event);
        } else if (this.state === 'SITE_MODE') {
            this.handleSiteMode(event);
        }
    }

    handleCloudMode(event) {
        if (event.deltaY > 0) { // Scrolling down
            event.preventDefault();

            this.scrollAccumulator += event.deltaY;

            // Visual feedback (optional)
            const progress = Math.min(this.scrollAccumulator / this.config.scrollThreshold, 1);
            this.updateScrollIndicator(progress);

            if (this.scrollAccumulator >= this.config.scrollThreshold) {
                this.transitionToSite();
            }
        } else { // Scrolling up - stay in cloud
            event.preventDefault();
            this.scrollAccumulator = Math.max(0, this.scrollAccumulator + event.deltaY);
            this.updateScrollIndicator(0);
        }
    }

    handleSiteMode(event) {
        const isAtTop = window.scrollY === 0;

        if (event.deltaY < 0 && isAtTop) { // Scrolling up at top
            event.preventDefault();

            // Start stagger timer
            if (!this.scrollUpStartTime) {
                this.scrollUpStartTime = Date.now();
            }

            const timeHeld = Date.now() - this.scrollUpStartTime;
            const progress = Math.min(timeHeld / this.config.staggerDelay, 1);
            this.updateScrollIndicator(progress);

            if (timeHeld >= this.config.staggerDelay) {
                this.transitionToCloud();
                this.scrollUpStartTime = null;
            }
        } else {
            // Normal site scrolling or scrolling down
            this.scrollUpStartTime = null;
            this.updateScrollIndicator(0);
        }
    }

    transitionToSite() {
        this.state = 'TRANSITIONING';
        this.scrollAccumulator = 0;

        // Fade out clouds
        this.cloudRenderer.setVisibility(false);

        // Update body classes
        document.body.classList.remove('cloud-mode');
        document.body.classList.add('transitioning');

        setTimeout(() => {
            document.body.classList.remove('transitioning');
            document.body.classList.add('site-mode');
            document.body.style.overflow = 'auto';
            this.state = 'SITE_MODE';

            // Scroll slightly to enable scroll-up detection
            window.scrollTo({ top: 1, behavior: 'instant' });
        }, this.config.transitionDuration);
    }

    transitionToCloud() {
        this.state = 'TRANSITIONING';

        // Update body classes
        document.body.classList.remove('site-mode');
        document.body.classList.add('transitioning');

        // Scroll to absolute top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        setTimeout(() => {
            // Fade in clouds
            this.cloudRenderer.setVisibility(true);
            document.body.classList.remove('transitioning');
            document.body.classList.add('cloud-mode');
            document.body.style.overflow = 'hidden';
            this.state = 'CLOUD_MODE';
        }, this.config.transitionDuration / 2);
    }

    // Touch support
    onTouchStart(event) {
        this.touchStartY = event.touches[0].clientY;
        this.touchStartTime = Date.now();
    }

    onTouchMove(event) {
        if (this.state === 'TRANSITIONING') {
            event.preventDefault();
            return;
        }

        const touchY = event.touches[0].clientY;
        const deltaY = this.touchStartY - touchY;

        if (this.state === 'CLOUD_MODE') {
            if (deltaY > 0) { // Swiping up (scrolling down)
                event.preventDefault();
                this.scrollAccumulator += deltaY;

                if (this.scrollAccumulator >= this.config.scrollThreshold) {
                    this.transitionToSite();
                }
            } else {
                event.preventDefault();
            }
        } else if (this.state === 'SITE_MODE') {
            const isAtTop = window.scrollY === 0;

            if (deltaY < 0 && isAtTop) { // Swiping down (scrolling up)
                event.preventDefault();

                if (!this.scrollUpStartTime) {
                    this.scrollUpStartTime = Date.now();
                }

                const timeHeld = Date.now() - this.scrollUpStartTime;

                if (timeHeld >= this.config.staggerDelay) {
                    this.transitionToCloud();
                    this.scrollUpStartTime = null;
                }
            } else {
                this.scrollUpStartTime = null;
            }
        }

        this.touchStartY = touchY;
    }

    // Keyboard navigation
    onKeyDown(event) {
        if (this.state === 'CLOUD_MODE' && 
            (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ')) {
            event.preventDefault();
            this.transitionToSite();
        }

        if (this.state === 'SITE_MODE' && window.scrollY === 0 && event.key === 'ArrowUp') {
            this.transitionToCloud();
        }
    }

    // Optional: Visual scroll indicator
    updateScrollIndicator(progress) {
        const indicator = document.getElementById('scroll-indicator');
        if (indicator) {
            indicator.style.width = `${progress * 100}%`;
            indicator.style.opacity = progress > 0 ? '1' : '0';
        }
    }
}

export default ScrollManager;
```

**Completion Criteria**:
- [ ] File created at `assets/js/scroll-manager.js`
- [ ] State machine implemented (CLOUD_MODE, TRANSITIONING, SITE_MODE)
- [ ] Scroll threshold logic working
- [ ] Stagger delay mechanism implemented
- [ ] Touch support included

---

### Task 1.4: Create Main Initialization Script

**Objective**: Wire up all components on page load

**Files to create**:
- `assets/js/main-cloud.js`

**Code**:
```javascript
import VolumetricCloudRenderer from './volumetric-clouds.js';
import ScrollManager from './scroll-manager.js';

// Wait for DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        console.log('Reduced motion preferred, skipping volumetric clouds');
        // Use CSS fallback
        document.body.classList.add('css-clouds-fallback');
        return;
    }

    // Initialize volumetric cloud renderer
    const cloudRenderer = new VolumetricCloudRenderer('volumetric-cloud-canvas', {
        textureSize: 128,
        threshold: 0.25,
        opacity: 0.25,
        steps: 100.0,
        rotationSpeed: 0.0005
    });

    // Initialize scroll manager
    const scrollManager = new ScrollManager(cloudRenderer);

    // Expose to window for debugging (remove in production)
    if (window.location.hostname === 'localhost') {
        window.cloudRenderer = cloudRenderer;
        window.scrollManager = scrollManager;
    }
});
```

**Completion Criteria**:
- [ ] File created at `assets/js/main-cloud.js`
- [ ] Imports both modules
- [ ] Checks for reduced motion
- [ ] Initializes on DOM ready

---

## Phase 2: Hugo Template Integration (Week 2)

### Task 2.1: Update Hugo Home Template

**Objective**: Add cloud canvas container to landing page

**Files to modify**:
- `layouts/home.html`

**Code**:
```html
{{ define "main" }}
<div class="baseet-site-wrapper">
    <!-- Volumetric Cloud Canvas -->
    <div id="volumetric-cloud-canvas" class="cloud-canvas-container" role="img" aria-label="Volumetric cloud background animation">
        <span class="sr-only">Decorative cloud background. Scroll down to view content.</span>
    </div>

    <!-- Optional: Scroll Indicator -->
    <div id="scroll-indicator" class="scroll-progress-indicator"></div>

    <!-- Main Site Content -->
    <main class="site-content">
        {{ partial "blocks/home/features.html" . }}
        {{ partial "blocks/home/team.html" . }}
        {{ partial "blocks/home/clients.html" . }}
        {{ partial "blocks/shared/subscribe.html" . }}
    </main>
</div>

<!-- Load Three.js and cloud scripts -->
{{ $cloudScript := resources.Get "js/main-cloud.js" | js.Build (dict "format" "esm") }}
<script type="module" src="{{ $cloudScript.RelPermalink }}"></script>
{{ end }}
```

**Completion Criteria**:
- [ ] Cloud canvas div added
- [ ] ARIA labels for accessibility
- [ ] Script tag includes bundled JS
- [ ] No Hugo build errors

---

### Task 2.2: Create Cloud Scroll CSS

**Objective**: Style cloud canvas and transitions

**Files to create**:
- `static/css/volumetric-cloud-scroll.css`

**Code**:
```css
/* Cloud Canvas Container */
.cloud-canvas-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 100;
    pointer-events: none;
    opacity: 1;
    transition: opacity 600ms cubic-bezier(0.4, 0, 0.2, 1);
}

.cloud-canvas-container canvas {
    display: block;
    width: 100%;
    height: 100%;
}

/* Screen reader only */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
}

/* Scroll Progress Indicator (optional) */
.scroll-progress-indicator {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    z-index: 101;
    opacity: 0;
    transition: opacity 200ms ease;
}

.scroll-progress-indicator::before {
    content: '';
    display: block;
    height: 100%;
    background: white;
    border-radius: 2px;
    width: 0%;
    transition: width 100ms linear;
}

/* Body States */
body.cloud-mode {
    overflow: hidden;
}

body.cloud-mode .site-content {
    opacity: 0;
    visibility: hidden;
}

body.transitioning .site-content {
    transition: opacity 600ms cubic-bezier(0.4, 0, 0.2, 1);
}

body.site-mode {
    overflow: auto;
    scroll-snap-type: y proximity;
}

body.site-mode .cloud-canvas-container {
    opacity: 0;
    pointer-events: none;
}

body.site-mode .site-content {
    opacity: 1;
    visibility: visible;
}

/* Prevent overscroll bounce */
html {
    overscroll-behavior: none;
}

/* Mobile optimizations */
@media (max-width: 768px) {
    .cloud-canvas-container {
        /* Renderer quality already reduced in JS for mobile */
    }

    .scroll-progress-indicator {
        width: 80px;
        bottom: 10px;
    }
}

/* Reduced motion fallback */
@media (prefers-reduced-motion: reduce) {
    .cloud-canvas-container {
        display: none;
    }

    body.css-clouds-fallback {
        /* Use existing CSS clouds from cloud-scroll.css */
    }
}

/* Dark mode adjustments (if applicable) */
@media (prefers-color-scheme: dark) {
    .scroll-progress-indicator {
        background: rgba(255, 255, 255, 0.2);
    }
}
```

**Completion Criteria**:
- [ ] File created
- [ ] All states styled (cloud-mode, transitioning, site-mode)
- [ ] Mobile responsive
- [ ] Accessibility considerations

---

### Task 2.3: Link CSS in Hugo

**Objective**: Include new CSS in Hugo build

**Files to modify**:
- `layouts/partials/head.html` OR `layouts/_default/baseof.html`

**Code**:
```html
<!-- In head section -->
<link rel="stylesheet" href="{{ "css/volumetric-cloud-scroll.css" | relURL }}">
```

**Completion Criteria**:
- [ ] CSS file linked
- [ ] No 404 errors
- [ ] Styles applied on page load

---

## Phase 3: Performance & Accessibility (Week 3)

### Task 3.1: Add WebGL Fallback

**Objective**: Gracefully handle browsers without WebGL support

**Files to modify**:
- `assets/js/volumetric-clouds.js`

**Code** (add to VolumetricCloudRenderer class):
```javascript
init() {
    // Check WebGL support
    if (!this.checkWebGLSupport()) {
        console.warn('WebGL not supported, using CSS fallback');
        this.container.style.display = 'none';
        document.body.classList.add('css-clouds-fallback');
        return;
    }
    
    // ... rest of init code
}

checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
                 (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
}
```

**Completion Criteria**:
- [ ] WebGL detection added
- [ ] CSS fallback class applied when needed
- [ ] No errors in browsers without WebGL

---

### Task 3.2: Implement Performance Monitoring

**Objective**: Track FPS and memory usage (dev mode only)

**Files to create**:
- `assets/js/performance-monitor.js`

**Code**:
```javascript
class PerformanceMonitor {
    constructor() {
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.panel = null;

        if (window.location.hostname === 'localhost') {
            this.createPanel();
            this.start();
        }
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            border-radius: 4px;
        `;
        document.body.appendChild(this.panel);
    }

    start() {
        this.measure();
    }

    measure() {
        this.frameCount++;
        const currentTime = performance.now();
        const delta = currentTime - this.lastTime;

        if (delta >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / delta);
            this.frameCount = 0;
            this.lastTime = currentTime;

            if (this.panel) {
                const memory = performance.memory 
                    ? `${Math.round(performance.memory.usedJSHeapSize / 1048576)}MB`
                    : 'N/A';

                this.panel.innerHTML = `
                    FPS: ${this.fps}<br>
                    Memory: ${memory}
                `;
            }
        }

        requestAnimationFrame(() => this.measure());
    }
}

export default PerformanceMonitor;
```

**Import in main-cloud.js**:
```javascript
import PerformanceMonitor from './performance-monitor.js';

// After initializing cloud renderer
if (window.location.hostname === 'localhost') {
    const perfMonitor = new PerformanceMonitor();
}
```

**Completion Criteria**:
- [ ] Performance monitor created
- [ ] Only shows on localhost
- [ ] Displays FPS and memory

---

### Task 3.3: Add Keyboard Navigation

**Objective**: Ensure full keyboard accessibility

**Already implemented in scroll-manager.js** - verify:

**Test Cases**:
- [ ] Arrow Down transitions to site from clouds
- [ ] Page Down transitions to site from clouds
- [ ] Spacebar transitions to site from clouds
- [ ] Arrow Up at top of site returns to clouds
- [ ] Tab navigation works correctly

---

### Task 3.4: Test Reduced Motion Preference

**Objective**: Respect user's motion preferences

**Already implemented in main-cloud.js** - verify:

**Test Commands**:
```bash
# On macOS:
# System Preferences > Accessibility > Display > Reduce motion

# Test in browser DevTools:
# Rendering tab > Emulate CSS media feature prefers-reduced-motion
```

**Completion Criteria**:
- [ ] Reduced motion detected correctly
- [ ] CSS fallback used when preference is set
- [ ] No Three.js initialization when reduced motion enabled

---

## Phase 4: Testing & Deployment (Week 4)

### Task 4.1: Cross-Browser Testing

**Objective**: Verify functionality across browsers

**Test Matrix**:

| Browser | Version | Desktop | Mobile | Status |
|---------|---------|---------|--------|--------|
| Chrome | 120+ | ✓ | ✓ | [ ] |
| Firefox | 120+ | ✓ | ✓ | [ ] |
| Safari | 16+ | ✓ | ✓ | [ ] |
| Edge | 120+ | ✓ | N/A | [ ] |

**Test Cases per Browser**:
- [ ] Volumetric clouds render correctly
- [ ] Scroll down transition works
- [ ] Scroll up with stagger delay works
- [ ] Touch gestures work (mobile)
- [ ] Performance acceptable (>45fps mobile, >60fps desktop)
- [ ] No console errors

---

### Task 4.2: Mobile Performance Optimization

**Objective**: Ensure smooth experience on mobile devices

**Files to modify**:
- `assets/js/volumetric-clouds.js`

**Verify adaptive settings**:
```javascript
// Already implemented - verify these settings
this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
if (this.isMobile) {
    this.config.textureSize = 64;    // Reduced from 128
    this.config.steps = 50.0;         // Reduced from 100
}
```

**Additional mobile optimizations**:
```javascript
// Add to init() method
if (this.isMobile) {
    // Disable anti-aliasing on mobile
    this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: 'high-performance'
    });
    
    // Lower pixel ratio
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
}
```

**Test on Real Devices**:
- [ ] iPhone 12+ (iOS 15+)
- [ ] Samsung Galaxy S21+ (Android 11+)
- [ ] iPad Pro (iOS 15+)

**Completion Criteria**:
- [ ] Mobile FPS >45 consistently
- [ ] No thermal throttling issues
- [ ] Battery drain acceptable
- [ ] Touch gestures responsive

---

### Task 4.3: Build Hugo Production Bundle

**Objective**: Create optimized production build

**Commands**:
```bash
# Clean previous build
rm -rf public resources

# Build for production
hugo --minify --environment production

# Verify output
ls -lh public/js/
ls -lh public/css/
```

**Verify in hugo.yaml**:
```yaml
build:
  writeStats: true
  
minify:
  minifyOutput: true
  
environments:
  production:
    params:
      env: production
```

**Completion Criteria**:
- [ ] JavaScript bundle created and minified
- [ ] CSS minified
- [ ] No build errors
- [ ] Bundle size <200KB (gzipped)

---

### Task 4.4: Lighthouse Audit

**Objective**: Ensure site meets performance standards

**Commands**:
```bash
# Using Chrome DevTools
# 1. Open site in Chrome
# 2. DevTools > Lighthouse tab
# 3. Generate report (Mobile & Desktop)
```

**Target Scores**:
- Performance: >90
- Accessibility: 100
- Best Practices: >90
- SEO: >90

**Key Metrics**:
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Total Blocking Time: <200ms
- Cumulative Layout Shift: <0.1

**Completion Criteria**:
- [ ] Lighthouse scores meet targets
- [ ] No accessibility violations
- [ ] Performance acceptable on 3G throttling
- [ ] All critical metrics in green

---

### Task 4.5: Deploy to Production

**Objective**: Deploy to hosting environment

**Pre-deployment Checklist**:
- [ ] All tests passing
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Lighthouse scores good
- [ ] Mobile tested
- [ ] Accessibility verified

**Deployment Steps** (adjust for your hosting):
```bash
# Example: Netlify deployment
netlify deploy --prod --dir=public

# Example: GitHub Pages
git add .
git commit -m "Add volumetric clouds with scroll behavior"
git push origin main
```

**Post-deployment Verification**:
- [ ] Site loads correctly
- [ ] Clouds render on production
- [ ] Scroll behavior works
- [ ] No CORS errors
- [ ] HTTPS working
- [ ] Mobile experience smooth

---

## Troubleshooting Guide

### Issue 1: Three.js Bundle Error

**Symptom**: `Cannot find module 'three'`

**Solution**:
```bash
npm install three --save
hugo mod npm pack
```

---

### Issue 2: Clouds Not Rendering

**Symptom**: Black canvas or no clouds visible

**Debug Steps**:
1. Check browser console for WebGL errors
2. Verify 3D texture generation:
```javascript
console.log('Texture size:', texture.image.width);
console.log('Texture data length:', texture.image.data.length);
```
3. Verify shader compilation:
```javascript
console.log('Material:', material);
console.log('Uniforms:', material.uniforms);
```

---

### Issue 3: Poor Performance on Mobile

**Symptom**: Low FPS, stuttering

**Solutions**:
1. Reduce texture size further:
```javascript
this.config.textureSize = 32; // Instead of 64
```
2. Reduce raymarching steps:
```javascript
this.config.steps = 30.0; // Instead of 50
```
3. Lower pixel ratio:
```javascript
this.renderer.setPixelRatio(1);
```

---

### Issue 4: Scroll Behavior Not Working

**Symptom**: Can't scroll down or up transitions don't work

**Debug Steps**:
1. Check state machine:
```javascript
console.log('Current state:', scrollManager.state);
```
2. Verify event listeners attached:
```javascript
window.addEventListener('wheel', (e) => {
    console.log('Wheel event:', e.deltaY, scrollManager.state);
});
```
3. Check for conflicting scroll handlers

---

## Final Checklist

### Code Quality
- [ ] No console.log statements in production
- [ ] All variables properly scoped
- [ ] No unused imports
- [ ] Comments added where needed
- [ ] Code follows project style guide

### Functionality
- [ ] Volumetric clouds render correctly
- [ ] Scroll down transitions to site
- [ ] Scroll up with stagger works
- [ ] Keyboard navigation functional
- [ ] Touch gestures work on mobile

### Performance
- [ ] Desktop FPS >60
- [ ] Mobile FPS >45
- [ ] Bundle size <200KB gzipped
- [ ] No memory leaks
- [ ] Lighthouse scores good

### Accessibility
- [ ] Reduced motion respected
- [ ] Keyboard navigation works
- [ ] ARIA labels present
- [ ] Screen reader compatible
- [ ] No accessibility violations

### Browser Support
- [ ] Chrome 120+ ✓
- [ ] Firefox 120+ ✓
- [ ] Safari 16+ ✓
- [ ] Edge 120+ ✓
- [ ] iOS Safari 15+ ✓
- [ ] Chrome Mobile ✓

### Documentation
- [ ] Design doc reviewed
- [ ] Tasks doc followed
- [ ] Code commented
- [ ] README updated
- [ ] CHANGELOG updated

---

## Success Criteria Summary

✅ **Phase 1 Complete**: Three.js rendering volumetric clouds  
✅ **Phase 2 Complete**: Hugo templates integrated  
✅ **Phase 3 Complete**: Performance optimized, accessible  
✅ **Phase 4 Complete**: Tested, deployed, verified  

**Estimated Total Time**: 4 weeks (160 hours)  
**Critical Path**: Phase 1 → Phase 2 → Phase 3 → Phase 4  

---

**Document Version**: 1.0  
**Last Updated**: November 2025  
**Next Review**: After Phase 1 completion
