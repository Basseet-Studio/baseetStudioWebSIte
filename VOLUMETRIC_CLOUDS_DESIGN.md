# Volumetric Clouds Design Document

## Executive Summary

This document outlines the technical architecture and implementation approach for integrating volumetric clouds using Three.js raymarching techniques into the Baseet Studio website's landing page, along with sophisticated scroll behavior that prevents accidental site exit.

## Project Context

- **Tech Stack**: Hugo v0.147.8+, TailwindCSS v4.1.17, Vanilla ES6+ JavaScript
- **No Server-Side**: Static site generation only
- **Current Implementation**: Pure CSS cloud animations with JavaScript parallax
- **Target**: WebGL-based volumetric clouds using raymarching shaders

## 1. Architecture Overview

### 1.1 Three.js Integration Strategy

```
┌─────────────────────────────────────────────────┐
│         Hugo Static Site Generator              │
│  ┌───────────────────────────────────────────┐  │
│  │   layouts/home.html                       │  │
│  │   ├── <div id="volumetric-cloud-canvas">  │  │
│  │   └── Main content sections               │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │   assets/js/volumetric-clouds.js          │  │
│  │   ├── Three.js Scene Setup                │  │
│  │   ├── Raymarching Shader System           │  │
│  │   ├── 3D Perlin Noise Generation          │  │
│  │   └── Animation Loop                      │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │   assets/js/scroll-manager.js             │  │
│  │   ├── Scroll Event Handler                │  │
│  │   ├── State Machine (cloud/site modes)    │  │
│  │   ├── Stagger/Delay Logic                 │  │
│  │   └── Transition Orchestrator             │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 1.2 Component Breakdown

**Three.js Module** (`volumetric-clouds.js`):
- Initializes WebGL renderer
- Sets up camera and scene
- Implements raymarching shaders (vertex + fragment)
- Generates 3D Perlin noise textures
- Manages animation loop
- Handles window resize

**Scroll Manager** (`scroll-manager.js`):
- Tracks scroll position and direction
- Implements state machine for cloud/site modes
- Controls stagger/delay mechanism
- Coordinates with Three.js scene
- Manages CSS transitions

**CSS Layer** (`cloud-scroll.css`):
- Positions canvas element
- Controls visibility transitions
- Defines z-index layering
- Mobile responsive adjustments

## 2. Volumetric Cloud Implementation

### 2.1 WebGL Raymarching Architecture

Based on Three.js `webgpu_volume_cloud.html` example:

**Core Components**:
1. **3D Perlin Noise Texture** (128³ resolution)
   - Generated using ImprovedNoise algorithm
   - Pre-computed on initialization
   - Uploaded to GPU as 3D texture

2. **Vertex Shader**:
   - Calculates ray origin (camera position)
   - Computes ray direction for each fragment
   - Passes to fragment shader via varyings

3. **Fragment Shader**:
   - Implements raymarching loop (64-128 steps)
   - Samples 3D noise texture along ray
   - Applies threshold and opacity
   - Uses smoothstep for soft clouds
   - Outputs RGBA with alpha blending

### 2.2 Shader Implementation Details

**Vertex Shader (GLSL)**:
```glsl
varying vec3 vOrigin;
varying vec3 vDirection;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vOrigin = vec3(inverse(modelMatrix) * vec4(cameraPosition, 1.0));
    vDirection = position - vOrigin;
    gl_Position = projectionMatrix * mvPosition;
}
```

**Fragment Shader (GLSL)**:
```glsl
precision highp float;
precision highp sampler3D;

uniform sampler3D map;
uniform float threshold;
uniform float opacity;
uniform float steps;

varying vec3 vOrigin;
varying vec3 vDirection;

vec2 hitBox(vec3 orig, vec3 dir) {
    // Raymarching box intersection
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
    
    vec4 ac = vec4(0.0);
    
    for (float t = bounds.x; t < bounds.y; t += delta) {
        float d = texture(map, p + 0.5).r;
        d = smoothstep(threshold - 0.1, threshold + 0.1, d) * opacity;
        ac.rgb += (1.0 - ac.a) * d;
        ac.a += (1.0 - ac.a) * d;
        if (ac.a >= 0.95) break;
        p += rayDir * delta;
    }
    
    gl_FragColor = ac;
    if (gl_FragColor.a < 0.01) discard;
}
```

### 2.3 3D Perlin Noise Generation

```javascript
// Based on Three.js ImprovedNoise class
class PerlinNoise3D {
    constructor() {
        this.p = new Uint8Array(512);
        for (let i = 0; i < 256; i++) {
            this.p[i] = this.p[i + 256] = Math.floor(Math.random() * 256);
        }
    }
    
