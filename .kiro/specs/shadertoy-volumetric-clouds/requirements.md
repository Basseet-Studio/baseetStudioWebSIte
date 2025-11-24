# Requirements Document

## Introduction

This feature implements a complete replacement of the existing cloud system with a high-quality Shadertoy-based volumetric cloud renderer. The new system will display realistic 3D volumetric clouds floating in the sky with "BASEET STUDIO" text, where users can scroll to fly towards the text and transition smoothly to the main website content.

## Glossary

- **Shadertoy**: A web-based platform for creating and sharing GLSL shader programs
- **Volumetric Clouds**: 3D cloud rendering technique using raymarching through noise functions
- **Raymarching**: A rendering technique that steps through 3D space to sample volumetric data
- **fBM (Fractional Brownian Motion)**: A noise generation technique that combines multiple octaves of noise
- **Hero Section**: The first visible section of the website containing the main visual impact
- **Cloud Renderer**: The WebGL-based system that renders volumetric clouds using shaders
- **iChannel**: Texture input channels used in Shadertoy shaders (iChannel0-3)
- **GLSL**: OpenGL Shading Language used for writing shader programs
- **Scroll Progress**: A normalized value (0-1) representing how far the user has scrolled through the cloud scene

## Requirements

### Requirement 1

**User Story:** As a website visitor, I want to see beautiful volumetric clouds floating in the sky when I first load the site, so that I have an impressive visual experience.

#### Acceptance Criteria

1. WHEN the website loads THEN the Cloud Renderer SHALL display volumetric clouds using the Shadertoy algorithm with raymarching
2. WHEN the clouds are rendered THEN the Cloud Renderer SHALL use fBM noise generation with multiple octaves for realistic cloud appearance
3. WHEN the scene is visible THEN the Cloud Renderer SHALL display "BASEET STUDIO" text floating in 3D space among the clouds
4. WHEN the clouds animate THEN the Cloud Renderer SHALL apply gentle rotation and movement to create a living atmosphere
5. WHEN rendering clouds THEN the Cloud Renderer SHALL use the iChannel texture inputs for noise generation as specified in the Shadertoy code

### Requirement 2

**User Story:** As a website visitor, I want to scroll down and fly towards the text through the clouds, so that I experience a smooth transition to the main content.

#### Acceptance Criteria

1. WHEN a user scrolls down THEN the Cloud Renderer SHALL update the camera position to move forward through the cloud scene
2. WHEN the scroll progress increases THEN the Cloud Renderer SHALL move the camera closer to the "BASEET STUDIO" text
3. WHEN the user reaches maximum scroll distance THEN the Cloud Renderer SHALL trigger a transition to the main website content
4. WHEN scrolling backwards THEN the Cloud Renderer SHALL move the camera backwards through the clouds
5. WHEN scroll progress reaches zero THEN the Cloud Renderer SHALL reset to the initial camera position

### Requirement 3

**User Story:** As a website visitor, I want the cloud system to perform well on my device, so that I can enjoy the experience without lag or stuttering.

#### Acceptance Criteria

1. WHEN the Cloud Renderer detects a mobile device THEN the Cloud Renderer SHALL reduce rendering quality settings for better performance
2. WHEN the browser tab is hidden THEN the Cloud Renderer SHALL pause animation to conserve resources
3. WHEN the browser tab becomes visible THEN the Cloud Renderer SHALL resume animation
4. WHEN the window is resized THEN the Cloud Renderer SHALL update the canvas dimensions and camera aspect ratio
5. WHEN WebGL is not supported THEN the Cloud Renderer SHALL display a fallback message or skip the cloud scene

### Requirement 4

**User Story:** As a developer, I want the old cloud implementation completely removed, so that there is no code duplication or confusion.

#### Acceptance Criteria

1. WHEN implementing the new system THEN the system SHALL delete all existing cloud-related JavaScript files from the volumetric-clouds directory
2. WHEN implementing the new system THEN the system SHALL delete all existing cloud-related CSS files
3. WHEN implementing the new system THEN the system SHALL remove all references to the old cloud system from HTML templates
4. WHEN the new system is complete THEN the codebase SHALL contain only the new Shadertoy-based implementation
5. WHEN the new files are created THEN the system SHALL use new file names and directory structure distinct from the old implementation

### Requirement 5

**User Story:** As a developer, I want the Shadertoy shader code properly converted to work in a Three.js environment, so that the clouds render correctly.

#### Acceptance Criteria

1. WHEN converting the shader THEN the system SHALL translate Shadertoy-specific variables (iTime, iResolution, iMouse, fragCoord) to Three.js equivalorms
2. WHEN converting the shader THEN the system SHALL implement the mainImage function as a fragment shader compatible with Three.js
3. WHEN setting up textures THEN the system SHALL load the four iChannel textures (iChannel0-3) from the root directory
4. WHEN rendering THEN the system SHALL pass all required uniforms (time, resolution, mouse position, textures) to the shader
5. WHEN the noise function is called THEN the shader SHALL use the iChannel0 texture for 2D noise lookups as specified in the original code

### Requirement 6

**User Story:** As a website visitor, I want the 3D text to be clearly visible and well-integrated with the clouds, so that I can read the studio name.

#### Acceptance Criteria

1. WHEN the scene loads THEN the Cloud Renderer SHALL display "BASEET STUDIO" text as a 3D mesh in the scene
2. WHEN the text is rendered THEN the Cloud Renderer SHALL position the text at an appropriate depth within the cloud volume
3. WHEN clouds move THEN the text SHALL remain stable and readable
4. WHEN the user scrolls THEN the text SHALL grow larger as the camera approaches
5. WHEN lighting is applied THEN the text SHALL have appropriate shading to stand out from the clouds

### Requirement 7

**User Story:** As a website visitor with accessibility needs, I want the cloud animation to respect my motion preferences, so that I don't experience discomfort.

#### Acceptance Criteria

1. WHEN the user has prefers-reduced-motion enabled THEN the Cloud Renderer SHALL disable or significantly reduce cloud animation
2. WHEN reduced motion is active THEN the Cloud Renderer SHALL still allow scroll-based camera movement
3. WHEN reduced motion is active THEN the Cloud Renderer SHALL reduce or eliminate automatic rotation and movement
4. WHEN the cloud scene is present THEN the HTML SHALL include appropriate ARIA labels for screen readers
5. WHEN keyboard navigation is used THEN the user SHALL be able to skip the cloud scene and jump to main content
