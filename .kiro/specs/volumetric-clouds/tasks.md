# Implementation Plan

- [x] 1. Set up Three.js dependency and project structure
  - Install Three.js via npm and verify Hugo can bundle it as an ES module
  - Create the base directory structure for JavaScript modules
  - _Requirements: 11.1, 11.2_

- [x] 1.1 Install Three.js package
  - Add Three.js v0.160.0 to package.json dependencies
  - Run npm install and verify node_modules/three exists
  - _Requirements: 11.2_

- [x] 1.2 Verify Hugo module bundling
  - Test that Hugo can import and bundle Three.js using js.Build
  - Ensure ES module format works correctly
  - _Requirements: 11.1, 11.4_

- [x] 2. Implement 3D Perlin noise generation
  - Create the ImprovedNoise class with Perlin noise algorithm
  - Implement the generate3DTexture function with multi-octave noise
  - Verify texture data is correctly formatted for Three.js Data3DTexture
  - _Requirements: 1.1, 7.1, 7.2_

- [x] 2.1 Create ImprovedNoise class
  - Implement noise(), fade(), lerp(), and grad() methods
  - Initialize permutation table with 512 elements
  - _Requirements: 1.1_

- [x] 2.2 Implement 3D texture generator
  - Create generate3DTexture function that produces 128³ or 64³ voxel data
  - Apply 4-octave Perlin noise with proper scaling
  - Return Three.js Data3DTexture with RedFormat
  - _Requirements: 1.1, 1.5, 1.6_

- [x] 3. Create raymarching shader system
  - Write vertex shader that calculates ray origin and direction
  - Write fragment shader that implements raymarching algorithm with box intersection
  - Define shader uniforms for texture, threshold, opacity, and steps
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3.1 Implement vertex shader
  - Calculate vOrigin (camera position in object space)
  - Calculate vDirection (ray direction from camera to vertex)
  - Pass varyings to fragment shader
  - _Requirements: 1.1_

- [x] 3.2 Implement fragment shader
  - Implement hitBox function for ray-box intersection
  - Implement raymarching loop with configurable steps
  - Sample 3D texture along ray and accumulate color/opacity
  - Apply smoothstep for soft cloud edges
  - _Requirements: 1.2, 1.3, 7.1, 7.2_

- [x] 4. Build VolumetricCloudRenderer class
  - Create the main renderer class that initializes Three.js scene, camera, and renderer
  - Implement WebGL support detection with fallback logic
  - Set up cloud mesh with shader material
  - Implement animation loop with rotation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 8.5, 14.1, 14.6_

- [x] 4.1 Implement constructor and initialization
  - Accept containerId and options parameters
  - Detect mobile devices and adjust config accordingly
  - Call init() method to set up scene
  - _Requirements: 1.5, 1.6, 7.1, 7.2, 7.3, 7.4_

- [x] 4.2 Implement WebGL detection
  - Create checkWebGLSupport() method
  - Handle fallback by hiding canvas and adding css-clouds-fallback class
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [x] 4.3 Set up Three.js scene
  - Initialize Scene, PerspectiveCamera, and WebGLRenderer
  - Configure renderer with alpha, antialias, and power preference
  - Set pixel ratio based on device type
  - _Requirements: 1.1, 7.3, 7.4, 14.6_

- [x] 4.4 Create cloud mesh with shaders
  - Generate 3D Perlin noise texture
  - Create BoxGeometry and ShaderMaterial
  - Configure material with vertex/fragment shaders and uniforms
  - Add mesh to scene
  - _Requirements: 1.1, 14.1_

- [x] 4.5 Implement animation loop
  - Create animate() method using requestAnimationFrame
  - Apply gentle rotation to cloud mesh
  - Render scene with camera
  - _Requirements: 1.4_