    noise(x, y, z) {
        // Standard Perlin noise implementation
        // Returns value between -1 and 1
    }
}

function generate3DTexture(size = 128) {
    const data = new Uint8Array(size * size * size);
    const noise = new PerlinNoise3D();
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
                value += noise.noise(nx, ny, nz) * 0.5;
                value += noise.noise(nx * 2, ny * 2, nz * 2) * 0.25;
                value += noise.noise(nx * 4, ny * 4, nz * 4) * 0.125;
                
                data[i++] = Math.floor((value + 1) * 128); // Normalize to 0-255
            }
        }
    }
    
    return new THREE.Data3DTexture(data, size, size, size);
}
```

### 2.4 Three.js Scene Setup

```javascript
class VolumetricCloudRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.renderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: true 
        });
        
        this.init();
    }
    
    init() {
        // Renderer setup
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);
        
        // Camera positioning
        this.camera.position.z = 3;
        
        // Generate 3D noise texture
        const texture = generate3DTexture(128);
        texture.format = THREE.RedFormat;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.unpackAlignment = 1;
        texture.needsUpdate = true;
        
        // Create cloud geometry
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.ShaderMaterial({
            vertexShader: vertexShaderSource,
            fragmentShader: fragmentShaderSource,
            uniforms: {
                map: { value: texture },
                threshold: { value: 0.25 },
                opacity: { value: 0.25 },
                steps: { value: 100.0 }
            },
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false
        });
        
        this.cloudMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.cloudMesh);
        
        // Event listeners
        window.addEventListener('resize', () => this.onResize());
        
        // Start animation
        this.animate();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Gentle cloud rotation
        this.cloudMesh.rotation.y += 0.0005;
        this.cloudMesh.rotation.x += 0.0002;
        
        this.renderer.render(this.scene, this.camera);
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    setVisibility(visible) {
        this.container.style.opacity = visible ? '1' : '0';
    }
}
```

## 3. Scroll Behavior System

### 3.1 State Machine Architecture

```
┌──────────────┐
│  CLOUD_MODE  │ ◄──────────────┐
│  (Initial)   │                │
└──────┬───────┘                │
       │                        │
       │ Scroll Down (threshold) │
       │                        │
       ▼                        │
┌──────────────┐                │
│ TRANSITIONING│                │
│   (Delay)    │                │
└──────┬───────┘                │
       │                        │
       │ After 300ms            │
       │                        │
       ▼                        │
┌──────────────┐                │
│  SITE_MODE   │                │
│ (Main Site)  │                │
└──────┬───────┘                │
       │                        │
       │ Scroll Up (with stagger)│
       │                        │
       └────────────────────────┘
```

### 3.2 Scroll Manager Implementation

```javascript
class ScrollManager {
    constructor(cloudRenderer) {
        this.cloudRenderer = cloudRenderer;
        this.state = 'CLOUD_MODE';
        this.scrollAccumulator = 0;
        this.lastScrollTime = Date.now();
        this.scrollDirection = null;
        
        // Configuration
        this.config = {
            scrollThreshold: 150,      // px to trigger transition
            staggerDelay: 300,          // ms before allowing scroll-up
            transitionDuration: 600,    // ms for fade transition
            debounceTime: 100           // ms between scroll events
        };
        
        this.init();
    }
    
    init() {
        // Use overscroll-behavior to prevent page bounce
        document.documentElement.style.overscrollBehavior = 'none';
        
        // Passive event listener for performance
        window.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        window.addEventListener('touchmove', (e) => this.onTouch(e), { passive: false });
    }
    
