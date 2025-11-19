# Requirements Document

## Introduction

This document specifies the requirements for implementing a persistent app bar (navigation header) that remains visible throughout the volumetric cloud experience and site content. The app bar must adapt its visibility and styling based on the current mode (cloud vs site), creating a seamless visual experience while maintaining navigation accessibility.

## Glossary

- **App Bar**: The top navigation header containing the "Baseet Studio" logo and navigation links
- **Cloud Mode**: The initial state where volumetric clouds are displayed with the app bar in a subtle, less visible state
- **Site Mode**: The state where main website content is visible with the app bar in full visibility
- **Scroll Manager**: The JavaScript component that controls scroll behavior and state transitions
- **Visibility Transition**: The gradual change in app bar opacity and styling between cloud and site modes
- **Stagger Delay**: A time threshold that prevents accidental return to clouds when scrolling up (longer than original implementation)

## Requirements

### Requirement 1: App Bar Persistent Visibility

**User Story:** As a website visitor, I want to see the navigation bar at all times, so that I can access navigation options regardless of whether I'm viewing clouds or site content.

#### Acceptance Criteria

1. WHEN the page loads in Cloud Mode, THE App Bar SHALL be visible with reduced opacity of 0.3
2. WHEN the page is in Cloud Mode, THE App Bar SHALL display with white text color
3. WHEN the page is in Cloud Mode, THE App Bar SHALL have a transparent background
4. WHEN the page is in Site Mode, THE App Bar SHALL be visible with full opacity of 1.0
5. WHEN the page is in Site Mode, THE App Bar SHALL display with standard brand colors
6. THE App Bar SHALL maintain a fixed position at the top of the viewport with z-index of 200

### Requirement 2: App Bar Transition During Scroll Down

**User Story:** As a website visitor, I want the navigation bar to smoothly become more prominent as I scroll down through the clouds, so that the transition feels natural and polished.

#### Acceptance Criteria

1. WHEN transitioning from Cloud Mode to Site Mode, THE App Bar SHALL gradually increase opacity from 0.3 to 1.0 over 600 milliseconds
2. WHEN transitioning from Cloud Mode to Site Mode, THE App Bar SHALL change background from transparent to solid over 600 milliseconds
3. WHEN transitioning from Cloud Mode to Site Mode, THE App Bar SHALL change text color from white to brand colors over 600 milliseconds
4. WHEN the transition completes, THE App Bar SHALL apply a subtle shadow for depth
5. WHILE transitioning, THE App Bar SHALL use cubic-bezier easing function (0.4, 0, 0.2, 1)

### Requirement 3: App Bar Transition During Scroll Up

**User Story:** As a website visitor, I want the navigation bar to smoothly fade when I return to the cloud view, so that it doesn't distract from the immersive cloud experience.

#### Acceptance Criteria

1. WHEN transitioning from Site Mode to Cloud Mode, THE App Bar SHALL gradually decrease opacity from 1.0 to 0.3 over 600 milliseconds
2. WHEN transitioning from Site Mode to Cloud Mode, THE App Bar SHALL change background from solid to transparent over 600 milliseconds
3. WHEN transitioning from Site Mode to Cloud Mode, THE App Bar SHALL change text color from brand colors to white over 600 milliseconds
4. WHEN the transition completes, THE App Bar SHALL remove the shadow effect
5. WHILE transitioning, THE App Bar SHALL use cubic-bezier easing function (0.4, 0, 0.2, 1)

### Requirement 4: Extended Stagger Delay for Scroll Up

**User Story:** As a website visitor, I want a longer delay before returning to clouds when scrolling up, so that I don't accidentally trigger the cloud view while browsing content.

#### Acceptance Criteria

1. WHILE in Site Mode, WHEN the window scroll position equals 0 pixels AND the user scrolls upward, THE Scroll Manager SHALL start a stagger delay timer
2. WHILE the stagger delay timer is active, WHEN the timer reaches 800 milliseconds, THE Scroll Manager SHALL transition to Cloud Mode
3. WHILE the stagger delay timer is active, IF the user stops scrolling upward OR scrolls downward, THEN THE Scroll Manager SHALL reset the stagger delay timer to 0
4. WHEN the stagger delay is active, THE App Bar SHALL display a subtle visual indicator showing progress toward cloud transition
5. WHEN the user scrolls down before the delay completes, THE App Bar SHALL hide the progress indicator

