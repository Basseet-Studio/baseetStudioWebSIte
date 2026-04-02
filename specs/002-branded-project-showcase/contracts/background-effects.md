# Contract: Background Effect System (layouts/partials/shared/clouds-background.html)

**Purpose**: Conditionally load the correct background effect renderer based on page context.

## Interface

The partial receives the standard Hugo page context (`.`) and determines which background to render.

## Decision Logic

```
IF .Page.Params.project.bgEffect exists
  → Load product-specific background renderer JS
  → Apply product-specific fallback gradient
ELSE
  → Load default clouds renderer (existing behavior)
  → Apply default sky/cloud fallback gradient
```

## HTML Structure (unchanged from current)

```html
<div id="clouds-background" class="clouds-global-bg"
     data-bg-effect="{{ .Page.Params.project.bgEffect | default "clouds" }}"
     data-disable-mobile="{{ data-disable-mobile-value }}"
     style="--bg-fallback: {{ fallback-gradient }}">
  <canvas id="clouds-canvas"></canvas>
</div>
```

## JS Loading Contract

Each renderer MUST be loaded as a separate Hugo resource with fingerprinting:

```
{{ $bgEffect := .Page.Params.project.bgEffect | default "clouds" }}
{{ if eq $bgEffect "leaves" }}
  {{ $js := resources.Get "js/leaves.js" | ... }}
{{ else if eq $bgEffect "paper-notes" }}
  {{ $js := resources.Get "js/paper-notes.js" | ... }}
{{ else if eq $bgEffect "kitchen" }}
  {{ $js := resources.Get "js/kitchen.js" | ... }}
{{ else if eq $bgEffect "shopping" }}
  {{ $js := resources.Get "js/shopping.js" | ... }}
{{ else if eq $bgEffect "grid" }}
  {{ $js := resources.Get "js/grid.js" | ... }}
{{ else }}
  {{ $js := resources.Get "js/clouds.js" | ... }}
{{ end }}
```

## Renderer Class Contract

Each background renderer MUST implement this interface:

```javascript
class <Effect>Renderer {
  constructor(canvas) {
    // Create WebGL context
    // Compile shaders
    // Setup uniforms
  }

  init() {
    // Setup geometry (fullscreen quad)
    // Cache uniform locations
    // Call setupEventListeners()
    // Call resize()
  }

  setupEventListeners() {
    // Mouse/touch movement → this.mouseX, this.mouseY (0-1)
    // Scroll position → this.scrollY (0-1)
    // Resize → this.resize()
    // Visibility change → pause on hidden, resume on visible
  }

  resize() {
    // Set canvas dimensions at SCALE factor (0.5 default)
    // Update viewport
  }

  render() {
    // Update uniform values (time, resolution, mouse, scroll)
    // gl.drawArrays()
    // requestAnimationFrame(this.render)
  }

  start() { this.isRunning = true; this.render(); }
  pause() { this.isRunning = false; cancelAnimationFrame(this.animationId); }
  destroy() { this.pause(); /* cleanup */ }
}
```

## CSS Fallback Contract

Each effect MUST have a CSS fallback gradient when WebGL is unavailable:

```css
.clouds-global-bg.fallback-<effect> {
  background: var(--bg-fallback);
}

@media (prefers-reduced-motion: reduce) {
  .clouds-global-bg canvas { display: none; }
  .clouds-global-bg { background: var(--bg-fallback); }
}
```

## Performance Contract

- Render at ≤0.5x native resolution
- Max 50 iteration steps per frame
- Auto-pause when tab/page not visible
- Antialias disabled
- No texture loading (procedural only)
- Target: 30+ fps on mid-range mobile
