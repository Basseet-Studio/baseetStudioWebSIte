# Implementation Plan

- [x] 1. Set up Three.js dependency and project structure
  - Add Three.js to package.json dependencies
  - Create cloud-renderer.js module in assets/js/
  - Create shader files directory structure if needed
  - _Requirements: 6.2, 6.3_

- [x] 2. Implement CloudRenderer class initialization
  - [x] 2.1 Create CloudRenderer class with constructor
    - Define class structure with containerSelector parameter
    - Initialize instance properties (scene, camera, renderer, material, mesh)
    - Add WebGL availability check method
    - _Requirements: 1.1, 6.1_

  - [x] 2.2 Implement init() method for Three.js setup
    - Create Three.js scene
    - Create orthographic camera with correct bounds
    - Create WebGLRenderer with alpha and antialias settings
    - Set pixel ratio capped at 2x
    - Append canvas to container element
    - _Requirements: 1.1, 4.1, 6.3_

  - [x] 2.3 Write unit tests for initialization
    - Test CloudRenderer constructor stores configuration
    - Test init() creates scene, camera, renderer
    - Test canvas is appended to correct container
    - Test WebGL availability check
    - _Requirements: 1.1, 6.1_

- [x] 3. Implement texture loading system
  - [x] 3.1 Create texture loader with error handling
    - Use THREE.TextureLoader to load noise texture
    - Set texture filtering to LinearFilter
    - Set texture wrapping to RepeatWrapping
    - Implement error handler with fallback texture
    - _Requirements: 1.2, 5.1, 5.4, 5.5_

  - [x] 3.2 Write property test for texture error handling
    - **Property 4: Texture loading error handling**
    - **Validates: Requirements 5.4**

  - [x] 3.3 Write unit tests for texture configuration
    - Test texture loads from correct path
    - Test texture filtering is set to LinearFilter
    - Test fallback texture is created on error
    - _Requirements: 5.1, 5.5_

- [x] 4. Implement GLSL shaders
  - [x] 4.1 Write vertex shader
    - Define vertex shader with position and uv attributes
    - Pass through UV coordinates to fragment shader
    - Transform vertices to clip space
    - Add comments explaining coordinate transformations
    - _Requirements: 1.1, 7.1_

  - [x] 4.2 Write fragment shader - noise and FBM functions
    - Implement 3D noise function with texture sampling
    - Implement FBM function with 6 octaves
    - Add time-based animation to FBM
    - Add comments for noise and FBM functions
    - _Requirements: 1.3, 1.5, 5.2, 5.3, 7.2_

  - [x] 4.3 Write fragment shader - scene and SDF
    - Implement sdSphere function
    - Implement scene function combining SDF with FBM
    - Return negative distance for volumetric rendering
    - Add comments for scene function
    - _Requirements: 1.3, 7.2_

  - [x] 4.4 Write fragment shader - volumetric raymarching loop
    - Define MAX_STEPS constant (100)
    - Define MARCH_SIZE constant (0.08)
    - Implement raymarch function with constant step size
    - Sample density at each step
    - Add comments explaining raymarching algorithm
    - _Requirements: 1.1, 4.2, 7.3_

  - [x] 4.5 Write fragment shader - lighting calculations
    - Implement directional derivative lighting
    - Sample density at current point and offset along sun direction
    - Calculate diffuse lighting value
    - Blend ambient and sun colors based on diffuse
    - Add comments explaining directional derivative technique
    - _Requirements: 2.1, 2.2, 2.3, 7.4_

  - [x] 4.6 Write fragment shader - sky and final compositing
    - Render sky background with vertical gradient
    - Add sun glow effect using dot product
    - Composite clouds with sky using alpha blending
    - Apply color palette (blue-gray sky, orange-yellow sun)
    - _Requirements: 2.4, 2.5, 8.1, 8.2, 8.3_

  - [x] 4.7 Write unit tests for shader structure
    - Test shader code contains noise function
    - Test shader code contains FBM with 6 octaves
    - Test shader code contains MAX_STEPS = 100
    - Test shader code contains directional derivative lighting
    - Test shader code contains correct color constants
    - _Requirements: 1.3, 2.1, 2.3, 4.2, 5.2, 5.3, 8.1, 8.2, 8.3_

- [x] 5. Create shader material and geometry
  - [x] 5.1 Define shader uniforms
    - Create uniforms object with uTime, uResolution, uNoise
    - Set initial values for uniforms
    - Document uniform purposes and ranges
    - _Requirements: 1.1, 7.5_

  - [x] 5.2 Create ShaderMaterial with custom shaders
    - Instantiate THREE.ShaderMaterial
    - Pass vertex and fragment shader code
    - Pass uniforms object
    - Set transparent flag for alpha blending
    - _Requirements: 1.1_

  - [x] 5.3 Create full-screen quad geometry
    - Create THREE.PlaneGeometry with 2x2 dimensions
    - Create THREE.Mesh with geometry and material
    - Add mesh to scene
    - _Requirements: 1.1_

  - [x] 5.4 Write unit tests for material setup
    - Test uniforms are defined correctly
    - Test ShaderMaterial is created with shaders
    - Test mesh is added to scene
    - _Requirements: 1.1_