- [x] 4.6 Implement visibility and lifecycle methods
  - Create setVisibility() method to control opacity and animation
  - Create startAnimation() and stopAnimation() methods
  - Implement onResize() for window resize handling
  - Create destroy() method for cleanup
  - _Requirements: 7.5, 7.6, 7.7, 14.2, 14.3_

- [x] 4.7 Add visibility change listener
  - Pause animation when tab is hidden
  - Resume animation when tab becomes visible and in CLOUD_MODE
  - _Requirements: 7.5, 7.6_

- [x] 5. Implement ScrollManager state machine
  - Create ScrollManager class with state machine (CLOUD_MODE, TRANSITIONING, SITE_MODE)
  - Implement scroll event handlers with accumulation logic
  - Implement stagger delay mechanism for scroll-up
  - Add transition methods that coordinate with CloudRenderer
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [x] 5.1 Create ScrollManager constructor and initialization
  - Accept cloudRenderer parameter
  - Initialize state to CLOUD_MODE
  - Set up configuration (scrollThreshold, staggerDelay, transitionDuration)
  - Apply overscroll-behavior to prevent page bounce
  - Add cloud-mode class to body
  - _Requirements: 2.5, 13.1_

- [x] 5.2 Implement wheel event handler
  - Create onWheel() method that detects scroll direction
  - Prevent events during TRANSITIONING state
  - Track scroll direction and reset accumulator on direction change
  - Route to handleCloudMode() or handleSiteMode() based on state
  - _Requirements: 3.1, 13.2, 13.3_

- [x] 5.3 Implement CLOUD_MODE scroll handling
  - Create handleCloudMode() method
  - Accumulate downward scroll distance
  - Update scroll indicator with progress
  - Trigger transitionToSite() when threshold reached
  - Prevent upward scroll from exiting cloud mode
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 5.4 Implement SITE_MODE scroll handling
  - Create handleSiteMode() method
  - Detect when at top of page (scrollY === 0)
  - Start stagger delay timer on upward scroll at top
  - Trigger transitionToCloud() after 300ms of continuous upward scroll
  - Reset timer if user stops or scrolls down
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5.5 Implement transition to site
  - Create transitionToSite() method
  - Set state to TRANSITIONING
  - Fade out clouds via cloudRenderer.setVisibility(false)
  - Update body classes (remove cloud-mode, add site-mode)
  - Enable body overflow after transition duration
  - Set state to SITE_MODE and scroll to 1px
  - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 13.4, 13.5_

- [x] 5.6 Implement transition to cloud
  - Create transitionToCloud() method
  - Set state to TRANSITIONING
  - Scroll to top smoothly
  - Fade in clouds via cloudRenderer.setVisibility(true)
  - Update body classes (remove site-mode, add cloud-mode)
  - Disable body overflow
  - Set state to CLOUD_MODE
  - _Requirements: 4.5, 4.6, 13.4, 13.5_

- [x] 5.7 Implement scroll indicator updates
  - Create updateScrollIndicator() method
  - Update indicator width based on progress (0-1)
  - Control indicator opacity
  - _Requirements: 3.2, 4.2_

- [x] 6. Add touch support for mobile devices
  - Implement touch event handlers (touchstart, touchmove)
  - Calculate touch delta and apply same logic as wheel events
  - Support swipe gestures for transitions
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6.1 Implement touch start handler
  - Create onTouchStart() method
  - Record initial touch Y coordinate and timestamp
  - _Requirements: 5.1_

- [x] 6.2 Implement touch move handler
  - Create onTouchMove() method
  - Calculate touch delta from initial position
  - Apply same accumulation and threshold logic as wheel events
  - Handle CLOUD_MODE and SITE_MODE touch gestures
  - Prevent default during TRANSITIONING
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [x] 7. Implement keyboard navigation
  - Add keydown event listener
  - Handle Arrow Down, Page Down, and Space to transition to site
  - Handle Arrow Up at top to transition to clouds
  - Prevent default for handled keys
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7.1 Create keyboard event handler
  - Create onKeyDown() method
  - Detect Arrow Down, Page Down, Space in CLOUD_MODE
  - Detect Arrow Up at scrollY === 0 in SITE_MODE
  - Trigger appropriate transitions
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8. Create main initialization module
  - Create main-cloud.js entry point
  - Check for reduced motion preference
  - Initialize VolumetricCloudRenderer with configuration
  - Initialize ScrollManager
  - Wire up components on DOMContentLoaded
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 15.1, 15.2_