    onWheel(event) {
        if (this.state === 'TRANSITIONING') {
            event.preventDefault();
            return;
        }
        
        const now = Date.now();
        const deltaTime = now - this.lastScrollTime;
        
        // Detect scroll direction
        const currentDirection = event.deltaY > 0 ? 'down' : 'up';
        
        // Reset accumulator if direction changed
        if (this.scrollDirection !== currentDirection) {
            this.scrollAccumulator = 0;
            this.scrollDirection = currentDirection;
        }
        
        this.lastScrollTime = now;
        
        // Handle based on current state
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
            
            if (this.scrollAccumulator >= this.config.scrollThreshold) {
                this.transitionToSite();
            }
        } else { // Scrolling up - stay in cloud
            event.preventDefault();
            this.scrollAccumulator = Math.max(0, this.scrollAccumulator + event.deltaY);
        }
    }
    
    handleSiteMode(event) {
        const isAtTop = window.scrollY === 0;
        
        if (event.deltaY < 0 && isAtTop) { // Scrolling up at top
            event.preventDefault();
            
            // Implement stagger delay
            if (!this.scrollUpStartTime) {
                this.scrollUpStartTime = Date.now();
            }
            
            const timeHeld = Date.now() - this.scrollUpStartTime;
            
            if (timeHeld >= this.config.staggerDelay) {
                this.transitionToCloud();
                this.scrollUpStartTime = null;
            }
        } else {
            // Normal site scrolling
            this.scrollUpStartTime = null;
        }
    }
    
    transitionToSite() {
        this.state = 'TRANSITIONING';
        this.scrollAccumulator = 0;
        
        // Fade out clouds
        this.cloudRenderer.setVisibility(false);
        
        // Enable site scroll
        document.body.style.overflow = 'auto';
        document.documentElement.style.scrollSnapType = 'y proximity';
        
        setTimeout(() => {
            this.state = 'SITE_MODE';
            window.scrollTo({ top: 1, behavior: 'smooth' });
        }, this.config.transitionDuration);
    }
    
    transitionToCloud() {
        this.state = 'TRANSITIONING';
        
        // Scroll to absolute top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Fade in clouds
        setTimeout(() => {
            this.cloudRenderer.setVisibility(true);
            document.body.style.overflow = 'hidden';
            document.documentElement.style.scrollSnapType = 'none';
            this.state = 'CLOUD_MODE';
        }, this.config.transitionDuration / 2);
    }
    
    onTouch(event) {
        // Mobile touch handling (similar logic to wheel)
        // Implementation details...
    }
}
```

### 3.3 Stagger/Delay Mechanism

The stagger delay prevents accidental site exit by requiring:

1. **Position Check**: User must be at `scrollY === 0`
2. **Direction Check**: Must be scrolling upward (`deltaY < 0`)
3. **Time Threshold**: Must maintain upward scroll for 300ms continuously
4. **Reset Behavior**: If user stops or changes direction, timer resets

**User Experience**:
- Quick scroll-up at top: Nothing happens (prevents accidents)
- Deliberate scroll-up hold: Returns to clouds after 300ms
- Visual feedback: Optional progress indicator

## 4. Hugo Integration

### 4.1 Template Structure

**layouts/home.html**:
```html
{{ define "main" }}
<div class="baseet-site-wrapper">
    <!-- Volumetric Cloud Canvas -->
    <div id="volumetric-cloud-canvas" class="cloud-canvas-container"></div>
    
    <!-- Main Site Content (initially hidden) -->
    <main class="site-content">
        {{ partial "blocks/home/features.html" . }}
        {{ partial "blocks/home/team.html" . }}
        {{ partial "blocks/home/clients.html" . }}
        {{ partial "blocks/shared/subscribe.html" . }}
    </main>
</div>
{{ end }}
```

### 4.2 Asset Pipeline

**hugo.yaml** additions:
```yaml
params:
  cloudRenderer:
    enabled: true
    textureSize: 128
    raymarchSteps: 100
    cloudThreshold: 0.25
    cloudOpacity: 0.25
```

**jsconfig.json** (Hugo asset bundling):
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "*": [
        "assets/js/*"
      ]
    }
  }
}
```

### 4.3 CSS Integration

**static/css/cloud-scroll.css**:
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

/* Initial State - Hide Site Content */
body.cloud-mode {
    overflow: hidden;
}

body.cloud-mode .site-content {
    opacity: 0;
    visibility: hidden;
}

/* Site Mode */
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
    transition: opacity 600ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Mobile Optimizations */
@media (max-width: 768px) {
    .cloud-canvas-container {
        /* Reduce quality on mobile for performance */
    }
}

/* Prevent overscroll bounce */
html {
    overscroll-behavior: none;
}
```

## 5. Performance Optimization

### 5.1 Mobile Considerations

**Adaptive Quality**:
```javascript
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const textureSize = isMobile ? 64 : 128;
const raymarchSteps = isMobile ? 50 : 100;
const pixelRatio = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);
```

### 5.2 Loading Strategy

1. **Progressive Enhancement**:
   - Show CSS clouds initially
   - Load Three.js asynchronously
   - Replace with volumetric clouds when ready

2. **Code Splitting**:
   - Three.js loaded only on landing page
   - Lazy load if user has reduced motion preference

3. **Texture Caching**:
   - Generate 3D noise once
   - Store in IndexedDB for repeat visits

### 5.3 Animation Optimization

```javascript
// Use requestAnimationFrame efficiently
let isAnimating = false;

function startAnimation() {
    if (!isAnimating) {
        isAnimating = true;
        animate();
    }
}

function stopAnimation() {
    isAnimating = false;
}

