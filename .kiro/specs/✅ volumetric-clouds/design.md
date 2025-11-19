# Volumetric Clouds Design Document

## Overview

This design document details the technical architecture for implementing realistic volumetric clouds using Three.js raymarching techniques on the Baseet Studio Hugo website. The system consists of two primary components: a WebGL-based Cloud Renderer for volumetric cloud visualization and a Scroll Manager for sophisticated scroll behavior with state management.

### Design Goals

1. **Immersive Experience**: Create a memorable first impression with realistic 3D volumetric clouds
2. **Smooth Transitions**: Seamless transitions between cloud and site modes without visual glitches
3. **Performance**: Maintain 60fps on desktop and 45fps on mobile devices
4. **Accessibility**: Full keyboard navigation and reduced motion support
5. **Progressive Enhancement**: Graceful fallback for browsers without WebGL support
6. **Static Site Compatibility**: Work within Hugo's static generation constraints

### Technology Stack

- **Hugo**: v0.147.8+ (Static Site Generator)
- **Three.js**: v0.160.0 (WebGL Framework)
- **TailwindCSS**: v4.1.17 (Styling)
- **Vanilla JavaScript**: ES6+ modules
- **WebGL**: For GPU-accelerated rendering

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Hugo Static Site                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  layouts/home.html                                     │ │
│  │  ├── <div id="volumetric-cloud-canvas">               │ │
│  │  ├── <div id="scroll-indicator">                      │ │
│  │  └── <main class="site-content">                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  assets/js/volumetric-clouds.js                        │ │
│  │  ├── ImprovedNoise (3D Perlin)                        │ │
│  │  ├── generate3DTexture()                              │ │
│  │  ├── VolumetricCloudRenderer                          │ │
│  │  │   ├── Three.js Scene                               │ │
│  │  │   ├── Camera & Renderer                            │ │
│  │  │   ├── Raymarching Shaders                          │ │
│  │  │   └── Animation Loop                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  assets/js/scroll-manager.js                           │ │
│  │  ├── State Machine (CLOUD/TRANSITIONING/SITE)         │ │
│  │  ├── Scroll Event Handlers                            │ │
│  │  ├── Touch Event Handlers                             │ │
│  │  ├── Keyboard Event Handlers                          │ │
│  │  └── Transition Orchestrator                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  assets/js/main-cloud.js                               │ │
│  │  ├── Initialization Logic                             │ │
│  │  ├── Reduced Motion Check                             │ │
│  │  └── Component Wiring                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  static/css/volumetric-cloud-scroll.css                │ │
│  │  ├── Canvas Positioning                               │ │
│  │  ├── State Classes (cloud-mode, site-mode)            │ │
│  │  ├── Transition Animations                            │ │
│  │  └── Responsive Styles                                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Action → Scroll Manager → State Change → Cloud Renderer
                    ↓                              ↓
              CSS Classes ←──────────────── Visibility Control
                    ↓
              DOM Updates
```

## Components and Interfaces

### Component 1: VolumetricCloudRenderer

**Purpose**: Manages Three.js scene, WebGL rendering, and volumetric cloud visualization using raymarching shaders.

**Public Interface**:

```javascript
class VolumetricCloudRenderer {
    constructor(containerId: string, options?: CloudOptions)
    
    // Methods
    startAnimation(): void
    stopAnimation(): void
    setVisibility(visible: boolean): void
    onResize(): void
    destroy(): void
    
    // Properties
    isAnimating: boolean
    config: CloudConfig
    isMobile: boolean
}

interface CloudOptions {
    textureSize?: number      // Default: 128 (desktop), 64 (mobile)
    threshold?: number         // Default: 0.25
    opacity?: number          // Default: 0.25
    steps?: number            // Default: 100.0 (desktop), 50.0 (mobile)
    rotationSpeed?: number    // Default: 0.0005
}

