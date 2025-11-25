# Design Document

## Overview

This design refactors the cloud rendering system and app bar to create a unified, non-duplicated experience. The key changes are:

1. **Single App Bar** - Remove any duplicate app bar implementations, use one component that transitions
2. **Progressive Opacity** - Nav links fade in as user scrolls (0.3 → 1.0), logo stays solid white
3. **Skip Button** - Solid text button in corner to bypass cloud animation
4. **Simplified Transition** - Clean cloud-to-site transition using CSS custom properties driven by scroll progress

The architecture uses a single source of truth (scroll progress) to drive all visual states via CSS custom properties, eliminating the need for separate "cloud mode" and "site mode" logic.

## Architecture

### High-Level Components

1. **ShadertoyCloudRenderer** - Renders volumetric clouds using WebGL/Three.js (existing, needs fixes)
2. **ScrollController** - Tracks scroll position, calculates progress, updates CSS custom properties
3. **App Bar** - Single HTML element with CSS-driven transitions based on `--scroll-progress`
4. **Skip Button** - Simple button that scrolls to main content

### Data Flow

```
User Scroll Event
    ↓
ScrollController (calculates progress 0-1)
    ↓
Sets CSS Custom Property: --scroll-progress
    ↓
CSS automatically updates:
  - App bar background (transparent → white)
  - Nav link opacity (0.3 → 1.0)
  - Skip button visibility (visible → hidden)
  - Cloud canvas opacity (1 → 0)
    ↓
ScrollController also calls:
  - renderer.updateScroll(progress) for camera movement
```

### File Structure

```
assets/js/shadertoy-clouds/
├── shadertoy-cloud-renderer.js    # Main renderer (fix rendering issues)
├── shadertoy-shaders.js           # GLSL shaders (existing)
├── texture-loader.js              # Texture loading (existing)
├── scroll-controller.js           # Refactored to use CSS custom properties
└── text-renderer.js               # 3D text (existing)

assets/css/
├── shadertoy-clouds.css           # Refactored cloud styles
└── app-bar.css                    # Simplified app bar styles (no duplication)

layouts/
├── home.html                      # Simplified template
└── partials/header.html           # Single app bar partial
```

## Components and Interfaces

### 1. ScrollController (Refactored)

**Purpose**: Single source of truth for scroll state, drives all visual updates via CSS custom properties.

**Public Interface**:
```javascript
class ScrollController {
    constructor(renderer, options = {})
    
    // Enable/disable scroll tracking
    enable()
    disable()
    
    // Get current progress (0-1)
    getProgress()
    
    // Programmatically set progress (for skip button)
    skipToContent()
    
    // Clean up
    destroy()
}
```

**Key Change**: Instead of dispatching events, directly sets CSS custom property:
```javascript
updateScrollProgress() {
    const progress = Math.min(scrollY / this.config.scrollDistance, 1.0);
    
    // Set CSS custom property on document root
    document.documentElement.style.setProperty('--scroll-progress', progress);
    
    // Update renderer camera
    this.renderer.updateScroll(progress);
}
```

### 2. App Bar (Simplified CSS)

**Purpose**: Single app bar that transitions based on `--scroll-progress` CSS variable.

**HTML Structure** (single element, no duplication):
```html
<header id="app-bar" class="app-bar" role="banner">
    <div class="app-bar-container">
        <a href="/" class="app-bar-logo">
            <span class="logo-text">Baseet Studio</span>
        </a>
        <nav class="app-bar-nav">
            <ul class="nav-links">
                <li><a href="#features">Features</a></li>
                <!-- ... -->
            </ul>
        </nav>
        <button class="mobile-menu-toggle">...</button>
    </div>
</header>
```

**CSS Using Custom Properties**:
```css
.app-bar {
    --progress: var(--scroll-progress, 0);
    
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 200;
    
    /* Background transitions from transparent to white */
    background-color: rgba(255, 255, 255, calc(var(--progress) * 0.95));
    backdrop-filter: blur(calc(var(--progress) * 10px));
    box-shadow: 0 2px 10px rgba(0, 0, 0, calc(var(--progress) * 0.1));
    
    transition: background-color 100ms, backdrop-filter 100ms, box-shadow 100ms;
}

/* Logo always solid white when over clouds, transitions to brand color */
.logo-text {
    color: color-mix(in srgb, #ffffff calc((1 - var(--progress)) * 100%), #496BC1);
}

/* Nav links start at 0.3 opacity, increase to 1.0 */
.nav-links a {
    opacity: calc(0.3 + var(--progress) * 0.7);
    color: color-mix(in srgb, #ffffff calc((1 - var(--progress)) * 100%), #1a1a2e);
}
```