- [x] 8.1 Implement reduced motion check
  - Query prefers-reduced-motion media feature
  - Apply css-clouds-fallback class if preference is set
  - Skip Three.js initialization when reduced motion preferred
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 8.2 Initialize components
  - Wait for DOMContentLoaded event
  - Create VolumetricCloudRenderer instance with options
  - Create ScrollManager instance with cloudRenderer
  - Expose to window object on localhost for debugging
  - _Requirements: 15.1, 15.2_

- [x] 9. Create CSS for cloud canvas and transitions
  - Create volumetric-cloud-scroll.css file
  - Style cloud-canvas-container with fixed positioning and z-index
  - Define cloud-mode, transitioning, and site-mode body classes
  - Add transition animations with cubic-bezier easing
  - Style scroll progress indicator
  - Add responsive styles for mobile
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.3, 3.4, 3.5, 3.6, 4.5, 4.6, 13.5_

- [x] 9.1 Style cloud canvas container
  - Position fixed at top-left with 100vw/100vh dimensions
  - Set z-index to 100
  - Add opacity transition (600ms cubic-bezier)
  - Disable pointer events
  - _Requirements: 2.1, 13.5_

- [x] 9.2 Define body state classes
  - cloud-mode: overflow hidden, site-content hidden
  - transitioning: transition animations active
  - site-mode: overflow auto, cloud-canvas hidden, site-content visible
  - _Requirements: 2.2, 2.3, 2.4, 3.4, 3.5, 3.6, 4.6_

- [x] 9.3 Style scroll progress indicator
  - Fixed position at bottom center
  - Width bar with background and progress fill
  - Opacity transition based on progress
  - _Requirements: 3.2, 4.2_

- [x] 9.4 Add accessibility styles
  - Screen reader only class (sr-only)
  - Ensure proper focus visibility
  - _Requirements: 10.3_

- [x] 9.5 Add responsive mobile styles
  - Adjust indicator size for mobile
  - Optimize for smaller screens
  - _Requirements: 7.1, 7.2_

- [x] 9.6 Add reduced motion styles
  - Hide cloud canvas when prefers-reduced-motion is set
  - Show CSS fallback if available
  - _Requirements: 9.5_

- [x] 10. Update Hugo home template
  - Add volumetric-cloud-canvas div to layouts/home.html
  - Add scroll-indicator div
  - Include ARIA labels for accessibility
  - Load bundled JavaScript module
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 11.3, 11.4_

- [x] 10.1 Add cloud canvas container
  - Insert div with id "volumetric-cloud-canvas"
  - Add role="img" and aria-label attributes
  - Include sr-only span with descriptive text
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 11.3_

- [x] 10.2 Add scroll indicator
  - Insert div with id "scroll-indicator"
  - Position for visual feedback
  - _Requirements: 3.2, 4.2_

- [x] 10.3 Load JavaScript module
  - Use Hugo resources.Get to load main-cloud.js
  - Apply js.Build with esm format
  - Add script tag with type="module"
  - _Requirements: 11.1, 11.4_

- [-] 11. Link CSS in Hugo templates
  - Add link tag for volumetric-cloud-scroll.css
  - Ensure CSS loads before JavaScript
  - Apply fingerprinting for cache busting
  - _Requirements: 11.6_

- [-] 11.1 Add CSS link to head
  - Insert link tag in layouts/partials/head.html or baseof.html
  - Use relURL for proper path resolution
  - _Requirements: 11.6_