// Pause when not visible
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopAnimation();
    } else if (state === 'CLOUD_MODE') {
        startAnimation();
    }
});
```

## 6. Accessibility

### 6.1 Reduced Motion

```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
    // Use static cloud image or simple CSS animation
    // Skip Three.js entirely
}
```

### 6.2 Keyboard Navigation

```javascript
document.addEventListener('keydown', (e) => {
    if (state === 'CLOUD_MODE' && (e.key === 'ArrowDown' || e.key === 'PageDown')) {
        transitionToSite();
    }
    if (state === 'SITE_MODE' && window.scrollY === 0 && e.key === 'ArrowUp') {
        transitionToCloud();
    }
});
```

### 6.3 Screen Reader Support

```html
<div id="volumetric-cloud-canvas" 
     role="img" 
     aria-label="Volumetric cloud background animation">
    <span class="sr-only">Decorative cloud background. Scroll down to view content.</span>
</div>
```

## 7. Deployment Considerations

### 7.1 Hugo Build Process

1. Three.js bundled via Hugo Pipes
2. Shaders inlined as template literals
3. Assets fingerprinted for cache busting
4. Minification in production

### 7.2 CDN Strategy

```html
<!-- Fallback to CDN if local build fails -->
<script src="{{ resources.Get "js/volumetric-clouds.js" | minify | fingerprint }}"></script>
<script>
    if (typeof VolumetricCloudRenderer === 'undefined') {
        // Fallback to CSS clouds
        console.warn('Three.js failed to load, using CSS fallback');
    }
</script>
```

### 7.3 Browser Compatibility

**WebGL Support**:
- Chrome 56+
- Firefox 51+
- Safari 10+
- Edge 79+

**Fallback Strategy**:
```javascript
if (!WebGLRenderingContext) {
    // Use CSS clouds
    document.getElementById('volumetric-cloud-canvas').style.display = 'none';
    document.getElementById('css-cloud-fallback').style.display = 'block';
}
```

## 8. Testing Strategy

### 8.1 Manual Testing Checklist

- [ ] Scroll down from clouds to site works smoothly
- [ ] Scroll up from site to clouds requires deliberate action (300ms delay)
- [ ] Quick scroll-up at top does NOT return to clouds (prevents accidents)
- [ ] Mobile touch gestures work correctly
- [ ] Keyboard navigation functions
- [ ] Reduced motion preference respected
- [ ] WebGL fallback to CSS clouds works
- [ ] Performance acceptable on mobile (60fps target)

### 8.2 Performance Metrics

**Targets**:
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- FPS during animation: > 50fps (mobile), > 60fps (desktop)
- Memory usage: < 150MB

## 9. Risk Mitigation

### 9.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| WebGL not supported | High | CSS cloud fallback |
| Poor mobile performance | High | Adaptive quality settings |
| Large bundle size | Medium | Code splitting, async loading |
| Browser compatibility | Medium | Polyfills, feature detection |

### 9.2 UX Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Accidental cloud return | High | 300ms stagger delay |
| Confusing navigation | Medium | Visual scroll indicator |
| Motion sickness | Low | Reduced motion support |
| Accessibility issues | Medium | Keyboard nav, ARIA labels |

## 10. Future Enhancements

### 10.1 Phase 2 Features

- **Interactive Clouds**: Mouse movement affects cloud density/position
- **Weather Transitions**: Day/night cycle, storm effects
- **Performance Panel**: Real-time FPS/memory monitoring (dev mode)
- **Cloud Presets**: Multiple cloud configurations (cumulus, stratus, etc.)

### 10.2 Advanced Techniques

- **WebGPU Migration**: When browser support improves
- **Compute Shaders**: For dynamic cloud generation
- **Advanced Noise**: Curl noise, Worley noise for realism
- **Lighting Integration**: Dynamic sky lighting based on time

## 11. Implementation Timeline

**Phase 1** (Week 1):
- Set up Three.js integration in Hugo
- Implement basic raymarching shader
- Generate 3D Perlin noise

**Phase 2** (Week 2):
- Develop scroll manager state machine
- Implement stagger/delay mechanism
- CSS transitions and styling

**Phase 3** (Week 3):
- Mobile optimization
- Accessibility features
- Performance tuning

**Phase 4** (Week 4):
- Testing across devices
- Bug fixes
- Documentation
- Deployment

## 12. Success Criteria

1. ✅ Volumetric clouds render at 60fps on desktop
2. ✅ Mobile performance maintains >45fps
3. ✅ Scroll-up delay prevents 95%+ accidental returns
4. ✅ Zero accessibility violations (axe-core)
5. ✅ <100KB JavaScript bundle (gzipped)
6. ✅ Works on 95%+ of target browsers

---

**Document Version**: 1.0  
**Last Updated**: November 2025  
**Author**: Technical Architecture Team  
**Status**: Ready for Implementation
