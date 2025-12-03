# Design Document

## Overview

The Volumetric Clouds feature implements a real-time 3D cloud rendering system using Three.js and custom GLSL shaders. The system uses volumetric raymarching techniques to create atmospheric, animated cloudscapes that display behind the hero section of the website. The implementation prioritizes performance, visual quality, and seamless integration with the existing Hugo-based site structure.

The cloud renderer will be implemented as a standalone JavaScript module that initializes a Three.js scene with a full-screen quad mesh. Custom vertex and fragment shaders will handle the volumetric raymarching algorithm, noise generation via texture sampling, and physically-based lighting calculations. The system will respond to viewport changes, manage its own animation loop, and integrate with the existing page layout through CSS positioning and z-index management.

## Architecture

### System Components

The system consists of four primary layers:

1. **Initialization Layer**: Handles DOM readiness, Three.js setup, and resource loading
2. **Rendering Layer**: Manages the Three.js scene, camera, renderer, and animation loop
3. **Shader Layer**: Implements volumetric raymarching, noise sampling, and lighting in GLSL
4. **Integration Layer**: Manages DOM positioning, responsive behavior, and lifecycle events

### Component Interaction Flow

```
Page Load
    ↓
DOM Ready Event
    ↓
CloudRenderer.init()
    ↓
├─→ Load Noise Texture
├─→ Create Three.js Scene
├─→ Compile Shaders
├─→ Setup Geometry
└─→ Start Animation Loop
    ↓
Animation Frame
    ↓
├─→ Update Uniforms (time, resolution)
├─→ Render Scene
└─→ Request Next Frame
```

### Data Flow

```
Noise Texture (PNG) → TextureLoader → Shader Uniform
User Scroll → Window Event → (No direct cloud interaction, CSS handles layering)
Window Resize → Resize Handler → Update Renderer + Camera + Shader Uniforms
Time → Animation Loop → Shader Uniform → Cloud Animation
```

## Components and Interfaces

### CloudRenderer Module

**Purpose**: Main orchestrator for the volumetric cloud rendering system

**Public Interface**:
```javascript
class CloudRenderer {
  constructor(containerSelector)
  init(): Promise<void>
  dispose(): void
  pause(): void
  resume(): void
}
```

**Responsibilities**:
- Initialize Three.js scene, camera, and renderer
- Load and configure noise texture
- Create and compile shader materials
- Manage animation loop and frame updates
- Handle window resize events
- Provide lifecycle management (pause/resume/dispose)

### ShaderMaterial Configuration

**Purpose**: Defines the custom GLSL shaders and their uniforms

**Uniforms**:
```javascript
{
  uTime: { value: 0.0 },           // Elapsed time for animation
  uResolution: { value: new THREE.Vector2() },  // Viewport dimensions
  uNoise: { value: null }          // Noise texture sampler
}
```

**Vertex Shader**: Simple pass-through that transforms vertices and passes UV coordinates

**Fragment Shader**: Implements volumetric raymarching algorithm with:
- Noise sampling function
- Fractal Brownian Motion (FBM)
- Scene density function (SDF)
- Volumetric raymarching loop
- Directional derivative lighting
- Sky and sun rendering
- Final color compositing

### Geometry Setup

**Purpose**: Provides the mesh for rendering the shader

**Implementation**: Full-screen quad using PlaneGeometry
- Dimensions: 2x2 units (covers normalized device coordinates -1 to 1)
- Position: Centered at origin
- Camera: Orthographic camera positioned at z=1

### Texture Loader

**Purpose**: Loads noise texture from assets directory

**Configuration**:
- Source: `assets/noise/noise-map.png` (or alternative from noise directory)
- Format: RGB/RGBA
- Filtering: Linear (THREE.LinearFilter)
- Wrapping: Repeat (THREE.RepeatWrapping)
- Expected Size: 256x256 pixels

## Data Models

### Shader Uniforms Data Structure

```javascript
{
  uTime: {
    type: 'float',
    value: 0.0,
    updateFrequency: 'every frame',
    purpose: 'Drives cloud animation and movement'
  },
  uResolution: {
    type: 'vec2',
    value: { x: window.innerWidth, y: window.innerHeight },
    updateFrequency: 'on resize',
    purpose: 'Maintains correct aspect ratio and ray directions'
  },
  uNoise: {
    type: 'sampler2D',
    value: THREE.Texture,
    updateFrequency: 'once at initialization',
    purpose: 'Provides noise data for cloud density generation'
  }
}
```

### Scene Configuration

