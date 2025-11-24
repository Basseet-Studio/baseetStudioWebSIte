# Design Document

## Overview

This design implements a complete replacement of the existing cloud rendering system with a Shadertoy-based volumetric cloud renderer. The system uses WebGL shaders with raymarching techniques to create realistic 3D clouds, integrated with Three.js for scene management and 3D text rendering. The implementation converts the Shadertoy GLSL code to work within a Three.js environment while maintaining the visual quality of the original shader.

The architecture follows a clean separation between shader code (GLSL), scene management (Three.js), scroll handling (vanilla JavaScript), and HTML integration. All old cloud files will be deleted and replaced with a new, streamlined implementation.

## Architecture

### High-Level Components

1. **ShadertoyCloudRenderer** - Main class managing Three.js scene, camera, renderer, and shader material
2. **Shader System** - GLSL vertex and fragment shaders adapted from Shadertoy code
3. **Texture Manager** - Loads and manages iChannel0-3 textures for noise generation
4. **Text Renderer** - Creates and manages 3D "BASEET STUDIO" text mesh
5. **Scroll Controller** - Handles scroll events and updates camera/scene based on progress
6. **HTML Integration** - Updates home.html template to use new cloud system

### Data Flow

```
User Scroll Event
    ↓
Scroll Controller (calculates progress 0-1)
    ↓
ShadertoyCloudRenderer.updateScroll(progress)
    ↓
Updates: Camera Position, Shader Uniforms (time, scroll)
    ↓
WebGL Renders Frame with Raymarched Clouds
    ↓
Display to Canvas
```

### File Structure

```
assets/js/shadertoy-clouds/
├── shadertoy-cloud-renderer.js    # Main renderer class
├── shadertoy-shaders.js           # Vertex and fragment shaders
├── texture-loader.js              # iChannel texture loading
└── scroll-integration.js          # Scroll handling and scene control

assets/css/
└── shadertoy-clouds.css           # Minimal CSS for canvas positioning

static/textures/
├── ichannel0.png                  # Noise texture (moved from root)
├── ichannel1.png                  # Blue noise texture
├── ichannel2.png                  # 3D noise texture
└── ichannel3.png                  # Additional texture

layouts/
└── home.html                      # Updated template (old cloud code removed)
```

## Components and Interfaces

### 1. ShadertoyCloudRenderer Class

**Purpose**: Main class that initializes and manages the Three.js scene with Shadertoy shaders.

**Public Interface**:
```javascript
class ShadertoyCloudRenderer {
    constructor(canvasId, options = {})
    
    // Initialize scene, camera, renderer, load textures
    async init()
    
    // Update scroll progress (0-1)
    updateScroll(progress)
    
    // Start/stop animation loop
    start()
    stop()
    
    // Check if transition is complete
    isComplete()
    
    // Reset to initial state
    reset()
    
    // Clean up resources
    destroy()
}
```

**Options**:
```javascript
{
    scrollDistance: 600,        // Pixels to scroll through scene
    textContent: 'BASEET STUDIO',
    fontSize: 0.8,
    cloudDensity: 0.7,
    lookMode: 1,               // 0: sunset, 1: bright (from Shadertoy)
    noiseMethod: 1,            // Noise sampling method (from Shadertoy)
    useLOD: true              // Level of detail optimization
}
```

### 2. Shader System

**Vertex Shader**: Simple pass-through that provides vUv coordinates and world position.

**Fragment Shader**: Adapted from Shadertoy code with these key functions:
- `noise(vec3 x)` - 3D noise sampling using iChannel0 texture
- `map5/map4/map3/map2(vec3 p)` - Cloud density functions with different octaves
- `raymarch(vec3 ro, vec3 rd, vec3 bgcol, ivec2 px)` - Main raymarching loop
- `render(vec3 ro, vec3 rd, ivec2 px)` - Combines sky, clouds, and sun glare

