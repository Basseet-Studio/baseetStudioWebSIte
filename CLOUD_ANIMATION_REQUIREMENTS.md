# Cloud Animation Enhancement Requirements

## Current Implementation

### Cloud Rendering
The current 3D cloud scene uses WebGL and Three.js to render volumetric clouds with the following characteristics:

1. **Cloud Appearance**
   - Clouds are created using spherical geometry with distorted shapes for organic appearance
   - Each cloud is rendered using volumetric raymarching shaders
   - Clouds have 3D Perlin noise textures applied for realistic volumetric density
   - The clouds are currently appearing "cubbed up" or blocky instead of smooth and natural

2. **Cloud Distribution**
   - 20 clouds positioned in a cylindrical spiral pattern around the camera path
   - Clouds spread along the Z-axis from -5 to 20 units
   - Positioned at varying radial distances (4-10 units from center)
   - Vertical spread ranges from -4 to +4 units

3. **Animation & Camera Movement**
   - Camera starts at Z position 15 and moves forward to Z position 3
   - Camera moves toward a fixed point (the text at Z=5)
   - Camera movement is linear based on scroll progress
   - As the user scrolls, the camera moves through the clouds from back to front

4. **Text Rendering**
   - 3D text "BASEET STUDIO" created using TextGeometry
   - Text is positioned at a fixed Z position of 5
   - Text has a subtle float animation (up and down)
   - Text glow increases as camera approaches
   - Text remains centered and stationary in 3D space

5. **Transition Behavior**
   - Animation completes when scroll progress reaches 100%
   - Cross-fade transition occurs between the cloud scene and the hero section
   - Hero section appears after scrolling through 600 pixels

6. **Current Issues**
   - Clouds appear blocky or "cubed up" instead of smooth and fluffy
   - Text zooms in (comes closer) but doesn't feel like it's "falling down" with the scroll
   - No depth perception of clouds being both behind AND in front of the text
   - Transition to the hero section is abrupt rather than feeling like natural scrolling descent

## Desired Animation Experience

### Overall Vision
Create a cinematic scrolling experience where the user feels like they are falling downward through a sky filled with volumetric clouds, with the "BASEET STUDIO" text appearing to fall with them and gradually emerge from the cloud cover as they descend.

### Cloud Improvements

1. **Smoother Cloud Appearance**
   - Clouds should look soft, fluffy, and natural - not blocky or geometric
   - Increase the smoothness of the volumetric rendering
   - Better noise algorithms or higher quality texture sampling
   - Softer edges and more organic cloud shapes

2. **Vertical Cloud Motion**
   - Clouds should move from BOTTOM to TOP as the user scrolls down
   - This creates the illusion of falling/descending through the sky
   - Clouds should appear to rise up and pass by the camera as scrolling continues
   - Speed of cloud movement should feel natural and match the falling sensation

### Text Animation Enhancement

1. **Centered Falling Text**
   - Text should remain centered on screen at all times
   - Text should feel like it's falling downward with the viewer
   - As user scrolls, text appears to descend through the scene

2. **Depth Layering with Clouds**
   - Some clouds should be positioned BEHIND the text
   - Some clouds should be positioned IN FRONT of the text
   - As scrolling progresses, clouds should pass by the text from multiple depth layers

3. **Text Emergence Effect**
   - Initially, text should be partially or heavily obscured by clouds in front
   - As the user scrolls (falls), clouds should pass upward revealing the text more clearly
   - By the time the hero section is reached, text should be fully visible with minimal cloud coverage
   - This creates a "coming forward" or "emerging" effect

### Scroll Behavior

1. **Falling Sensation**
   - The entire scene should convey downward motion
   - Clouds moving upward relative to camera = falling sensation
   - Text falling at the same rate as viewer = staying centered
   - Gradual increase in visibility = approaching ground/hero section

2. **Smooth Transition**
   - Transition from cloud scene to hero section should feel like landing
   - Clouds should gradually fade out or move out of view
   - Hero section should emerge naturally from below as if descending onto it
   - No jarring cuts or sudden changes

### Technical Requirements

1. **Cloud Rendering Quality**
   - Higher resolution noise textures or better noise algorithm
   - Smooth interpolation between density samples
   - Better threshold and opacity settings for soft cloud edges
   - Consider using FBM (Fractal Brownian Motion) for more detail

2. **Movement System**
   - Clouds positioned in vertical layers above and below text
   - Y-position of clouds changes based on scroll progress
   - Clouds move upward (negative Y direction) as scroll increases
   - Text Y-position remains relatively stable (centered)

3. **Depth Arrangement**
   - Clouds arranged in at least 3 depth layers:
     - Far background clouds (behind text, Z < text Z)
     - Mid-ground clouds (at text depth, Z ≈ text Z)
     - Foreground clouds (in front of text, Z > text Z)
   - Clouds at different Z depths should move at different speeds (parallax effect)

4. **Text Visibility Control**
   - Start with text at ~30-50% visibility (covered by clouds)
   - Gradually increase visibility as scroll progress increases
   - At 100% scroll, text should be 90-100% visible
   - Control visibility through cloud opacity or positioning

5. **Performance Optimization**
   - Maintain smooth 60fps animation
   - Optimize raymarching step counts
   - Use level-of-detail for clouds far from camera
   - Efficient shader calculations

## Success Criteria

The animation will be considered successful when:

1. Clouds appear smooth, fluffy, and natural (not blocky)
2. Scrolling creates a clear sensation of falling downward through clouds
3. Text remains centered while appearing to fall with the viewer
4. Clouds visibly pass by both behind and in front of the text
5. Text gradually emerges from cloud cover as scrolling progresses
6. Transition to hero section feels like a natural landing/arrival
7. Animation runs smoothly at 60fps on modern devices
8. The overall experience is cinematic, immersive, and intuitive

## Implementation Notes

- The desired effect mimics falling through the sky/clouds like a skydiving experience
- Direction: Clouds should move UP relative to camera (opposite of scroll direction)
- Text should "fall" with viewer but emerge forward out of clouds
- Think of it as: viewer falling down → clouds rushing up past → text becoming clearer
- Final moment: landing on hero section at the "ground"
