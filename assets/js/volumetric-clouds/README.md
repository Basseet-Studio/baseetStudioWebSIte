# Volumetric Clouds Module

This directory contains the JavaScript modules for the volumetric clouds feature using Three.js.

## Structure

- `noise.js` - 3D Perlin noise generation (ImprovedNoise class and texture generator)
- `shaders.js` - Vertex and fragment shaders for raymarching
- `cloud-renderer.js` - VolumetricCloudRenderer class (Three.js scene management)
- `scroll-manager.js` - ScrollManager class (state machine and scroll behavior)
- `performance-monitor.js` - PerformanceMonitor class (dev-only FPS/memory display)
- `main-cloud.js` - Main entry point that wires up all components

## Hugo Integration

These modules are bundled by Hugo using `js.Build` with ES module format:

```html
{{- $cloudScript := resources.Get "js/volumetric-clouds/main-cloud.js" -}}
{{- $bundle := $cloudScript | js.Build (dict "format" "esm") | minify | fingerprint -}}
<script type="module" src="{{ $bundle.RelPermalink }}"></script>
```

## Dependencies

- Three.js v0.160.0 (installed via npm, bundled by Hugo)