```javascript
{
  camera: {
    type: 'OrthographicCamera',
    left: -1,
    right: 1,
    top: 1,
    bottom: -1,
    near: 0,
    far: 2
  },
  renderer: {
    antialias: false,  // Performance optimization
    alpha: true,       // Transparent background for layering
    pixelRatio: Math.min(window.devicePixelRatio, 2)  // Cap at 2x for performance
  },
  geometry: {
    type: 'PlaneGeometry',
    width: 2,
    height: 2
  }
}
```

### Cloud Parameters

```javascript
{
  raymarching: {
    maxSteps: 100,
    marchSize: 0.08,
    densityThreshold: 0.0
  },
  noise: {
    fbmOctaves: 6,
    fbmScale: 0.5,
    fbmFactor: 2.02,
    fbmFactorIncrement: 0.21,
    fbmScaleDecay: 0.5
  },
  lighting: {
    sunPosition: { x: 1.0, y: 0.0, z: 0.0 },
    diffuseOffset: 0.3,
    skyBaseColor: { r: 0.7, g: 0.7, b: 0.90 },
    skyGradientColor: { r: 0.90, g: 0.75, b: 0.90 },
    sunColor: { r: 1.0, g: 0.5, b: 0.3 },
    ambientColor: { r: 0.60, g: 0.60, b: 0.75 },
    sunIntensity: 0.8
  },
  animation: {
    cloudSpeed: { x: 1.0, y: -0.2, z: -1.0 },
    timeScale: 0.5
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Time uniform progression
*For any* sequence of animation frames, the uTime uniform value should monotonically increase, ensuring continuous cloud animation.
**Validates: Requirements 1.5**

### Property 2: Viewport resize consistency
*For any* window resize event, the renderer dimensions and uResolution uniform should match the new viewport dimensions after the resize handler completes.
**Validates: Requirements 4.3**

### Property 3: Animation pause on visibility change
*For any* page visibility change to hidden state, the animation loop should stop requesting new frames until visibility is restored.
**Validates: Requirements 4.4**

### Property 4: Texture loading error handling
*For any* texture loading failure, the system should log an error and continue initialization without throwing unhandled exceptions.
**Validates: Requirements 5.4**

### Property 5: Graceful initialization failure
*For any* error during CloudRenderer initialization, the error should be caught and logged without propagating to break other page functionality.
**Validates: Requirements 6.5**

## Error Handling

### Texture Loading Failures

**Scenario**: Noise texture file is missing or fails to load

**Handling Strategy**:
1. Catch texture loading errors in the Promise chain
2. Log descriptive error message to console
3. Create fallback solid color texture (white or light gray)
4. Continue initialization with fallback texture
5. Display warning in development mode

**Implementation**:
```javascript
textureLoader.load(
  texturePath,
  (texture) => { /* success */ },
  undefined,
  (error) => {
    console.error('Failed to load noise texture:', error);
    // Create fallback 1x1 white texture
    const fallbackTexture = new THREE.DataTexture(
      new Uint8Array([255, 255, 255, 255]),
      1, 1,
      THREE.RGBAFormat
    );
    fallbackTexture.needsUpdate = true;
    material.uniforms.uNoise.value = fallbackTexture;
  }
);
```

### Shader Compilation Errors

**Scenario**: GLSL shader fails to compile due to syntax errors or unsupported features

**Handling Strategy**:
1. Three.js will log shader compilation errors to console automatically
2. Catch renderer errors during first render attempt
3. Display fallback solid color or gradient background
4. Prevent animation loop from starting
5. Provide clear error message for developers

**Implementation**:
```javascript
try {
  renderer.render(scene, camera);
} catch (error) {
  console.error('Shader compilation failed:', error);
  // Hide canvas and show fallback
  canvas.style.display = 'none';
  return;
}
```

### WebGL Context Loss

**Scenario**: WebGL context is lost due to GPU issues or browser limitations

**Handling Strategy**:
1. Listen for 'webglcontextlost' event on canvas
2. Prevent default behavior to allow context restoration
3. Pause animation loop
4. Listen for 'webglcontextrestored' event
5. Reinitialize renderer and resume animation

**Implementation**:
```javascript
canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  this.pause();
  console.warn('WebGL context lost');
}, false);