### Requirement 5: App Bar Responsive Behavior

**User Story:** As a mobile website visitor, I want the navigation bar to work correctly on my device, so that I have the same experience as desktop users.

#### Acceptance Criteria

1. WHERE the device is identified as mobile, THE App Bar SHALL maintain the same visibility transitions as desktop
2. WHERE the device is identified as mobile, THE App Bar SHALL adjust font sizes and spacing for touch targets
3. WHEN the device orientation changes, THE App Bar SHALL maintain its state and styling
4. WHERE the device is identified as mobile, THE App Bar SHALL ensure touch targets are at least 44x44 pixels
5. WHEN touch events occur on the App Bar, THE App Bar SHALL prevent event propagation to the Scroll Manager

### Requirement 6: App Bar Accessibility

**User Story:** As a keyboard user, I want to navigate the app bar with keyboard controls, so that I can access all navigation options without a mouse.

#### Acceptance Criteria

1. WHEN the App Bar receives focus, THE App Bar SHALL display a visible focus indicator
2. WHEN the user presses Tab, THE App Bar SHALL move focus to the next interactive element
3. WHEN the user presses Shift+Tab, THE App Bar SHALL move focus to the previous interactive element
4. WHEN the App Bar is in Cloud Mode, THE App Bar SHALL ensure sufficient contrast ratio (4.5:1 minimum) for white text
5. WHEN the App Bar is in Site Mode, THE App Bar SHALL ensure sufficient contrast ratio (4.5:1 minimum) for brand colors

### Requirement 7: App Bar Logo and Branding

**User Story:** As a website visitor, I want to see the Baseet Studio logo in the navigation bar, so that I can identify the brand and return to the home page.

#### Acceptance Criteria

1. WHEN the App Bar is rendered, THE App Bar SHALL display the "Baseet Studio" text logo on the left side
2. WHEN the user clicks the logo, THE App Bar SHALL navigate to the home page or scroll to the top
3. WHEN the App Bar is in Cloud Mode, THE App Bar SHALL display the logo in white color
4. WHEN the App Bar is in Site Mode, THE App Bar SHALL display the logo in brand primary color
5. THE App Bar SHALL include an aria-label attribute with value "Baseet Studio Home"

### Requirement 8: App Bar Navigation Links

**User Story:** As a website visitor, I want to access navigation links from the app bar, so that I can quickly jump to different sections of the site.

#### Acceptance Criteria

1. WHEN the App Bar is rendered, THE App Bar SHALL display navigation links on the right side
2. WHEN the App Bar is in Cloud Mode, THE App Bar SHALL display navigation links in white color with 0.8 opacity
3. WHEN the App Bar is in Site Mode, THE App Bar SHALL display navigation links in brand colors with full opacity
4. WHEN the user hovers over a navigation link, THE App Bar SHALL increase the link opacity to 1.0
5. WHEN the user clicks a navigation link, THE App Bar SHALL scroll to the corresponding section smoothly

### Requirement 9: App Bar Integration with Scroll Manager

**User Story:** As a developer, I want the app bar to integrate seamlessly with the existing scroll manager, so that state transitions are synchronized.

#### Acceptance Criteria

1. WHEN the Scroll Manager transitions to Site Mode, THE App Bar SHALL receive a state change event
2. WHEN the Scroll Manager transitions to Cloud Mode, THE App Bar SHALL receive a state change event
3. WHEN the App Bar receives a state change event, THE App Bar SHALL update its styling within 50 milliseconds
4. WHEN the Scroll Manager is in Transitioning state, THE App Bar SHALL apply transitioning styles
5. THE App Bar SHALL listen for custom events dispatched by the Scroll Manager

### Requirement 10: App Bar Performance