interface CloudConfig {
    textureSize: number
    threshold: number
    opacity: number
    steps: number
    rotationSpeed: number
}
```

**Internal Components**:

1. **ImprovedNoise Class**
   - Implements Perlin noise algorithm
   - Generates smooth, continuous 3D noise patterns
   - Methods: `noise(x, y, z)`, `fade(t)`, `lerp(t, a, b)`, `grad(hash, x, y, z)`

2. **3D Texture Generator**
   - Creates 128³ or 64³ voxel texture
   - Multi-octave Perlin noise (4 octaves)
   - Outputs Uint8Array for GPU upload

3. **Shader System**
   - Vertex Shader: Calculates ray origin and direction
   - Fragment Shader: Implements raymarching algorithm
   - Uniforms: `map` (3D texture), `threshold`, `opacity`, `steps`

4. **Three.js Scene**
   - Scene, Camera, Renderer
   - Box geometry (1x1x1) with BackSide rendering
   - Transparent material with alpha blending

**Key Algorithms**:

**Raymarching Algorithm** (Fragment Shader):
```
1. Calculate ray direction from camera through pixel
2. Find intersection with bounding box
3. March along ray in small steps (delta)
4. At each step:
   a. Sample 3D noise texture
   b. Apply threshold with smoothstep
   c. Accumulate color and opacity
   d. Early exit if opacity >= 0.95
5. Output final RGBA color
```

**Performance Optimizations**:
- Mobile detection reduces texture size and steps
- Pixel ratio capped at 1.5 (mobile) or 2.0 (desktop)
- Animation pauses when tab hidden
- Power preference set to "high-performance"
- Antialias disabled on mobile

### Component 2: ScrollManager

**Purpose**: Controls scroll behavior, manages state transitions, and orchestrates the user experience between cloud and site modes.

**Public Interface**:

```javascript
class ScrollManager {
    constructor(cloudRenderer: VolumetricCloudRenderer)
    
    // Methods
    transitionToSite(): void
    transitionToCloud(): void
    updateScrollIndicator(progress: number): void
    
    // Properties
    state: ScrollState
    config: ScrollConfig
}

type ScrollState = 'CLOUD_MODE' | 'TRANSITIONING' | 'SITE_MODE'

interface ScrollConfig {
    scrollThreshold: number      // Default: 150px
    staggerDelay: number          // Default: 300ms
    transitionDuration: number    // Default: 600ms
}
```

**State Machine**:

```
┌──────────────┐
│  CLOUD_MODE  │ ◄──────────────┐
│  (Initial)   │                │
└──────┬───────┘                │
       │                        │
       │ Scroll Down            │
       │ (150px threshold)      │
       │                        │
       ▼                        │
┌──────────────┐                │
│ TRANSITIONING│                │
│   (600ms)    │                │
└──────┬───────┘                │
       │                        │
       │ Transition Complete    │
       │                        │
       ▼                        │
┌──────────────┐                │
│  SITE_MODE   │                │
│ (Main Site)  │                │
└──────┬───────┘                │
       │                        │
       │ Scroll Up at Top       │
       │ (300ms stagger)        │
       │                        │
       └────────────────────────┘
```

**Event Handlers**:

1. **Wheel Events** (`onWheel`)
   - Detects scroll direction (deltaY)
   - Accumulates scroll distance
   - Triggers state transitions
   - Prevents default during transitions

2. **Touch Events** (`onTouchStart`, `onTouchMove`)
   - Records initial touch position
   - Calculates touch delta
   - Applies same logic as wheel events
   - Supports mobile gestures

3. **Keyboard Events** (`onKeyDown`)
   - Arrow Down / Page Down / Space: Transition to site
   - Arrow Up (at top): Transition to clouds
   - Prevents default for handled keys

**Stagger Delay Mechanism**:

```javascript
// Prevents accidental cloud return
if (event.deltaY < 0 && window.scrollY === 0) {
    if (!scrollUpStartTime) {
        scrollUpStartTime = Date.now()
    }
    
    const timeHeld = Date.now() - scrollUpStartTime
    
    if (timeHeld >= 300) {
        transitionToCloud()
    }
} else {
    scrollUpStartTime = null  // Reset if conditions not met
}
```

**Transition Logic**:

**To Site Mode**:
1. Set state to TRANSITIONING
2. Fade out clouds (opacity: 1 → 0, 600ms)
3. Remove `cloud-mode` class, add `site-mode` class
4. Enable body overflow
5. After 600ms: Set state to SITE_MODE
6. Scroll to 1px (enables scroll-up detection)

**To Cloud Mode**:
1. Set state to TRANSITIONING
2. Scroll to top (smooth)
3. After 300ms: Fade in clouds (opacity: 0 → 1)
4. Remove `site-mode` class, add `cloud-mode` class
5. Disable body overflow
6. Set state to CLOUD_MODE

### Component 3: Main Initialization (main-cloud.js)

**Purpose**: Entry point that wires up all components and handles feature detection.

**Initialization Flow**:

```
1. Wait for DOMContentLoaded
2. Check prefers-reduced-motion
   ├─ If true: Apply CSS fallback, exit
   └─ If false: Continue
