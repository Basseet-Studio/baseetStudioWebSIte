# Implementation Plan

- [x] 1. Update ScrollManager with extended stagger delay and custom events
  - Modify scroll-manager.js to increase stagger delay from 300ms to 800ms
  - Add custom event dispatching for app bar synchronization
  - Dispatch events for mode changes and stagger progress
  - _Requirements: 4.2, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 1.1 Update stagger delay configuration
  - Change staggerDelay from 300 to 800 in config object
  - _Requirements: 4.2_

- [x] 1.2 Add custom event dispatching to transitionToSite
  - Dispatch 'transitionStart' event with detail {from: 'cloud', to: 'site'}
  - Dispatch 'siteModeEnter' event after transition completes
  - _Requirements: 9.1, 9.2, 9.4_

- [x] 1.3 Add custom event dispatching to transitionToCloud
  - Dispatch 'transitionStart' event with detail {from: 'site', to: 'cloud'}
  - Dispatch 'cloudModeEnter' event after transition completes
  - _Requirements: 9.1, 9.2, 9.4_

- [x] 1.4 Add stagger progress event dispatching
  - Dispatch 'staggerProgress' event with progress value (0-1) in handleSiteMode
  - Dispatch progress reset event when conditions not met
  - _Requirements: 4.4, 9.3, 9.4_

- [x] 2. Create app bar HTML structure
  - Create layouts/partials/header.html with semantic app bar markup
  - Include logo, navigation links, mobile menu toggle, and progress indicator
  - Add proper ARIA labels and accessibility attributes
  - _Requirements: 1.6, 6.1, 6.2, 6.3, 7.1, 7.2, 7.5, 8.1, 12.1_

- [x] 2.1 Create header partial file
  - Create layouts/partials/header.html
  - Add header element with id="app-bar" and appropriate classes
  - _Requirements: 1.6, 12.1_

- [x] 2.2 Add logo section
  - Add logo link with "Baseet Studio" text
  - Include aria-label for accessibility
  - _Requirements: 7.1, 7.2, 7.5_

- [x] 2.3 Add desktop navigation
  - Add nav element with navigation links
  - Include proper semantic markup and ARIA labels
  - _Requirements: 8.1, 6.1, 6.2, 6.3_

- [x] 2.4 Add mobile menu toggle and menu
  - Add hamburger button with aria-expanded attribute
  - Add mobile menu container with navigation links
  - _Requirements: 14.1, 14.2, 14.3_

- [x] 2.5 Add progress indicator element
  - Add progress indicator div at bottom of app bar
  - Set aria-hidden="true" for decorative element
  - _Requirements: 4.4, 11.1, 11.2_

- [x] 3. Create app bar CSS styles
  - Create static/css/app-bar.css with base, cloud mode, and site mode styles
  - Implement GPU-accelerated transitions using opacity and transform
  - Add progress indicator styles with gradient
  - Add mobile responsive styles
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.4, 10.3, 11.4, 11.5, 12.1, 12.2, 12.3_

- [x] 3.1 Create base app bar styles
  - Fixed positioning at top with z-index 200
  - Base layout with flexbox for logo and navigation
  - Transition properties for opacity, background, and box-shadow
  - _Requirements: 1.6, 10.3, 12.1, 12.2, 12.3_

- [x] 3.2 Create cloud mode styles
  - Opacity 0.3, transparent background, no shadow
  - White text color for logo and links
  - Link opacity 0.8 with hover to 1.0
  - _Requirements: 1.1, 1.2, 1.3, 8.2, 8.3_

- [x] 3.3 Create site mode styles
  - Opacity 1.0, white background with backdrop blur, subtle shadow
  - Brand primary color for logo, dark text for links
  - Full opacity for links with brand color on hover
  - _Requirements: 1.4, 1.5, 2.4, 3.4, 7.4, 8.1, 8.4_

- [x] 3.4 Create transition styles
  - 600ms cubic-bezier transitions for all properties
  - will-change properties for performance
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 3.1, 3.2, 3.3, 3.5, 10.3_