canvas.addEventListener('webglcontextrestored', () => {
  this.init();
  console.log('WebGL context restored');
}, false);
```

### Initialization Failures

**Scenario**: CloudRenderer fails to initialize due to missing container, WebGL unavailability, or other issues

**Handling Strategy**:
1. Wrap entire init() method in try-catch
2. Check for WebGL support before creating renderer
3. Validate container element exists
4. Log specific error messages for different failure modes
5. Fail silently to avoid breaking page functionality

**Implementation**:
```javascript
async init() {
  try {
    // Check WebGL support
    if (!this.isWebGLAvailable()) {
      console.warn('WebGL not supported, clouds disabled');
      return;
    }
    
    // Validate container
    const container = document.querySelector(this.containerSelector);
    if (!container) {
      console.error('Cloud container not found:', this.containerSelector);
      return;
    }
    
    // Continue initialization...
  } catch (error) {
    console.error('CloudRenderer initialization failed:', error);
    // Fail silently
  }
}
```

### Performance Degradation

**Scenario**: Frame rate drops below acceptable threshold

**Handling Strategy**:
1. Monitor frame times using performance.now()
2. Calculate rolling average FPS
3. If FPS drops below 30 for sustained period, reduce pixel ratio
4. Log performance warnings
5. Provide option to disable clouds via user preference

**Implementation**:
```javascript
let frameCount = 0;
let lastTime = performance.now();
const fpsThreshold = 30;
const checkInterval = 60; // Check every 60 frames

function checkPerformance() {
  frameCount++;
  if (frameCount % checkInterval === 0) {
    const currentTime = performance.now();
    const fps = (checkInterval * 1000) / (currentTime - lastTime);
    lastTime = currentTime;
    
    if (fps < fpsThreshold && renderer.getPixelRatio() > 1) {
      renderer.setPixelRatio(1);
      console.warn('Reduced cloud render quality for performance');
    }
  }
}
```

## Testing Strategy

### Unit Testing Approach

The volumetric cloud system will use unit tests to verify:

1. **Initialization Logic**:
   - CloudRenderer constructor properly stores configuration
   - init() method creates scene, camera, and renderer objects
   - Texture loader is invoked with correct path
   - Canvas is appended to correct container element

2. **Lifecycle Management**:
   - pause() method stops animation loop
   - resume() method restarts animation loop
   - dispose() method cleans up Three.js resources

3. **Event Handlers**:
   - Resize handler updates renderer dimensions
   - Resize handler updates uResolution uniform
   - Visibility change handler pauses/resumes animation

4. **Error Handling**:
   - Texture loading failure creates fallback texture
   - Missing container element logs error without throwing
   - Shader compilation errors are caught and logged

**Testing Framework**: Vitest with happy-dom for DOM simulation

**Example Unit Test**:
```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CloudRenderer } from './cloud-renderer.js';

describe('CloudRenderer', () => {
  let container;
  
  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'cloud-container';
    document.body.appendChild(container);
  });
  
  it('should create scene, camera, and renderer on init', async () => {
    const renderer = new CloudRenderer('#cloud-container');
    await renderer.init();
    
    expect(renderer.scene).toBeDefined();
    expect(renderer.camera).toBeDefined();
    expect(renderer.renderer).toBeDefined();
  });
  
  it('should update resolution uniform on resize', async () => {
    const renderer = new CloudRenderer('#cloud-container');
    await renderer.init();
    
    window.innerWidth = 1920;
    window.innerHeight = 1080;
    window.dispatchEvent(new Event('resize'));
    
    expect(renderer.material.uniforms.uResolution.value.x).toBe(1920);
    expect(renderer.material.uniforms.uResolution.value.y).toBe(1080);
  });
});
```

### Property-Based Testing Approach

Property-based tests will verify universal properties that should hold across all inputs using the fast-check library. Each property test will run a minimum of 100 iterations.

**Property Testing Framework**: fast-check

**Properties to Test**:

1. **Time Monotonicity**: Time uniform should always increase between frames
2. **Resolution Consistency**: After any resize, renderer and uniform dimensions should match
3. **Animation State**: Paused renderer should not update time uniform
4. **Error Recovery**: Any initialization error should be caught without propagation

**Example Property Test**:
```javascript
import { describe, it } from 'vitest';
import fc from 'fast-check';
import { CloudRenderer } from './cloud-renderer.js';