**Shadertoy to Three.js Variable Mapping**:
```glsl
// Shadertoy → Three.js
iTime → uTime (uniform float)
iResolution → uResolution (uniform vec2)
iMouse → uMouse (uniform vec2)
fragCoord → gl_FragCoord
fragColor → gl_FragColor
iChannel0 → uChannel0 (uniform sampler2D)
iChannel1 → uChannel1 (uniform sampler2D)
iChannel2 → uChannel2 (uniform sampler2D)
iChannel3 → uChannel3 (uniform sampler2D)
```

**Uniforms**:
```javascript
{
    uTime: { value: 0.0 },
    uResolution: { value: new THREE.Vector2() },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uScroll: { value: 0.0 },
    uChannel0: { value: null },  // Noise texture
    uChannel1: { value: null },  // Blue noise
    uChannel2: { value: null },  // 3D noise (if used)
    uChannel3: { value: null },  // Additional texture
    uLookMode: { value: 1 },
    uNoiseMethod: { value: 1 }
}
```

### 3. Texture Manager

**Purpose**: Load iChannel textures and configure them for shader use.

**Interface**:
```javascript
class TextureLoader {
    static async loadChannelTextures() {
        // Returns: { channel0, channel1, channel2, channel3 }
    }
    
    static configureTexture(texture, options = {}) {
        // Set wrapping, filtering, format
    }
}
```

**Texture Configuration**:
- Wrapping: `THREE.RepeatWrapping` for seamless tiling
- Filtering: `THREE.LinearFilter` for smooth interpolation
- Format: `THREE.RGBAFormat`
- Type: `THREE.UnsignedByteType`

### 4. Text Renderer

**Purpose**: Create 3D text mesh for "BASEET STUDIO".

**Implementation**:
```javascript
class TextRenderer {
    static createTextMesh(text, options = {}) {
        // Uses THREE.TextGeometry with loaded font
        // Returns THREE.Mesh with MeshStandardMaterial
    }
    
    static loadFont() {
        // Load font using THREE.FontLoader
        // Returns Promise<Font>
    }
}
```

**Text Properties**:
- Font: Helvetica or similar bold sans-serif
- Size: Configurable (default 0.8 units)
- Material: MeshStandardMaterial with emissive properties
- Position: Centered in scene, at appropriate depth (z = -5 to -10)
- Lighting: Receives light from directional light matching sun direction

### 5. Scroll Controller

**Purpose**: Handle scroll events and coordinate scene updates.

**Interface**:
```javascript
class ScrollController {
    constructor(renderer, options = {})
    
    // Start listening to scroll events
    enable()
    
    // Stop listening
    disable()
    
    // Get current scroll progress (0-1)
    getProgress()
    
    // Check if scroll is complete
    isComplete()
}
```

**Scroll Logic**:
- Tracks `window.scrollY`
- Calculates progress: `Math.min(scrollY / scrollDistance, 1.0)`
- Updates renderer on each scroll event (throttled with requestAnimationFrame)
- Triggers transition callback when progress reaches 1.0
- Handles scroll-back reset when scrollY < 50

## Data Models

### CloudScene State

```javascript
{
    isInitialized: boolean,
    isAnimating: boolean,
    scrollProgress: number,      // 0.0 to 1.0
    transitionComplete: boolean,
    camera: {
        position: Vector3,
        rotation: Euler,
        fov: number
    },
    uniforms: {
        time: number,
        scroll: number,
        resolution: Vector2,
        mouse: Vector2
    }
}
```

### Renderer Configuration