- [x] 3.5 Create progress indicator styles
  - Absolute positioning at bottom, 3px height
  - Gradient background from brand primary to accent
  - Width and opacity transitions
  - _Requirements: 11.1, 11.2, 11.4, 11.5_

- [x] 3.6 Create mobile responsive styles
  - Hide desktop nav, show hamburger on screens < 768px
  - Full-screen mobile menu with slide-in animation
  - Vertical navigation links with adequate touch targets
  - _Requirements: 5.1, 5.2, 5.4, 14.1, 14.2, 14.3, 14.4_

- [x] 3.7 Create accessibility styles
  - Focus indicators for keyboard navigation
  - Ensure contrast ratios meet WCAG 2.1 AA
  - _Requirements: 6.1, 6.4, 6.5_

- [x] 3.8 Create reduced motion styles
  - Disable transitions when prefers-reduced-motion is set
  - Maintain full opacity in both modes for reduced motion
  - _Requirements: 13.1, 13.2, 13.4_

- [x] 4. Create AppBarManager JavaScript class
  - Create assets/js/app-bar-manager.js with AppBarManager class
  - Implement state management for cloud/site modes
  - Add event listeners for scroll manager custom events
  - Implement progress indicator control
  - Implement mobile menu control
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.4, 11.1, 11.2, 11.3, 14.2, 14.3, 14.4, 14.5, 15.1, 15.2, 15.3, 15.4_

- [x] 4.1 Create AppBarManager class structure
  - Define constructor accepting app bar element
  - Initialize state properties (currentMode, isTransitioning, mobileMenuOpen)
  - Bind methods to class instance
  - _Requirements: 15.1, 15.2_

- [x] 4.2 Implement setCloudMode method
  - Remove site mode class, add cloud mode class
  - Update currentMode property
  - Reset progress indicator
  - Close mobile menu if open
  - _Requirements: 9.1, 9.3, 15.3_

- [x] 4.3 Implement setSiteMode method
  - Remove cloud mode class, add site mode class
  - Update currentMode property
  - Reset progress indicator
  - Close mobile menu if open
  - _Requirements: 9.2, 9.3, 15.3_

- [x] 4.4 Implement updateProgress method
  - Update progress indicator width based on progress value (0-1)
  - Show indicator when progress > 0, hide when progress = 0
  - Use smooth CSS transitions
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 4.5 Implement mobile menu methods
  - toggleMobileMenu: Toggle menu open/close state
  - closeMobileMenu: Close menu and reset state
  - Prevent body scroll when menu open
  - Update aria-expanded attribute
  - _Requirements: 14.2, 14.3, 14.4, 14.5_

- [x] 4.6 Add event listeners for scroll manager events
  - Listen for 'cloudModeEnter' and call setCloudMode
  - Listen for 'siteModeEnter' and call setSiteMode
  - Listen for 'staggerProgress' and call updateProgress
  - Wrap in try-catch for error handling
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 4.7 Add event listeners for mobile menu
  - Listen for hamburger button click
  - Listen for clicks outside menu to close
  - Listen for navigation link clicks to close menu
  - _Requirements: 14.2, 14.3, 14.4_

- [x] 4.8 Implement performance optimizations
  - Use requestAnimationFrame for smooth updates
  - Remove will-change when not transitioning
  - Debounce rapid state changes
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 5. Initialize AppBarManager in main-cloud.js
  - Import AppBarManager class
  - Create instance after DOM is ready
  - Initialize in cloud mode
  - Expose to window on localhost for debugging
  - _Requirements: 15.1, 15.5_

- [x] 5.1 Import AppBarManager
  - Add import statement for AppBarManager class
  - _Requirements: 15.1_

- [x] 5.2 Initialize AppBarManager instance
  - Get app bar element by ID
  - Create new AppBarManager instance
  - Call initialization after DOM ready
  - _Requirements: 15.1, 15.2_

- [x] 5.3 Expose to window for debugging
  - Add appBarManager to window object on localhost
  - Log debug message
  - _Requirements: 15.5_

- [x] 6. Integrate app bar into Hugo templates
  - Include header partial in baseof.html or home.html
  - Link app-bar.css stylesheet
  - Ensure app bar loads before volumetric cloud system
  - _Requirements: 1.6, 12.1_

