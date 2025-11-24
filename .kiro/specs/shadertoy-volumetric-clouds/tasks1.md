# Implementation Plan

- [x] 1. Clean up old cloud implementation
  - Delete all existing volumetric-clouds JavaScript files
  - Delete old cloud CSS files
  - Remove old cloud references from home.html template
  - Move iChannel texture files from root to static/textures directory
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2. Create texture loading system
  - [x] 2.1 Implement TextureLoader class for iChannel textures
    - Create texture-loader.js with async texture loading
    - Configure textures with proper wrapping and filtering
    - Handle texture loading errors with fallbacks
    - _Requirements: 5.3, 1.5_

  - [x] 2.2 Write unit tests for texture loading
    - Test texture loader requests correct URLs
    - Test texture configuration settings
    - Test error handling for missing textures
    - _Requirements: 5.3_

- [x] 3. Convert Shadertoy shaders to Three.js
  - [x] 3.1 Create shadertoy-shaders.js with vertex and fragment shaders
    - Implement vertex shader with vUv and world position
    - Convert Shadertoy fragment shader to Three.js GLSL
    - Map Shadertoy variables (iTime, iResolution, iMouse, fragCoord) to Three.js uniforms
    - Implement noise() function using uChannel0 texture
    - Implement map5/map4/map3/map2 cloud density functions
    - Implement raymarch() function with LOD support
    - Implement render() function for sky, clouds, and sun glare
    - _Requirements: 5.1, 5.2, 5.5, 1.1, 1.2_

  - [x] 3.2 Write property test for shader uniform updates
    - **Property 7: All required uniforms are set before rendering**
    - **Validates: Requirements 5.4**

  - [x] 3.3 Write unit tests for shader compilation
    - Test shader source contains required uniforms
    - Test shader compiles without errors
    - Test Shadertoy variable conversion
    - _Requirements: 5.1, 5.2_

- [x] 4. Implement 3D text rendering
  - [x] 4.1 Create text-renderer.js module
    - Implement font loading with THREE.FontLoader
    - Create TextGeometry for "BASEET STUDIO"
    - Configure MeshStandardMaterial with emissive properties
    - Position text mesh in cloud volume (z = -8)
    - Center text geometry
    - _Requirements: 1.3, 6.1, 6.2_

  - [x] 4.2 Write unit tests for text rendering
    - Test text mesh creation
    - Test text positioning
    - Test font loading error handling
    - _Requirements: 6.1, 6.2_

- [x] 5. Create main ShadertoyCloudRenderer class
  - [x] 5.1 Implement constructor and initialization
    - Set up Three.js scene, camera, renderer
    - Detect mobile devices and configure quality settings
    - Check WebGL support with fallback handling
    - Initialize state variables (isAnimating, scrollProgress, etc.)
    - _Requirements: 1.1, 3.1, 3.5_

  - [x] 5.2 Implement async init() method
    - Load iChannel textures using TextureLoader
    - Create shader material with Shadertoy shaders
    - Load and create 3D text mesh
    - Set up scene lighting (directional light for text)
    - Create cloud plane/volume mesh with shader material
    - Configure renderer settings (alpha, antialias, pixel ratio)
    - _Requirements: 1.1, 1.5, 6.1_

  - [x] 5.3 Implement animation loop
    - Create animate() method with requestAnimationFrame
    - Update time uniform on each frame
    - Render scene with camera
    - Handle animation start/stop
    - _Requirements: 1.4_

  - [x] 5.4 Write property test for time monotonicity
    - **Property 1: Time uniform increases monotonically during animation**
    - **Validates: Requirements 1.4**

  - [x] 5.5 Write unit tests for initialization
    - Test constructor creates Three.js objects
    - Test WebGL support detection
    - Test mobile device detection
    - Test init() loads textures and creates scene
    - _Requirements: 1.1, 3.1, 3.5_