### 3. Skip Button

**Purpose**: Allows users to bypass cloud animation and jump to main content.

**HTML**:
```html
<button class="skip-to-content-btn" id="skipButton">
    Skip to Content ↓
</button>
```

**CSS**:
```css
.skip-to-content-btn {
    --progress: var(--scroll-progress, 0);
    
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 100;
    
    /* Solid readable text */
    background: rgba(255, 255, 255, 0.9);
    color: #1a1a2e;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    
    /* Fade out as user scrolls */
    opacity: calc(1 - var(--progress));
    pointer-events: calc(1 - var(--progress) > 0.5 ? auto : none);
    
    transition: opacity 200ms, transform 200ms;
}

.skip-to-content-btn:hover {
    transform: translateY(2px);
}
```

**JavaScript**:
```javascript
document.getElementById('skipButton').addEventListener('click', () => {
    window.scrollTo({
        top: scrollController.config.scrollDistance,
        behavior: 'smooth'
    });
});
```

### 4. Cloud Canvas Container

**CSS**:
```css
.cloud-canvas-container {
    --progress: var(--scroll-progress, 0);
    
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1;
    
    /* Fade out as scroll completes */
    opacity: calc(1 - var(--progress));
    pointer-events: none;
}
```

## Data Models

### Scroll State (CSS Custom Property)

```css
:root {
    --scroll-progress: 0; /* 0 = top (clouds visible), 1 = scrolled (site visible) */
}
```

All components read from this single source of truth.

### Renderer State