- [x] 6.1 Include header partial
  - Add {{ partial "header.html" . }} to appropriate template
  - Position before main content
  - _Requirements: 1.6_

- [x] 6.2 Link app bar CSS
  - Add link tag for app-bar.css in head
  - Use Hugo asset pipeline with minify and fingerprint
  - _Requirements: 1.6_

- [x] 6.3 Verify load order
  - Ensure app bar CSS loads before JavaScript
  - Ensure app bar initializes before scroll manager
  - _Requirements: 12.1_

- [ ] 7. Test app bar visibility and transitions
  - Verify app bar visible at 30% opacity in cloud mode
  - Verify app bar transitions to 100% opacity in site mode
  - Test color transitions for logo and navigation links
  - Test background and shadow transitions
  - Verify smooth 60fps transitions on desktop
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 10.1_

- [x] 7.1 Test cloud mode styling
  - Verify 30% opacity
  - Verify white text color
  - Verify transparent background
  - Verify no shadow
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 7.2 Test site mode styling
  - Verify 100% opacity
  - Verify brand colors
  - Verify white background with blur
  - Verify subtle shadow
  - _Requirements: 1.4, 1.5, 2.4_

- [x] 7.3 Test transition smoothness
  - Verify 600ms transition duration
  - Verify cubic-bezier easing
  - Monitor FPS during transitions (target: 60fps)
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 3.1, 3.2, 3.3, 3.5, 10.1_

- [ ] 8. Test stagger delay and progress indicator
  - Verify 800ms delay before cloud return triggers
  - Verify progress indicator appears during delay
  - Verify progress indicator animates from 0% to 100%
  - Verify quick scroll up does NOT show indicator
  - Verify indicator hides when scrolling down
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 8.1 Test stagger delay timing
  - Scroll up at top and hold for 800ms
  - Verify cloud transition triggers at 800ms
  - Scroll up briefly and release
  - Verify cloud transition does NOT trigger
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 8.2 Test progress indicator visibility
  - Verify indicator appears when scrolling up at top
  - Verify indicator width increases smoothly
  - Verify indicator reaches 100% at 800ms
  - Verify indicator hides when scrolling down
  - _Requirements: 4.4, 11.1, 11.2, 11.3_

- [ ] 8.3 Test progress indicator styling
  - Verify gradient color (brand primary to accent)
  - Verify 3px height
  - Verify smooth animation
  - _Requirements: 11.4, 11.5_

- [ ] 9. Test mobile responsiveness
  - Verify hamburger menu appears on screens < 768px
  - Test mobile menu open/close functionality
  - Verify touch targets are at least 44x44 pixels
  - Test mobile menu prevents body scroll when open
  - Verify app bar transitions work on mobile
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 10.2, 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 9.1 Test mobile menu visibility
  - Resize viewport to < 768px
  - Verify hamburger icon appears
  - Verify desktop nav is hidden
  - _Requirements: 14.1_

- [ ] 9.2 Test mobile menu functionality
  - Tap hamburger to open menu
  - Verify full-screen menu appears
  - Tap outside to close
  - Verify menu closes
  - _Requirements: 14.2, 14.3, 14.4_

- [ ] 9.3 Test mobile touch targets
  - Verify all buttons are at least 44x44 pixels
  - Test on real mobile device
  - _Requirements: 5.4_

- [ ] 9.4 Test mobile transitions
  - Verify app bar transitions work same as desktop
  - Monitor FPS (target: 45fps)
  - _Requirements: 5.1, 10.2_

- [ ] 10. Test accessibility features
  - Test keyboard navigation (Tab, Shift+Tab)
  - Verify focus indicators visible
  - Test with screen reader
  - Verify ARIA labels correct
  - Check contrast ratios meet WCAG 2.1 AA
  - Test reduced motion support
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 10.1 Test keyboard navigation
  - Tab through all interactive elements
  - Verify focus order is logical
  - Verify focus indicators visible
  - Test Shift+Tab for reverse navigation
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 10.2 Test screen reader compatibility
  - Use VoiceOver (macOS) or NVDA (Windows)
  - Verify app bar is announced correctly
  - Verify ARIA labels are read
  - Verify navigation links are accessible
  - _Requirements: 7.5_

