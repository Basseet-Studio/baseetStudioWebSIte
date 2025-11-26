# Requirements Document

## Introduction

This feature refactors the cloud rendering system and app bar integration to create a cohesive hero section experience. The volumetric clouds with "BASEET STUDIO" text should render full screen in the hero area, and when users scroll down, they transition smoothly to the main website content. The current implementation has duplicate app bar handling and broken cloud rendering that needs to be fixed and simplified.

## Glossary

- **Hero Section**: The first visible section of the website, containing the cloud animation and "BASEET STUDIO" text
- **App Bar**: The single persistent navigation header at the top of the page (no duplication)
- **Cloud Renderer**: The WebGL-based system that renders volumetric clouds using Shadertoy shaders
- **Scroll Progress**: A normalized value (0-1) representing how far the user has scrolled through the cloud scene
- **Skip Button**: A solid text button in the corner to skip directly to main content

## Requirements

### Requirement 1

**User Story:** As a website visitor, I want to see the volumetric clouds rendering correctly in the hero section, so that I experience the intended visual effect.

#### Acceptance Criteria

1. WHEN the website loads THEN the Cloud Renderer SHALL display volumetric clouds filling the full viewport
2. WHEN the clouds render THEN the Cloud Renderer SHALL use the Shadertoy algorithm from the nicelouds reference code
3. WHEN the scene is visible THEN the Cloud Renderer SHALL display "BASEET STUDIO" text floating among the clouds
4. WHEN WebGL initialization fails THEN the system SHALL log the error and display a fallback hero section
5. WHEN textures fail to load THEN the Cloud Renderer SHALL use procedurally generated fallback textures

### Requirement 2

**User Story:** As a website visitor, I want a single unified app bar that works in both cloud and site modes, so that navigation is consistent and not duplicated.

#### Acceptance Criteria

1. WHEN the page loads THEN the system SHALL render exactly one app bar element (no duplication)
2. WHEN viewing the cloud hero section THEN the app bar SHALL be fully clickable and functional
3. WHEN viewing the cloud hero section THEN the app bar logo SHALL display as solid white text (fully visible)
4. WHEN viewing the cloud hero section THEN the navigation links SHALL start at low opacity and increase as user scrolls
5. WHEN the scroll progress increases THEN the navigation link opacity SHALL increase proportionally from 0.3 to 1.0

### Requirement 3

**User Story:** As a website visitor, I want a skip button to jump directly to the main content, so that I can bypass the cloud animation if desired.

#### Acceptance Criteria

1. WHEN viewing the cloud hero section THEN a skip button SHALL appear in a corner of the screen
2. WHEN the skip button is displayed THEN the skip button SHALL use solid readable text (not transparent)
3. WHEN the user clicks the skip button THEN the system SHALL scroll smoothly to the main content
4. WHEN the user scrolls past the hero section THEN the skip button SHALL fade out or hide
5. WHEN keyboard navigation is used THEN the skip button SHALL be focusable and activatable

### Requirement 4

**User Story:** As a website visitor, I want a completely refactored cloud-to-site transition, so that the experience is smooth and professional.

#### Acceptance Criteria

1. WHEN a user scrolls down THEN the Cloud Renderer SHALL update the camera position to fly through the clouds
2. WHEN the scroll progress reaches 100% THEN the cloud canvas SHALL fade out smoothly
3. WHEN the scroll progress reaches 100% THEN the main content SHALL become visible with the app bar at top
4. WHEN scrolling backwards to top THEN the cloud scene SHALL fade back in and reset
5. WHEN transitioning THEN the app bar background SHALL transition from transparent to solid white smoothly

### Requirement 5

**User Story:** As a developer, I want the app bar and transition code simplified and deduplicated, so that the system is maintainable.

#### Acceptance Criteria

1. WHEN implementing the app bar THEN the system SHALL use a single app bar component (remove any duplicate implementations)
2. WHEN the scroll controller updates THEN the scroll controller SHALL directly update app bar styles via CSS custom properties or classes
3. WHEN the cloud renderer initializes THEN the cloud renderer SHALL integrate with the single app bar manager
4. WHEN errors occur THEN the system SHALL log meaningful error messages to the console
5. WHEN the cloud renderer is destroyed THEN the system SHALL clean up all event listeners and WebGL resources

### Requirement 6

**User Story:** As a website visitor with accessibility needs, I want the cloud animation to respect my preferences, so that I can use the site comfortably.

#### Acceptance Criteria

1. WHEN the user has prefers-reduced-motion enabled THEN the Cloud Renderer SHALL reduce or disable cloud animation
2. WHEN keyboard navigation is used THEN the user SHALL be able to skip the cloud scene using the skip button
3. WHEN screen readers are used THEN the cloud scene SHALL have appropriate ARIA labels
4. WHEN the app bar is over clouds THEN the logo text contrast SHALL remain readable (solid white on dark clouds)
5. WHEN focus indicators are shown THEN the focus indicators SHALL be visible in both cloud and site modes