**User Story:** As a website visitor, I want the navigation bar transitions to be smooth, so that the experience feels polished and professional.

#### Acceptance Criteria

1. WHEN the App Bar transitions between states, THE App Bar SHALL maintain 60 frames per second on desktop
2. WHEN the App Bar transitions between states, THE App Bar SHALL maintain 45 frames per second on mobile
3. WHEN the App Bar applies transitions, THE App Bar SHALL use CSS transforms and opacity for GPU acceleration
4. WHEN the App Bar is not transitioning, THE App Bar SHALL remove will-change properties to conserve resources
5. THE App Bar SHALL use requestAnimationFrame for any JavaScript-based animations

### Requirement 11: App Bar Visual Indicator for Cloud Return

**User Story:** As a website visitor, I want to see a visual indicator when I'm about to return to the cloud view, so that I understand what's happening.

#### Acceptance Criteria

1. WHILE the stagger delay timer is active, THE App Bar SHALL display a progress bar at the bottom edge
2. WHEN the stagger delay progress reaches 0%, THE App Bar SHALL hide the progress bar
3. WHEN the stagger delay progress reaches 100%, THE App Bar SHALL trigger the cloud transition
4. THE App Bar progress bar SHALL use a gradient color from brand primary to brand accent
5. THE App Bar progress bar SHALL animate smoothly using CSS transitions

### Requirement 12: App Bar Z-Index Management

**User Story:** As a website visitor, I want the navigation bar to always be on top of content, so that I can access it at any time.

#### Acceptance Criteria

1. THE App Bar SHALL have a z-index of 200, higher than the cloud canvas (z-index 100)
2. THE App Bar SHALL have a z-index lower than modal dialogs (z-index 1000)
3. WHEN the App Bar is rendered, THE App Bar SHALL not be obscured by any page content
4. WHEN the cloud canvas is visible, THE App Bar SHALL remain visible above the clouds
5. WHEN dropdown menus are opened, THE App Bar SHALL ensure they have appropriate z-index stacking

### Requirement 13: App Bar Reduced Motion Support

**User Story:** As a website visitor with motion sensitivity, I want the app bar transitions to respect my reduced motion preference, so that I can browse without discomfort.

#### Acceptance Criteria

1. WHEN the prefers-reduced-motion preference is set to reduce, THE App Bar SHALL disable all transition animations
2. WHEN the prefers-reduced-motion preference is set to reduce, THE App Bar SHALL apply instant state changes
3. WHEN the prefers-reduced-motion preference is set to reduce, THE App Bar SHALL hide the progress indicator
4. IF reduced motion is preferred, THEN THE App Bar SHALL maintain full opacity in both Cloud and Site modes
5. WHEN reduced motion is preferred, THE App Bar SHALL still maintain functional navigation

### Requirement 14: App Bar Mobile Menu

**User Story:** As a mobile website visitor, I want to access a hamburger menu for navigation, so that I can view all navigation options on my small screen.

#### Acceptance Criteria

1. WHERE the viewport width is less than 768 pixels, THE App Bar SHALL display a hamburger menu icon
2. WHEN the user taps the hamburger icon, THE App Bar SHALL open a full-screen mobile menu
3. WHEN the mobile menu is open, THE App Bar SHALL display navigation links vertically
4. WHEN the user taps outside the mobile menu, THE App Bar SHALL close the menu
5. WHEN the mobile menu is open, THE App Bar SHALL prevent body scrolling

### Requirement 15: App Bar State Persistence

**User Story:** As a website visitor, I want the navigation bar to remember its state during page interactions, so that the experience is consistent.

#### Acceptance Criteria

1. WHEN the page loads, THE App Bar SHALL initialize in Cloud Mode styling
2. WHEN the user navigates between sections, THE App Bar SHALL maintain its current mode styling
3. WHEN the browser tab becomes hidden, THE App Bar SHALL maintain its current state
4. WHEN the browser tab becomes visible, THE App Bar SHALL resume from its previous state
5. WHEN the page is refreshed, THE App Bar SHALL reset to Cloud Mode styling