- [ ] 10.3 Test contrast ratios
  - Check cloud mode white text on transparent (4.5:1 minimum)
  - Check site mode dark text on white (4.5:1 minimum)
  - Use Chrome DevTools or contrast checker
  - _Requirements: 6.4, 6.5_

- [ ] 10.4 Test reduced motion support
  - Enable prefers-reduced-motion in browser/OS
  - Verify transitions are disabled
  - Verify app bar maintains full opacity in both modes
  - Verify progress indicator is hidden
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 11. Test integration with scroll manager
  - Verify custom events are dispatched correctly
  - Verify app bar responds to events within 50ms
  - Test synchronization during transitions
  - Verify no console errors
  - Test event listener error handling
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 11.1 Test event dispatching
  - Monitor console for custom events
  - Verify 'cloudModeEnter' dispatched when entering cloud mode
  - Verify 'siteModeEnter' dispatched when entering site mode
  - Verify 'staggerProgress' dispatched with correct progress values
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 11.2 Test event response timing
  - Measure time between event dispatch and app bar update
  - Verify response time < 50ms
  - _Requirements: 9.3_

- [ ] 11.3 Test error handling
  - Simulate event listener failure
  - Verify fallback behavior
  - Verify no console errors
  - _Requirements: 9.5_

- [ ] 12. Test z-index stacking
  - Verify app bar appears above cloud canvas (z-index 100)
  - Verify app bar appears below modals (z-index 1000)
  - Test with various page elements
  - Verify dropdown menus have correct stacking
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 12.1 Test app bar above clouds
  - Verify app bar visible in cloud mode
  - Verify app bar not obscured by cloud canvas
  - _Requirements: 12.1, 12.4_

- [ ] 12.2 Test app bar below modals
  - Open a modal dialog (if available)
  - Verify modal appears above app bar
  - _Requirements: 12.2_

- [ ] 12.3 Test dropdown stacking
  - Open mobile menu
  - Verify menu appears correctly
  - Verify no z-index conflicts
  - _Requirements: 12.5_

- [ ] 13. Optimize performance
  - Verify 60fps on desktop during transitions
  - Verify 45fps on mobile during transitions
  - Check paint time < 16ms per frame
  - Monitor memory usage < 10MB
  - Verify GPU acceleration is active
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 13.1 Measure desktop performance
  - Use Chrome DevTools Performance tab
  - Record transition from cloud to site mode
  - Verify FPS > 60
  - Verify paint time < 16ms
  - _Requirements: 10.1, 10.3_

- [ ] 13.2 Measure mobile performance
  - Test on real mobile device
  - Record transition from cloud to site mode
  - Verify FPS > 45
  - Verify no jank or stuttering
  - _Requirements: 10.2_

- [ ] 13.3 Verify GPU acceleration
  - Check for composite layers in DevTools
  - Verify opacity and transform are GPU-accelerated
  - Verify will-change is applied during transitions
  - _Requirements: 10.3, 10.4_

- [ ] 13.4 Monitor memory usage
  - Check memory usage in DevTools
  - Verify app bar uses < 10MB
  - Check for memory leaks
  - _Requirements: 10.4_

- [ ] 14. Build and deploy
  - Build production bundle with Hugo
  - Verify minification and fingerprinting
  - Check bundle sizes meet targets
  - Deploy to staging environment
  - Test on live site
  - _Requirements: 1.6, 12.1_

- [ ] 14.1 Build production bundle
  - Run hugo --minify --environment production
  - Verify app-bar.css is minified and fingerprinted
  - Verify app-bar-manager.js is minified and fingerprinted
  - _Requirements: 1.6_

- [ ] 14.2 Check bundle sizes
  - Measure gzipped CSS size (target: <5KB)
  - Measure gzipped JS size (target: <10KB)
  - Verify total < 15KB gzipped
  - _Requirements: 1.6_

- [ ] 14.3 Deploy and test
  - Deploy to staging environment
  - Test all functionality on live site
  - Verify no CORS or asset loading errors
  - Monitor for console errors
  - _Requirements: 12.1_