3. Initialize VolumetricCloudRenderer
4. Initialize ScrollManager
5. Expose to window (localhost only)
```

**Feature Detection**:

```javascript
// Reduced Motion
const prefersReducedMotion = 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

// WebGL Support (in VolumetricCloudRenderer)
const canvas = document.createElement('canvas')
const hasWebGL = !!(window.WebGLRenderingContext && 
    (canvas.getContext('webgl') || 
     canvas.getContext('experimental-webgl')))
```

### Component 4: Performance Monitor (Optional, Dev Only)

**Purpose**: Displays real-time FPS and memory usage during development.

**Interface**:

```javascript
class PerformanceMonitor {
    constructor()
    
    // Methods
    start(): void
    measure(): void
    createPanel(): void
    
    // Properties
    fps: number
    frameCount: number
    panel: HTMLElement
}
```

**Display**:
- Fixed position (top-right)
- Shows FPS (updated every second)
- Shows memory usage (if available)
- Only active on localhost

## Data Models

### 3D Perlin Noise Texture

**Structure**:
```javascript
{
    data: Uint8Array,           // Size³ elements (0-255)
    width: number,              // 128 or 64
    height: number,             // 128 or 64
    depth: number,              // 128 or 64
    format: THREE.RedFormat,    // Single channel
    type: THREE.UnsignedByteType
}
```

**Generation Algorithm**:
```
For each voxel (x, y, z):
    nx = x * scale (0.05)
    ny = y * scale
    nz = z * scale
    
    value = 0
    value += perlin(nx, ny, nz) * 0.5        // Octave 1
    value += perlin(nx*2, ny*2, nz*2) * 0.25 // Octave 2
    value += perlin(nx*4, ny*4, nz*4) * 0.125 // Octave 3
    value += perlin(nx*8, ny*8, nz*8) * 0.0625 // Octave 4
    
    data[index] = (value + 1) * 127.5  // Normalize to 0-255