describe('CloudRenderer Properties', () => {
  it('time uniform increases monotonically across frames', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 100 }), // number of frames
        async (frameCount) => {
          const renderer = new CloudRenderer('#cloud-container');
          await renderer.init();
          
          const times = [];
          for (let i = 0; i < frameCount; i++) {
            renderer.updateUniforms();
            times.push(renderer.material.uniforms.uTime.value);
          }
          
          // Verify monotonic increase
          for (let i = 1; i < times.length; i++) {
            if (times[i] <= times[i - 1]) {
              return false;
            }
          }
          
          renderer.dispose();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('resolution uniform matches renderer after any resize', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 320, max: 3840 }),
        fc.integer({ min: 240, max: 2160 }),
        async (width, height) => {
          const renderer = new CloudRenderer('#cloud-container');
          await renderer.init();
          
          window.innerWidth = width;
          window.innerHeight = height;
          renderer.handleResize();
          
          const uniformWidth = renderer.material.uniforms.uResolution.value.x;
          const uniformHeight = renderer.material.uniforms.uResolution.value.y;
          const rendererSize = new THREE.Vector2();
          renderer.renderer.getSize(rendererSize);
          
          renderer.dispose();
          
          return uniformWidth === rendererSize.x && 
                 uniformHeight === rendererSize.y;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

Integration tests will verify the cloud system works correctly with the actual DOM and Three.js:

1. **Full Initialization Flow**: Test complete init sequence with real DOM elements
2. **Shader Compilation**: Verify shaders compile successfully in WebGL context
3. **Texture Loading**: Test loading actual noise texture files
4. **Animation Loop**: Verify animation loop runs and updates uniforms
5. **Responsive Behavior**: Test resize handling with actual viewport changes

### Manual Testing Checklist

Visual and performance testing that requires human verification:

- [ ] Clouds appear smooth and organic (no visible artifacts)
- [ ] Lighting creates realistic depth and shadows
- [ ] Animation is subtle and calming (not distracting)
- [ ] Colors match site's design aesthetic
- [ ] Performance is smooth on target devices (60 FPS on desktop, 30+ FPS on mobile)
- [ ] Clouds layer correctly behind hero content
- [ ] Text remains readable over cloud background
- [ ] No visual glitches during scrolling
- [ ] Responsive behavior works on various screen sizes
- [ ] Graceful degradation on low-end devices

## Implementation Notes

### Three.js Version

The implementation will use Three.js r150 or later, which provides stable APIs for:
- WebGLRenderer with alpha support
- OrthographicCamera for 2D shader rendering
- ShaderMaterial for custom GLSL shaders
- TextureLoader for loading noise textures
- Proper disposal methods for memory management

### Shader Language

GLSL ES 3.00 (WebGL 2.0) will be used if available, with fallback to GLSL ES 1.00 (WebGL 1.0) for broader compatibility. The shader code will use:
- Precision qualifiers (highp, mediump, lowp) appropriately
- Built-in functions (mix, clamp, smoothstep, etc.)
- Texture sampling with textureLod for explicit mipmap control

### Performance Considerations

1. **Pixel Ratio Capping**: Limit to 2x device pixel ratio to prevent excessive fragment shader invocations on high-DPI displays
2. **Raymarching Steps**: Fixed at 100 steps as a balance between quality and performance
3. **Texture Size**: 256x256 noise texture provides sufficient detail without excessive memory usage
4. **Animation Loop**: Use requestAnimationFrame for optimal frame pacing
5. **Visibility API**: Pause rendering when page is not visible to save battery and CPU

### Browser Compatibility

Target browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with WebGL support

Fallback strategy for unsupported browsers:
- Detect WebGL availability before initialization
- Display static gradient background if WebGL unavailable
- Log informative message for developers

### Accessibility Considerations

1. **Reduced Motion**: Respect prefers-reduced-motion media query by slowing or stopping animation
2. **Performance**: Ensure clouds don't cause motion sickness with excessive movement
3. **Contrast**: Maintain sufficient contrast between text and cloud background
4. **Optional**: Provide user control to disable clouds via settings

### Integration with Hugo

The cloud renderer will integrate with Hugo's asset pipeline:

1. **JavaScript Module**: Place in `assets/js/cloud-renderer.js`
2. **Shader Files**: Optionally separate shaders into `assets/shaders/` directory
3. **Hugo Processing**: Use Hugo's `resources.Get` and `resources.Minify` for production builds
4. **Initialization**: Call from existing `animations.js` or create separate entry point
5. **Container Element**: Add to hero section partial template

### Development Workflow

1. **Local Development**: Use `hugo server` with live reload
2. **Shader Debugging**: Use browser DevTools for WebGL inspection
3. **Performance Profiling**: Use Chrome DevTools Performance tab
4. **Visual Testing**: Test on multiple devices and screen sizes
5. **Production Build**: Minify JavaScript and optimize assets