- [x] 6. Implement animation loop
  - [x] 6.1 Create animate() method
    - Use requestAnimationFrame for frame loop
    - Update uTime uniform with elapsed time
    - Call renderer.render() with scene and camera
    - Store animation frame ID for cancellation
    - _Requirements: 1.5_

  - [x] 6.2 Implement pause() and resume() methods
    - pause() cancels animation frame request
    - resume() restarts animation loop
    - Track animation state (playing/paused)
    - _Requirements: 4.4_

  - [x] 6.3 Write property test for time progression
    - **Property 1: Time uniform progression**
    - **Validates: Requirements 1.5**

  - [x] 6.4 Write property test for animation pause
    - **Property 3: Animation pause on visibility change**
    - **Validates: Requirements 4.4**

- [x] 7. Implement responsive behavior
  - [x] 7.1 Create handleResize() method
    - Get current window dimensions
    - Update renderer size
    - Update uResolution uniform
    - Maintain aspect ratio
    - _Requirements: 4.3_

  - [x] 7.2 Add window resize event listener
    - Listen for window 'resize' event
    - Call handleResize() on resize
    - Use debouncing or throttling for performance
    - _Requirements: 4.3_

  - [x] 7.3 Write property test for resize consistency
    - **Property 2: Viewport resize consistency**
    - **Validates: Requirements 4.3**

- [x] 8. Implement visibility change handling
  - [x] 8.1 Add page visibility event listener
    - Listen for 'visibilitychange' event
    - Call pause() when document.hidden is true
    - Call resume() when document.hidden is false
    - _Requirements: 4.4_

  - [x] 8.2 Write unit tests for visibility handling
    - Test pause() is called when page becomes hidden
    - Test resume() is called when page becomes visible
    - _Requirements: 4.4_

- [x] 9. Implement resource cleanup
  - [x] 9.1 Create dispose() method
    - Dispose geometry
    - Dispose material
    - Dispose texture
    - Dispose renderer
    - Remove event listeners
    - Cancel animation frame
    - _Requirements: 6.5_

  - [x] 9.2 Write unit tests for cleanup
    - Test dispose() removes event listeners
    - Test dispose() cancels animation frame
    - Test dispose() cleans up Three.js resources
    - _Requirements: 6.5_

- [x] 10. Add comprehensive error handling
  - [x] 10.1 Wrap init() in try-catch
    - Catch and log initialization errors
    - Fail gracefully without throwing
    - Validate container element exists
    - Check WebGL support before creating renderer
    - _Requirements: 6.5_

  - [x] 10.2 Add WebGL context loss handlers
    - Listen for 'webglcontextlost' event
    - Prevent default and pause animation
    - Listen for 'webglcontextrestored' event
    - Reinitialize renderer on context restore
    - _Requirements: 6.5_

  - [x] 10.3 Write property test for graceful failure
    - **Property 5: Graceful initialization failure**
    - **Validates: Requirements 6.5**

- [x] 11. Integrate with existing site structure
  - [x] 11.1 Add cloud container to hero section template
    - Edit hero section partial/layout
    - Add div with id="cloud-container"
    - Position absolutely behind content
    - Set appropriate z-index
    - _Requirements: 3.1, 3.3, 3.4, 6.3_

  - [x] 11.2 Add CSS styling for cloud container
    - Position fixed or absolute
    - Set z-index below hero content but above background
    - Ensure full viewport coverage
    - Maintain visibility of AppBar
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 11.3 Initialize CloudRenderer in main JavaScript
    - Import CloudRenderer module
    - Wait for DOMContentLoaded
    - Create CloudRenderer instance with container selector
    - Call init() method
    - Handle initialization errors
    - _Requirements: 6.1, 6.4_

  - [x] 11.4 Write integration tests
    - Test CloudRenderer initializes with real DOM
    - Test canvas is appended to hero section
    - Test z-index layering is correct
    - _Requirements: 6.1, 6.3_

- [ ] 12. Optimize performance
  - [ ] 12.1 Implement pixel ratio capping
    - Cap renderer pixel ratio at 2x
    - Test on high-DPI displays
    - _Requirements: 4.1_

  - [ ] 12.2 Add performance monitoring (optional)
    - Track frame times
    - Calculate rolling average FPS
    - Log performance warnings if FPS drops
    - Consider adaptive quality reduction
    - _Requirements: 4.5_

  - [ ] 12.3 Write performance tests
    - Test pixel ratio is capped at 2x
    - Test animation loop runs efficiently
    - _Requirements: 4.1_

- [ ] 13. Add accessibility features
  - [ ] 13.1 Respect prefers-reduced-motion
    - Check for prefers-reduced-motion media query
    - Slow down or stop animation if user prefers reduced motion
    - _Requirements: 4.4_

  - [ ] 13.2 Ensure text contrast
    - Test hero text readability over clouds
    - Adjust cloud opacity or colors if needed
    - _Requirements: 3.5_

- [ ] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