```javascript
{
    canvas: HTMLCanvasElement,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    cloudMaterial: THREE.ShaderMaterial,
    textMesh: THREE.Mesh,
    animationId: number | null
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Time uniform increases monotonically during animation

*For any* two consecutive animation frames, the time uniform value in the second frame should be greater than or equal to the time uniform value in the first frame.

**Validates: Requirements 1.4**

### Property 2: Scroll progress updates camera position

*For any* valid scroll progress value (0 to 1), calling updateScroll() should result in a camera position that differs from the initial position, with the z-coordinate moving forward (decreasing) as progress increases.

**Validates: Requirements 2.1**

### Property 3: Camera distance to text decreases with scroll progress

*For any* two scroll progress values where progress2 > progress1, the distance from the camera to the text mesh at progress2 should be less than the distance at progress1.

**Validates: Requirements 2.2**

### Property 4: Scroll backwards moves camera backwards

*For any* two scroll progress values where progress2 < progress1, the camera z-position at progress2 should be greater than (further back) the camera z-position at progress1.

**Validates: Requirements 2.4**

### Property 5: Visibility change pauses and resumes animation

*For any* renderer state, when the visibility changes to hidden, the animation loop should stop (isAnimating becomes false), and when visibility changes to visible, the animation loop should resume (isAnimating becomes true).

**Validates: Requirements 3.2, 3.3**

### Property 6: Window resize updates canvas and camera

*For any* window resize event, after handling the resize, the canvas dimensions should match the new window dimensions and the camera aspect ratio should equal the new width/height ratio.

**Validates: Requirements 3.4**

### Property 7: All required uniforms are set before rendering

*For any* render call, the shader material's uniforms object should contain all required keys (uTime, uResolution, uMouse, uScroll, uChannel0, uChannel1, uChannel2, uChannel3) with non-null values.

**Validates: Requirements 5.4**

### Property 8: Text size increases with scroll progress

*For any* two scroll progress values where progress2 > progress1, the apparent size of the text (as measured by the ratio of text size to camera distance) at progress2 should be greater than at progress1.

**Validates: Requirements 6.4**

## Error Handling

### WebGL Support Detection

**Strategy**: Check for WebGL support before initialization.

**Implementation**:
```javascript
checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
                 (canvas.getContext('webgl') || 
                  canvas.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
}
```

**Fallback**: If WebGL is not supported:
1. Hide the cloud canvas
2. Add CSS class to body for fallback styling
3. Skip directly to main content
4. Log warning to console

### Texture Loading Failures

**Strategy**: Handle texture loading errors gracefully.

**Implementation**:
- Use THREE.TextureLoader with error callbacks
- Provide default/fallback textures if loading fails
- Log errors but continue initialization
- Degrade to simpler noise generation if textures unavailable

**Error Cases**:
- Network failure: Retry once, then use fallback
- Invalid texture format: Log error, use default texture
- Missing texture files: Use procedurally generated noise

### Shader Compilation Errors

**Strategy**: Detect and report shader compilation failures.

**Implementation**:
```javascript
const material = new THREE.ShaderMaterial({...});
renderer.compile(scene, camera);