```

### Shader Uniforms

**Vertex Shader Outputs**:
```glsl
varying vec3 vOrigin;      // Camera position in object space
varying vec3 vDirection;   // Ray direction from camera to vertex
```

**Fragment Shader Uniforms**:
```glsl
uniform sampler3D map;     // 3D Perlin noise texture
uniform float threshold;   // Cloud density threshold (0.25)
uniform float opacity;     // Cloud opacity multiplier (0.25)
uniform float steps;       // Raymarching iterations (50-100)
```

### State Data

**Scroll Manager State**:
```javascript
{
    state: 'CLOUD_MODE' | 'TRANSITIONING' | 'SITE_MODE',
    scrollAccumulator: number,      // Accumulated scroll distance
    lastScrollTime: number,         // Timestamp of last scroll
    scrollDirection: 'up' | 'down' | null,
    scrollUpStartTime: number | null, // Stagger delay timer
    touchStartY: number,            // Touch gesture tracking
    touchStartTime: number
}
```

## Error Handling

### WebGL Not Supported

**Detection**:
```javascript
checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas')
        return !!(window.WebGLRenderingContext && 
                 (canvas.getContext('webgl') || 
                  canvas.getContext('experimental-webgl')))
    } catch (e) {
        return false
    }
}
```

**Fallback**:
1. Log warning to console
2. Hide volumetric cloud canvas
3. Add `css-clouds-fallback` class to body
4. Initialize ScrollManager in SITE_MODE
5. Display existing CSS clouds (if available)

### Shader Compilation Errors

**Detection**:
- Three.js automatically logs shader errors to console
- Material creation will fail if shaders invalid

**Handling**:
- Wrap shader material creation in try-catch
- Fall back to CSS clouds on error
- Log error details for debugging

### Performance Issues

**Detection**:
- Monitor FPS via PerformanceMonitor (dev mode)
- Check for frame drops below threshold

**Adaptive Response**:
```javascript
// Already implemented in constructor
if (this.isMobile) {
    this.config.textureSize = 64   // Reduce quality
    this.config.steps = 50.0       // Fewer iterations
}
```

**Additional Fallbacks**:
- Further reduce texture size to 32³
- Reduce steps to 30
- Lower pixel ratio to 1.0
- Disable antialiasing

### Memory Leaks

**Prevention**:
```javascript
destroy() {
    this.stopAnimation()
    
    if (this.renderer) {
        this.renderer.dispose()
        this.container.removeChild(this.renderer.domElement)
    }
    
    if (this.cloudMesh) {
        this.cloudMesh.geometry.dispose()
        this.cloudMesh.material.dispose()
    }
    
    window.removeEventListener('resize', this.onResize)
}
```

### State Transition Errors

**Prevention**:
- Always check current state before transitions
- Prevent events during TRANSITIONING state
- Use setTimeout cleanup for async operations
- Reset accumulators on state change

## Testing Strategy

### Unit Testing

**Not Applicable**: This is a visual, interactive feature that requires browser environment. Manual testing is more appropriate.

### Manual Testing Checklist

**Desktop Testing**:
- [ ] Clouds render at 60fps
- [ ] Scroll down (150px) transitions to site
- [ ] Scroll up at top with 300ms delay returns to clouds
- [ ] Quick scroll up at top does NOT return to clouds
- [ ] Arrow keys work correctly
- [ ] Window resize maintains aspect ratio
- [ ] Tab visibility pauses/resumes animation

**Mobile Testing**:
- [ ] Clouds render at 45fps minimum
- [ ] Touch swipe up transitions to site
- [ ] Touch swipe down at top returns to clouds
- [ ] Performance acceptable on mid-range devices
- [ ] No thermal throttling issues
- [ ] Battery drain reasonable

**Accessibility Testing**:
- [ ] Reduced motion preference respected
- [ ] Keyboard navigation fully functional
- [ ] Screen reader announces cloud canvas
- [ ] No keyboard traps
- [ ] Focus management correct

**Browser Compatibility**:
- [ ] Chrome 120+ (desktop & mobile)
- [ ] Firefox 120+ (desktop & mobile)
- [ ] Safari 16+ (desktop & mobile)
- [ ] Edge 120+
- [ ] WebGL fallback works in old browsers

### Performance Testing

**Metrics to Monitor**:
- FPS (target: 60 desktop, 45 mobile)
- Memory usage (target: <150MB)
- Bundle size (target: <200KB gzipped)
- First Contentful Paint (target: <1.5s)
- Time to Interactive (target: <3.5s)

**Tools**:
- Chrome DevTools Performance tab
- Lighthouse audit
- PerformanceMonitor (custom, dev mode)
- WebGL Inspector

### Integration Testing

**Hugo Build**:
```bash
# Clean build
rm -rf public resources
hugo --minify

# Verify outputs
ls -lh public/js/main-cloud*.js
ls -lh public/css/volumetric-cloud-scroll.css

# Check for errors
hugo --logLevel info
```

**Runtime Integration**:
- [ ] Three.js loads correctly
- [ ] ES modules resolve
- [ ] CSS applies correctly
- [ ] No CORS errors
- [ ] No 404s for assets

## Deployment Considerations

### Hugo Configuration

**hugo.yaml additions**:
```yaml
build:
  writeStats: true

minify:
  minifyOutput: true

params:
  volumetricClouds:
    enabled: true
    textureSize: 128
    threshold: 0.25
    opacity: 0.25
    steps: 100
```

### Asset Pipeline

**JavaScript Bundling**:
```html
{{ $cloudScript := resources.Get "js/main-cloud.js" | 
                   js.Build (dict "format" "esm") | 
                   minify | 
                   fingerprint }}
<script type="module" src="{{ $cloudScript.RelPermalink }}"></script>
```

**CSS Processing**:
```html
<link rel="stylesheet" href="{{ "css/volumetric-cloud-scroll.css" | 
                                relURL | 
                                fingerprint }}">