- [x] 6. Implement scroll-based camera control
  - [x] 6.1 Implement updateScroll(progress) method
    - Calculate camera position based on scroll progress (0-1)
    - Interpolate camera z-position from 15 (far) to 2 (near)
    - Update uScroll shader uniform
    - Store scroll progress in state
    - _Requirements: 2.1, 2.2_

  - [x] 6.2 Implement isComplete() and reset() methods
    - isComplete() returns true when scrollProgress >= 1.0
    - reset() returns camera to initial position and resets state
    - _Requirements: 2.3, 2.5_

  - [x] 6.3 Write property test for scroll updates camera
    - **Property 2: Scroll progress updates camera position**
    - **Validates: Requirements 2.1**

  - [x] 6.4 Write property test for camera distance decreases
    - **Property 3: Camera distance to text decreases with scroll progress**
    - **Validates: Requirements 2.2**

  - [x] 6.5 Write property test for backwards scroll
    - **Property 4: Scroll backwards moves camera backwards**
    - **Validates: Requirements 2.4**

  - [x] 6.6 Write property test for text size increases
    - **Property 8: Text size increases with scroll progress**
    - **Validates: Requirements 6.4**

  - [x] 6.7 Write unit tests for scroll methods
    - Test updateScroll() with various progress values
    - Test isComplete() returns correct boolean
    - Test reset() returns to initial state
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 7. Implement lifecycle and event handling
  - [x] 7.1 Implement visibility change handling
    - Add visibilitychange event listener
    - Pause animation when tab is hidden
    - Resume animation when tab becomes visible
    - _Requirements: 3.2, 3.3_

  - [x] 7.2 Implement window resize handling
    - Add resize event listener
    - Update camera aspect ratio on resize
    - Update renderer size on resize
    - Update uResolution uniform
    - _Requirements: 3.4_

  - [x] 7.3 Implement destroy() method
    - Stop animation loop
    - Remove event listeners
    - Dispose Three.js geometries, materials, textures
    - Dispose renderer
    - Clear object references
    - _Requirements: (cleanup/memory management)_

  - [x] 7.4 Write property test for visibility toggle
    - **Property 5: Visibility change pauses and resumes animation**
    - **Validates: Requirements 3.2, 3.3**

  - [x] 7.5 Write property test for resize updates
    - **Property 6: Window resize updates canvas and camera**
    - **Validates: Requirements 3.4**

  - [x] 7.6 Write unit tests for lifecycle methods
    - Test start() begins animation
    - Test stop() cancels animation
    - Test destroy() cleans up resources
    - _Requirements: 3.2, 3.3_

- [x] 8. Create scroll controller integration
  - [x] 8.1 Implement ScrollController class
    - Track window.scrollY with throttling
    - Calculate scroll progress (scrollY / scrollDistance)
    - Call renderer.updateScroll() on scroll events
    - Trigger transition callback when complete
    - Handle scroll-back reset (scrollY < 50)
    - Use requestAnimationFrame for throttling
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 8.2 Write unit tests for scroll controller
    - Test scroll progress calculation
    - Test transition trigger at 100%
    - Test reset trigger at top
    - Test throttling behavior
    - _Requirements: 2.1, 2.3, 2.5_

- [x] 9. Implement accessibility features
  - [x] 9.1 Add prefers-reduced-motion support
    - Detect prefers-reduced-motion media query
    - Disable/reduce automatic rotation when active
    - Reduce animation speed when active
    - Keep scroll-based movement enabled
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 9.2 Add ARIA labels and skip link
    - Add aria-label to canvas element
    - Add sr-only description for screen readers
    - Ensure skip link exists and functions
    - _Requirements: 7.4, 7.5_

  - [x] 9.3 Write unit tests for accessibility
    - Test reduced motion detection
    - Test ARIA labels exist
    - Test skip link exists
    - _Requirements: 7.1, 7.4, 7.5_

- [x] 10. Create CSS styling
  - [x] 10.1 Create shadertoy-clouds.css
    - Style canvas container (fixed, full viewport)
    - Style scroll indicator
    - Style main content wrapper with padding-top
    - Add transition classes for fade effects
    - Add reduced motion media query styles
    - _Requirements: (styling/layout)_

- [x] 11. Update home.html template
  - [x] 11.1 Remove old cloud system references
    - Remove old cloud canvas elements
    - Remove old CSS links
    - Remove old script imports
    - _Requirements: 4.3_

  - [x] 11.2 Add new cloud system integration
    - Add new canvas element with proper ID
    - Add new CSS link for shadertoy-clouds.css
    - Add script imports for new modules
    - Add scroll indicator HTML
    - Add skip link for accessibility
    - Initialize ShadertoyCloudRenderer with options
    - Set up scroll controller
    - _Requirements: 1.1, 1.3, 7.4, 7.5_

  - [x] 11.3 Implement transition logic
    - Add revealing class on scroll complete
    - Add loaded class after transition
    - Hide loader and show main content
    - Adjust padding-top to prevent jump
    - _Requirements: 2.3_

- [-] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Integration testing and polish
  - [ ] 13.1 Test full scroll journey
    - Test loading to scroll to transition
    - Test scroll back reset
    - Test on multiple browsers
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [ ] 13.2 Test mobile experience
    - Test on mobile viewport
    - Verify reduced quality settings
    - Verify acceptable performance
    - _Requirements: 3.1_

  - [ ] 13.3 Test accessibility features
    - Test with prefers-reduced-motion
    - Test keyboard navigation
    - Test screen reader announcements
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 13.4 Performance optimization
    - Monitor FPS and frame time
    - Optimize shader if needed
    - Adjust quality settings for mobile
    - Test memory usage
    - _Requirements: 3.1_

- [ ] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