// Check for errors
const gl = renderer.getContext();
if (gl.getError() !== gl.NO_ERROR) {
    console.error('Shader compilation failed');
    // Fallback to simple material
}
```

**Fallback**: Use THREE.MeshBasicMaterial with simple color if shaders fail.

### Font Loading Failures

**Strategy**: Handle font loading errors for 3D text.

**Implementation**:
- Try to load preferred font
- If fails, use THREE.TextGeometry with built-in font
- If that fails, use THREE.Mesh with simple geometry as text placeholder

### Memory Management

**Strategy**: Properly dispose of Three.js resources to prevent memory leaks.

**Implementation**:
```javascript
destroy() {
    // Stop animation
    this.stop();
    
    // Dispose geometries
    this.scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
            if (object.material.map) object.material.map.dispose();
            object.material.dispose();
        }
    });
    
    // Dispose renderer
    this.renderer.dispose();
    
    // Clear references
    this.scene = null;
    this.camera = null;
    this.renderer = null;
}
```

### Scroll Event Throttling

**Strategy**: Prevent performance issues from excessive scroll events.

**Implementation**:
```javascript
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(() => {
            handleScroll();
            ticking = false;
        });
        ticking = true;
    }
}, { passive: true });
```

## Testing Strategy

### Unit Testing

**Framework**: Jest or Vitest for JavaScript unit tests.

**Test Coverage**:

1. **Initialization Tests**
   - Test that constructor creates necessary Three.js objects
   - Test that init() loads textures and creates scene
   - Test WebGL support detection
   - Test mobile device detection

2. **Scroll Update Tests**
   - Test updateScroll() with various progress values (0, 0.5, 1.0)
   - Test isComplete() returns true when progress >= 1.0
   - Test reset() returns to initial state

3. **Texture Loading Tests**
   - Test that TextureLoader requests correct URLs
   - Test texture configuration (wrapping, filtering)
   - Test error handling for missing textures

4. **Shader Compilation Tests**
   - Test that shader source contains required uniforms
   - Test that Shadertoy variables are converted to Three.js equivalents
   - Test shader compiles without errors (using headless GL)

5. **Lifecycle Tests**
   - Test start() begins animation loop
   - Test stop() cancels animation loop
   - Test destroy() cleans up resources

### Property-Based Testing

**Framework**: fast-check for JavaScript property-based testing.

**Configuration**: Each property test should run a minimum of 100 iterations.

**Property Tests**:

1. **Property Test: Time Monotonicity**
   - **Feature: shadertoy-volumetric-clouds, Property 1: Time uniform increases monotonically during animation**
   - Generate: Sequence of frame updates
   - Assert: time[i+1] >= time[i] for all i

2. **Property Test: Scroll Updates Camera**
   - **Feature: shadertoy-volumetric-clouds, Property 2: Scroll progress updates camera position**
   - Generate: Random scroll progress values (0 to 1)
   - Assert: Camera position changes from initial position

3. **Property Test: Camera Distance Decreases**
   - **Feature: shadertoy-volumetric-clouds, Property 3: Camera distance to text decreases with scroll progress**
   - Generate: Pairs of scroll progress values where p2 > p1
   - Assert: distance(camera, text) at p2 < distance at p1

4. **Property Test: Backwards Scroll**
   - **Feature: shadertoy-volumetric-clouds, Property 4: Scroll backwards moves camera backwards**
   - Generate: Pairs of scroll progress values where p2 < p1
   - Assert: camera.position.z at p2 > camera.position.z at p1

5. **Property Test: Visibility Toggle**
   - **Feature: shadertoy-volumetric-clouds, Property 5: Visibility change pauses and resumes animation**
   - Generate: Sequences of visibility changes
   - Assert: isAnimating matches visibility state

6. **Property Test: Resize Updates**
   - **Feature: shadertoy-volumetric-clouds, Property 6: Window resize updates canvas and camera**
   - Generate: Random window dimensions
   - Assert: Canvas size and camera aspect match new dimensions

7. **Property Test: Uniforms Set**
   - **Feature: shadertoy-volumetric-clouds, Property 7: All required uniforms are set before rendering**
   - Generate: Various renderer states
   - Assert: All required uniform keys exist with non-null values

8. **Property Test: Text Size Increases**
   - **Feature: shadertoy-volumetric-clouds, Property 8: Text size increases with scroll progress**
   - Generate: Pairs of scroll progress values where p2 > p1
   - Assert: Apparent text size at p2 > apparent text size at p1

### Integration Testing

**Approach**: Test the complete system in a browser environment.

**Test Scenarios**:

1. **Full Scroll Journey**
   - Load page
   - Scroll from 0 to 100% progress
   - Verify transition triggers
   - Verify main content appears

2. **Scroll Back Reset**
   - Complete scroll journey
   - Scroll back to top
   - Verify scene resets

3. **Mobile Experience**
   - Test on mobile viewport
   - Verify reduced quality settings
   - Verify performance is acceptable

4. **Accessibility**
   - Test with prefers-reduced-motion
   - Test keyboard navigation
   - Test screen reader announcements

5. **Browser Compatibility**
   - Test in Chrome, Firefox, Safari, Edge
   - Test WebGL fallback in browsers without WebGL

### Visual Regression Testing

**Tool**: Percy or Chromatic for visual diffs.

**Snapshots**:
- Initial cloud scene (progress 0%)
- Mid-scroll (progress 50%)
- Near text (progress 90%)
- Transition complete (progress 100%)

### Performance Testing

**Metrics**:
- FPS (target: 60fps on desktop, 30fps on mobile)
- Frame time (target: <16ms desktop, <33ms mobile)
- Memory usage (target: <100MB)
- Texture load time (target: <2s)

**Tools**:
- Chrome DevTools Performance panel
- WebGL Inspector
- Stats.js for real-time FPS monitoring

## Implementation Notes

### Shader Conversion Details

The Shadertoy code uses `#define` directives for configuration:
```glsl
#define LOOK 1           // 0: sunset, 1: bright
#define NOISE_METHOD 1   // 0: 3D texture, 1: 2D with hardware interp, 2: 2D with software interp
#define USE_LOD 1        // 0: no LOD, 1: yes LOD
```

