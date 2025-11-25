# Implementation Plan

- [-] 1. Fix cloud rendering issues
  - [-] 1.1 Debug why clouds stopped rendering by checking browser console for errors
    - Check for WebGL errors, texture loading failures, shader compilation issues
    - Verify Three.js is loading correctly from CDN
    - _Requirements: 1.1, 1.4, 1.5_
  - [ ] 1.2 Fix any identified rendering issues in shadertoy-cloud-renderer.js
    - Ensure canvas is properly sized and visible
    - Verify shader uniforms are being set correctly
    - _Requirements: 1.1, 1.2_
  - [ ] 1.3 Write property test for camera position updates with scroll
    - **Property 5: Camera Position Updates with Scroll**
    - **Validates: Requirements 4.1**

- [ ] 2. Refactor app bar CSS to use CSS custom properties
  - [ ] 2.1 Update app-bar.css to use --scroll-progress variable
    - Remove .app-bar-cloud and .app-bar-site classes
    - Use calc() with --scroll-progress for background, opacity, colors
    - Add fallbacks for older browsers
    - _Requirements: 2.1, 4.5, 5.1_
  - [ ] 2.2 Ensure logo stays solid white over clouds, transitions to brand color
    - Logo opacity always 1, color interpolates based on progress
    - _Requirements: 2.3, 6.4_
  - [ ] 2.3 Implement progressive nav link opacity (0.3 → 1.0)
    - Nav links start at 0.3 opacity, increase to 1.0 as scroll progress increases
    - _Requirements: 2.4, 2.5_
  - [ ] 2.4 Write property test for nav opacity interpolation
    - **Property 3: Nav Opacity Interpolation**
    - **Validates: Requirements 2.4, 2.5**
  - [ ] 2.5 Write property test for logo always solid
    - **Property 2: Logo Always Solid**
    - **Validates: Requirements 2.3, 6.4**

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Add skip button component
  - [ ] 4.1 Add skip button HTML to home.html layout
    - Position fixed, bottom-right corner
    - Solid white background, dark text, readable
    - _Requirements: 3.1, 3.2_
  - [ ] 4.2 Add skip button CSS styles to shadertoy-clouds.css
    - Opacity based on --scroll-progress (1 - progress)
    - Hover and focus states
    - _Requirements: 3.1, 3.2, 3.4_
  - [ ] 4.3 Add skip button click handler in home.html script
    - Smooth scroll to main content on click
    - _Requirements: 3.3, 3.5_
  - [ ] 4.4 Write property test for skip button visibility
    - **Property 4: Skip Button Visibility Inverse to Progress**
    - **Validates: Requirements 3.1, 3.4**

- [ ] 5. Refactor scroll controller to use CSS custom properties
  - [ ] 5.1 Update scroll-controller.js to set --scroll-progress on document root
    - Remove event dispatching for mode changes
    - Set document.documentElement.style.setProperty('--scroll-progress', progress)
    - _Requirements: 5.2_
  - [ ] 5.2 Add skipToContent() method to scroll controller
    - Programmatically scroll to scrollDistance position
    - _Requirements: 3.3_
  - [ ] 5.3 Write property test for single app bar element
    - **Property 1: Single App Bar Element**
    - **Validates: Requirements 2.1, 5.1**

- [ ] 6. Update cloud canvas CSS for fade transition
  - [ ] 6.1 Update shadertoy-clouds.css to use --scroll-progress for canvas opacity
    - Canvas opacity = 1 - progress
    - Remove .fade-out class logic, use CSS variable instead
    - _Requirements: 4.2, 4.4_
  - [ ] 6.2 Write property test for cloud canvas opacity
    - **Property 6: Cloud Canvas Opacity Inverse to Progress**
    - **Validates: Requirements 4.2, 4.4**

- [ ] 7. Simplify home.html template
  - [ ] 7.1 Remove duplicate app bar handling code
    - Remove handleTransitionComplete/handleTransitionReset functions
    - Remove class toggling for revealing/loaded states
    - Let CSS handle all transitions via --scroll-progress
    - _Requirements: 5.1, 5.3_
  - [ ] 7.2 Simplify cloud system initialization
    - Remove app bar mode switching logic
    - Keep only renderer init, scroll controller, and skip button handler
    - _Requirements: 5.3, 5.4_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Clean up and remove unused code
  - [ ] 9.1 Simplify or remove app-bar-manager.js
    - CSS now handles transitions, manager may not be needed
    - Keep only mobile menu toggle functionality if needed
    - _Requirements: 5.1_
  - [ ] 9.2 Remove unused CSS classes from app-bar.css
    - Remove .app-bar-cloud, .app-bar-site if no longer used
    - Remove any duplicate or dead code
    - _Requirements: 5.1_
  - [ ] 9.3 Verify header.html partial has single app bar
    - Ensure no duplicate app bar elements
    - _Requirements: 2.1, 5.1_

- [ ] 10. Add accessibility features
  - [ ] 10.1 Ensure skip button is keyboard accessible
    - Add proper tabindex, focus styles
    - _Requirements: 3.5, 6.2_
  - [ ] 10.2 Add ARIA labels to cloud canvas and skip button
    - aria-label on canvas, skip button
    - _Requirements: 6.3_
  - [ ] 10.3 Verify reduced motion preference is respected
    - Check prefersReducedMotion detection works
    - _Requirements: 6.1_

- [ ] 11. Write property test for app bar background interpolation
  - **Property 7: App Bar Background Interpolation**
  - **Validates: Requirements 4.5**

- [ ] 12. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