```

### CDN Strategy

**Three.js**:
- Bundle with application (preferred)
- Fallback to CDN if local fails (optional)

**Assets**:
- Serve via Hugo's built-in asset pipeline
- Use fingerprinting for cache busting
- Enable gzip compression on server

### Browser Support Matrix

| Browser | Version | WebGL | Status |
|---------|---------|-------|--------|
| Chrome | 120+ | ✓ | Full Support |
| Firefox | 120+ | ✓ | Full Support |
| Safari | 16+ | ✓ | Full Support |
| Edge | 120+ | ✓ | Full Support |
| iOS Safari | 15+ | ✓ | Full Support |
| Chrome Mobile | 120+ | ✓ | Full Support |
| IE 11 | - | Limited | CSS Fallback |
| Opera | 100+ | ✓ | Full Support |

### Performance Budget

**Bundle Sizes**:
- main-cloud.js: <150KB (gzipped)
- Three.js: ~150KB (gzipped)
- volumetric-cloud-scroll.css: <5KB (gzipped)
- **Total**: <200KB (gzipped)

**Runtime Performance**:
- FPS: >60 (desktop), >45 (mobile)
- Memory: <150MB
- CPU: <30% average
- GPU: <50% average

## Security Considerations

### Content Security Policy

**Required Directives**:
```
script-src 'self' 'unsafe-eval';  // Three.js may use eval
style-src 'self' 'unsafe-inline'; // Inline styles for transitions
img-src 'self' data:;             // Data URLs for textures
```

### XSS Prevention

- No user input processed
- All content static
- No dynamic script injection
- Hugo templates escape by default

### Resource Limits

- 3D texture size capped at 128³
- Animation loop uses requestAnimationFrame (browser-controlled)
- Memory cleanup on destroy
- No infinite loops or recursion

## Future Enhancements

### Phase 2 Features

1. **Interactive Clouds**
   - Mouse movement affects cloud position
   - Parallax effect based on cursor
   - Touch drag to rotate clouds

2. **Weather Transitions**
   - Day/night cycle
   - Storm effects (darker, faster movement)
   - Seasonal variations

3. **Advanced Noise**
   - Curl noise for more realistic turbulence
   - Worley noise for different cloud types
   - Animated noise (time-based evolution)

4. **Lighting**
   - Dynamic sky lighting
   - Sun position affects cloud color
   - Volumetric light scattering

### Technical Improvements

1. **WebGPU Migration**
   - When browser support improves
   - Better performance
   - Compute shaders for dynamic generation

2. **Texture Caching**
   - Store generated texture in IndexedDB
   - Faster subsequent loads
   - Reduce initialization time

3. **Progressive Loading**
   - Show low-res clouds first
   - Upgrade to high-res when ready
   - Smoother initial experience

4. **Analytics Integration**
   - Track transition success rate
   - Monitor performance metrics
   - A/B test different configurations

## Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| WebGL not supported | Low | High | CSS fallback |
| Poor mobile performance | Medium | High | Adaptive quality settings |
| Large bundle size | Low | Medium | Code splitting, lazy loading |
| Browser compatibility | Low | Medium | Feature detection, polyfills |
| Memory leaks | Low | High | Proper cleanup, testing |

### UX Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Accidental cloud return | Medium | Medium | 300ms stagger delay |
| Confusing navigation | Low | Medium | Visual scroll indicator |
| Motion sickness | Low | Low | Reduced motion support |
| Accessibility issues | Low | High | Full keyboard nav, ARIA |
| Slow initial load | Medium | Medium | Progressive enhancement |

## Success Metrics

### Technical Metrics

- ✅ Desktop FPS: >60
- ✅ Mobile FPS: >45
- ✅ Bundle size: <200KB gzipped
- ✅ Lighthouse Performance: >90
- ✅ Zero accessibility violations
- ✅ Browser support: 95%+ of users

### User Experience Metrics

- ✅ Stagger delay prevents 95%+ accidental returns
- ✅ Transition smoothness: No visible jank
- ✅ Time to Interactive: <3.5s
- ✅ User engagement: Increased time on page
- ✅ Bounce rate: Decreased

### Development Metrics

- ✅ Code coverage: Manual testing complete
- ✅ Documentation: Complete
- ✅ Build time: <30s
- ✅ No console errors in production

---

**Document Version**: 1.0  
**Last Updated**: November 2025  
**Status**: Ready for Implementation