In Three.js, these should be converted to uniforms for runtime control:
```javascript
uniforms: {
    uLookMode: { value: 1 },
    uNoiseMethod: { value: 1 },
    uUseLOD: { value: 1 }
}
```

### Camera Animation

The original Shadertoy uses mouse position to control camera. For our scroll-based approach:

**Initial Camera Position** (progress = 0):
```javascript
camera.position.set(0, 0, 15);  // Far from text
camera.lookAt(0, 0, 0);
```

**Final Camera Position** (progress = 1):
```javascript
camera.position.set(0, 0, 2);   // Close to text
camera.lookAt(0, 0, 0);
```

**Interpolation**:
```javascript
updateScroll(progress) {
    const startZ = 15;
    const endZ = 2;
    this.camera.position.z = startZ + (endZ - startZ) * progress;
    
    // Update shader uniform
    this.cloudMaterial.uniforms.uScroll.value = progress;
}
```

### Text Rendering

Use THREE.FontLoader and THREE.TextGeometry:

```javascript
const loader = new FontLoader();
loader.load('fonts/helvetiker_bold.typeface.json', (font) => {
    const geometry = new TextGeometry('BASEET STUDIO', {
        font: font,
        size: 0.8,
        height: 0.2,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelSegments: 5
    });
    
    geometry.center();
    
    const material = new MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x4a6bc1,
        emissiveIntensity: 0.5,
        metalness: 0.3,
        roughness: 0.4
    });
    
    const textMesh = new Mesh(geometry, material);
    textMesh.position.z = -8;  // Position in cloud volume
    scene.add(textMesh);
});
```

### Reduced Motion Support

```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
    // Disable automatic rotation
    this.config.rotationSpeed = 0;
    
    // Reduce animation speed
    this.config.animationSpeed = 0.1;
    
    // Still allow scroll-based movement
    // (scroll is user-initiated, not automatic)
}
```

### File Cleanup Checklist

Files to delete:
- `assets/js/volumetric-clouds/cloud-renderer.js`
- `assets/js/volumetric-clouds/hero-cloud-adapter.js`
- `assets/js/volumetric-clouds/scroll-manager.js`
- `assets/js/volumetric-clouds/shaders.js`
- `assets/js/volumetric-clouds/texture-generator.js`
- `assets/js/volumetric-clouds/README.md`
- `assets/js/volumetric-clouds/test-*.js` (all test files)
- `static/css/volumetric-cloud-scroll.css`
- `static/css/cloud-scroll.css`

References to remove from `layouts/home.html`:
- All imports of old cloud files
- Old cloud canvas elements
- Old scroll controller initialization
- Old CSS links

### Texture Organization

Move iChannel textures from root to organized location:
```bash
mkdir -p static/textures
mv ichannel0.png static/textures/
mv ichannel1.png static/textures/
mv ichannel2.png static/textures/
mv ichannel3.png static/textures/
```

Update texture loading paths in code:
```javascript
const texturePaths = [
    '/textures/ichannel0.png',
    '/textures/ichannel1.png',
    '/textures/ichannel2.png',
    '/textures/ichannel3.png'
];
```