```javascript
{
    isInitialized: boolean,
    isAnimating: boolean,
    scrollProgress: number,  // Mirrors CSS --scroll-progress
    camera: THREE.PerspectiveCamera,
    cloudMaterial: THREE.ShaderMaterial
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Single App Bar Element

*For any* page load, the DOM SHALL contain exactly one element with the app-bar class.

**Validates: Requirements 2.1, 5.1**

### Property 2: Logo Always Solid

*For any* scroll progress value (0 to 1), the logo text opacity SHALL always be 1.0 (fully visible).

**Validates: Requirements 2.3, 6.4**

### Property 3: Nav Opacity Interpolation

*For any* scroll progress value p (0 to 1), the navigation link opacity SHALL equal 0.3 + (p × 0.7), within a tolerance of 0.05.

**Validates: Requirements 2.4, 2.5**

### Property 4: Skip Button Visibility Inverse to Progress

*For any* scroll progress value p, the skip button opacity SHALL equal (1 - p), meaning fully visible at p=0 and hidden at p=1.

**Validates: Requirements 3.1, 3.4**

### Property 5: Camera Position Updates with Scroll

*For any* two scroll progress values where p2 > p1, the camera z-position at p2 SHALL be less than (closer to text) the camera z-position at p1.

**Validates: Requirements 4.1**

### Property 6: Cloud Canvas Opacity Inverse to Progress

*For any* scroll progress value p, the cloud canvas container opacity SHALL equal (1 - p), meaning fully visible at p=0 and faded at p=1.

**Validates: Requirements 4.2, 4.4**

### Property 7: App Bar Background Interpolation

*For any* scroll progress value p, the app bar background alpha SHALL equal (p × 0.95), meaning transparent at p=0 and nearly opaque at p=1.

**Validates: Requirements 4.5**

## Error Handling

### WebGL Not Supported

```javascript
if (!this.checkWebGLSupport()) {
    console.error('WebGL not supported');
    document.documentElement.style.setProperty('--scroll-progress', '1');
    // This immediately shows site mode, hiding cloud canvas
}
```

### Texture Loading Failures

- Use fallback procedurally generated textures (existing implementation)
- Log warning but continue rendering

### Scroll Controller Errors

- Wrap scroll handler in try-catch
- Log errors but don't break page functionality

## Testing Strategy

### Unit Testing

**Framework**: Vitest

**Test Coverage**:

1. **ScrollController Tests**
   - Test progress calculation for various scroll positions
   - Test CSS custom property is set correctly
   - Test skipToContent() scrolls to correct position

2. **App Bar Style Tests**
   - Test that only one app-bar element exists
   - Test logo opacity is always 1
   - Test nav opacity matches formula

### Property-Based Testing

**Framework**: fast-check

**Configuration**: Minimum 100 iterations per property test.

**Property Tests**:

1. **Property Test: Single App Bar**
   - **Feature: cloud-hero-appbar-refactor, Property 1: Single App Bar Element**
   - Generate: Various DOM states
   - Assert: document.querySelectorAll('.app-bar').length === 1

2. **Property Test: Logo Opacity**
   - **Feature: cloud-hero-appbar-refactor, Property 2: Logo Always Solid**
   - Generate: Random scroll progress values (0 to 1)
   - Assert: Logo computed opacity === 1

3. **Property Test: Nav Opacity Formula**
   - **Feature: cloud-hero-appbar-refactor, Property 3: Nav Opacity Interpolation**
   - Generate: Random scroll progress values (0 to 1)
   - Assert: |navOpacity - (0.3 + progress * 0.7)| < 0.05

4. **Property Test: Skip Button Visibility**
   - **Feature: cloud-hero-appbar-refactor, Property 4: Skip Button Visibility Inverse to Progress**
   - Generate: Random scroll progress values (0 to 1)
   - Assert: |skipButtonOpacity - (1 - progress)| < 0.05

5. **Property Test: Camera Movement**
   - **Feature: cloud-hero-appbar-refactor, Property 5: Camera Position Updates with Scroll**
   - Generate: Pairs of progress values (p1, p2) where p2 > p1
   - Assert: camera.position.z at p2 < camera.position.z at p1

6. **Property Test: Canvas Opacity**
   - **Feature: cloud-hero-appbar-refactor, Property 6: Cloud Canvas Opacity Inverse to Progress**
   - Generate: Random scroll progress values (0 to 1)
   - Assert: |canvasOpacity - (1 - progress)| < 0.05

7. **Property Test: App Bar Background**
   - **Feature: cloud-hero-appbar-refactor, Property 7: App Bar Background Interpolation**
   - Generate: Random scroll progress values (0 to 1)
   - Assert: |backgroundAlpha - (progress * 0.95)| < 0.05

### Integration Testing

1. **Full Scroll Journey**
   - Load page, verify clouds visible
   - Scroll to 100%, verify site visible
   - Scroll back, verify clouds return

2. **Skip Button**
   - Click skip button
   - Verify smooth scroll to content
   - Verify skip button fades out

3. **Mobile Menu**
   - Test hamburger menu on mobile viewport
   - Verify menu opens/closes correctly

## Implementation Notes

### CSS Custom Properties Browser Support

CSS custom properties are supported in all modern browsers. For older browsers, provide fallback:

```css
.app-bar {
    /* Fallback for browsers without custom property support */
    background-color: rgba(255, 255, 255, 0.95);
}

@supports (--css: variables) {
    .app-bar {
        background-color: rgba(255, 255, 255, calc(var(--scroll-progress, 0) * 0.95));
    }
}
```

### color-mix() Browser Support

`color-mix()` is supported in modern browsers but may need fallback:

```css
.logo-text {
    /* Fallback */
    color: #ffffff;
}

@supports (color: color-mix(in srgb, red, blue)) {
    .logo-text {
        color: color-mix(in srgb, #ffffff calc((1 - var(--scroll-progress, 0)) * 100%), #496BC1);
    }
}
```

### Performance Considerations

1. **CSS Custom Properties** - More performant than JavaScript style updates
2. **Passive Scroll Listeners** - Use `{ passive: true }` for scroll events
3. **requestAnimationFrame Throttling** - Already implemented in ScrollController
4. **will-change** - Use sparingly, remove after transitions

### Files to Modify

1. `assets/css/app-bar.css` - Simplify to use CSS custom properties
2. `assets/css/shadertoy-clouds.css` - Add skip button styles, update canvas opacity
3. `layouts/partials/header.html` - Ensure single app bar, remove any duplication
4. `layouts/home.html` - Add skip button, simplify initialization
5. `assets/js/shadertoy-clouds/scroll-controller.js` - Update to set CSS custom properties
6. `assets/js/app-bar-manager.js` - Simplify or remove (CSS handles transitions now)