- [ ] 12. Implement performance monitoring for development
  - Create PerformanceMonitor class
  - Display FPS and memory usage in fixed panel
  - Only activate on localhost
  - _Requirements: 15.3, 15.4, 15.5_

- [ ] 12.1 Create PerformanceMonitor class
  - Track FPS using requestAnimationFrame
  - Display memory usage if available
  - Create fixed position panel for display
  - _Requirements: 15.3, 15.4_

- [ ] 12.2 Integrate with main-cloud.js
  - Initialize PerformanceMonitor only on localhost
  - Ensure it doesn't affect production builds
  - _Requirements: 15.5_

- [ ] 13. Test and verify WebGL fallback
  - Verify checkWebGLSupport() correctly detects WebGL
  - Test fallback behavior in browsers without WebGL
  - Ensure css-clouds-fallback class is applied
  - Confirm no console errors when WebGL unavailable
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 12.5_

- [ ] 13.1 Test WebGL detection
  - Verify detection works in supported browsers
  - Test with WebGL disabled in browser settings
  - _Requirements: 8.1, 8.5_

- [ ] 13.2 Verify fallback behavior
  - Confirm canvas is hidden when WebGL unavailable
  - Verify css-clouds-fallback class is added
  - Check that ScrollManager initializes in SITE_MODE
  - _Requirements: 8.2, 8.3, 8.4_

- [ ] 13.3 Check console output
  - Ensure appropriate warnings are logged
  - Verify no errors occur during fallback
  - _Requirements: 12.5, 15.6_

- [x] 14. Test scroll behavior across devices
  - Test scroll down transition (150px threshold)
  - Test scroll up with stagger delay (300ms)
  - Verify quick scroll up does NOT return to clouds
  - Test touch gestures on mobile devices
  - Test keyboard navigation
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4_

- [x] 14.1 Test desktop scroll behavior
  - Verify scroll down accumulation and transition
  - Verify scroll up stagger delay works correctly
  - Test that quick scroll up is ignored
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

- [x] 14.2 Test mobile touch behavior
  - Verify swipe up transitions to site
  - Verify swipe down at top returns to clouds after delay
  - Test on real mobile devices (iOS and Android)
  - _Requirements: 5.2, 5.3, 5.4_

- [x] 14.3 Test keyboard navigation
  - Verify Arrow Down, Page Down, Space work in CLOUD_MODE
  - Verify Arrow Up works at top in SITE_MODE
  - Ensure no keyboard traps
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 15. Test accessibility features
  - Verify reduced motion preference is respected
  - Test keyboard navigation completeness
  - Verify ARIA labels with screen reader
  - Check focus management
  - Run axe-core accessibility audit
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 15.1 Test reduced motion
  - Enable prefers-reduced-motion in browser/OS
  - Verify Three.js is not initialized
  - Confirm CSS fallback is used
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 15.2 Test screen reader compatibility
  - Use VoiceOver (macOS) or NVDA (Windows)
  - Verify cloud canvas is announced correctly
  - Check that site content is accessible
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 15.3 Run accessibility audit
  - Use Chrome DevTools Lighthouse
  - Run axe-core extension
  - Fix any violations found
  - _Requirements: 10.5_

- [ ] 16. Optimize performance for mobile
  - Verify adaptive quality settings (texture size, steps, pixel ratio)
  - Test on mid-range mobile devices
  - Ensure FPS stays above 45
  - Monitor memory usage and thermal throttling
  - _Requirements: 1.2, 1.3, 1.5, 1.6, 7.1, 7.2, 7.3, 7.4, 14.4, 14.5_

- [ ] 16.1 Verify mobile detection and settings
  - Confirm mobile devices use 64³ texture
  - Confirm mobile devices use 50 raymarching steps
  - Confirm pixel ratio is capped at 1.5
  - _Requirements: 1.5, 1.6, 7.1, 7.2, 7.3, 7.4_

- [ ] 16.2 Test on real devices
  - Test on iPhone 12+ (iOS 15+)
  - Test on Samsung Galaxy S21+ (Android 11+)
  - Test on iPad Pro
  - Monitor FPS using PerformanceMonitor
  - _Requirements: 1.2, 1.3_

- [ ] 16.3 Monitor resource usage
  - Check memory usage stays under 150MB
  - Verify no thermal throttling occurs
  - Test battery drain is acceptable
  - _Requirements: 14.4, 14.5_

- [ ] 17. Test browser compatibility
  - Test in Chrome 120+
  - Test in Firefox 120+
  - Test in Safari 16+
  - Test in Edge 120+
  - Test in iOS Safari 15+
  - Test in Chrome Mobile
  - Verify fallback works in older browsers
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 17.1 Test modern browsers
  - Chrome 120+ (desktop and mobile)
  - Firefox 120+ (desktop and mobile)
  - Safari 16+ (desktop and mobile)
  - Edge 120+
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 17.2 Verify no console errors
  - Check console in each browser
  - Ensure no warnings or errors appear
  - _Requirements: 12.6_

- [ ] 17.3 Test fallback in old browsers
  - Test in browsers without WebGL support
  - Verify graceful degradation
  - _Requirements: 12.5_

- [ ] 18. Build and optimize for production
  - Configure Hugo for production build
  - Minify JavaScript and CSS
  - Apply fingerprinting for cache busting
  - Verify bundle sizes meet targets (<200KB gzipped)
  - _Requirements: 11.5_

- [ ] 18.1 Configure Hugo build settings
  - Set minify options in hugo.yaml
  - Enable writeStats for asset optimization
  - Configure production environment
  - _Requirements: 11.5_

- [ ] 18.2 Build production bundle
  - Run hugo --minify --environment production
  - Verify JavaScript is minified and fingerprinted
  - Verify CSS is minified
  - _Requirements: 11.5_

- [ ] 18.3 Check bundle sizes
  - Measure gzipped JavaScript bundle size
  - Ensure total is under 200KB gzipped
  - Optimize if necessary
  - _Requirements: 11.5_

- [ ] 19. Run Lighthouse performance audit
  - Generate Lighthouse report for mobile and desktop
  - Verify Performance score >90
  - Verify Accessibility score 100
  - Check Core Web Vitals (FCP, LCP, TBT, CLS)
  - Fix any issues identified
  - _Requirements: 1.2, 1.3_

- [ ] 19.1 Run Lighthouse audit
  - Open site in Chrome DevTools
  - Generate Lighthouse report for mobile
  - Generate Lighthouse report for desktop
  - _Requirements: 1.2, 1.3_

- [ ] 19.2 Verify scores and metrics
  - Performance: >90
  - Accessibility: 100
  - FCP: <1.5s
  - LCP: <2.5s
  - TBT: <200ms
  - CLS: <0.1
  - _Requirements: 1.2, 1.3_

- [ ] 19.3 Address any issues
  - Fix performance bottlenecks
  - Resolve accessibility violations
  - Optimize as needed
  - _Requirements: 1.2, 1.3_

- [ ] 20. Deploy to production and verify
  - Deploy Hugo build to hosting environment
  - Verify site loads correctly in production
  - Test all functionality on live site
  - Monitor for errors in production
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 20.1 Deploy to hosting
  - Build production bundle
  - Deploy to hosting environment (Netlify, GitHub Pages, etc.)
  - Verify deployment succeeds
  - _Requirements: 11.5_

- [ ] 20.2 Verify production functionality
  - Test clouds render correctly
  - Test scroll behavior works
  - Test on multiple devices and browsers
  - Check for CORS or asset loading errors
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 20.3 Monitor production
  - Check browser console for errors
  - Monitor performance metrics
  - Verify HTTPS works correctly
  - _Requirements: 12.6, 15.6_
