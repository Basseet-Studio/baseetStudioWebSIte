# Volumetric Clouds Page Setup

## Overview
The volumetric clouds feature has been set up as a **dedicated standalone page** at `/clouds` to avoid interfering with the existing hero section.

## What Was Done

### 1. Restored Hero Section
- Removed cloud container from hero section
- Restored original hero layout with image display
- Removed cloud-specific CSS that was affecting the hero

### 2. Created Dedicated Clouds Page
- **URL**: `/clouds` (or `http://localhost:51748/baseetStudioWebSIte/clouds`)
- **Layout**: `layouts/_default/clouds.html`
- **Content**: `content/clouds.md`

### 3. Added Navigation
- Added "View Clouds Demo" button to hero section
- Button links to `/clouds` page

## How to View

1. **Home Page**: Visit `http://localhost:51748/baseetStudioWebSIte/`
   - Hero section displays normally with image
   - Click "View Clouds Demo" button

2. **Clouds Page**: Visit `http://localhost:51748/baseetStudioWebSIte/clouds`
   - Full-screen volumetric cloud rendering
   - Real-time animation with lighting
   - "Back to Home" link in top-left corner

## Features of Clouds Page

- **Full-screen immersive experience**
- **Real-time volumetric rendering** using Three.js and GLSL shaders
- **Raymarching algorithm** with 100 steps
- **Fractal Brownian Motion** (6 octaves) for organic cloud shapes
- **Directional derivative lighting** for realistic shadows
- **Animated clouds** with subtle movement
- **Loading indicator** while initializing
- **Info overlay** explaining the technology
- **Responsive** - works on all screen sizes

## Technical Details

### Cloud Renderer
- **File**: `assets/js/cloud-renderer.js`
- **Texture**: `/textures/blue-noise-256.png`
- **Shader**: Custom GLSL vertex and fragment shaders
- **Performance**: Capped at 2x pixel ratio for optimization

### Page Structure
```
/clouds
├── Full-screen canvas (100vw x 100vh)
├── Back to home link (top-left)
├── Info overlay (bottom-center)
└── Loading indicator (center, hidden after load)
```

## Troubleshooting

If clouds don't appear:
1. Check browser console (F12) for errors
2. Verify WebGL is supported in your browser
3. Check that texture file exists at `/textures/blue-noise-256.png`
4. Ensure Hugo server is running

## Next Steps

To customize the clouds page:
- Edit `layouts/_default/clouds.html` for layout changes
- Edit `content/clouds.md` for metadata
- Modify `assets/js/cloud-renderer.js` for rendering parameters
- Adjust colors in the CSS section of clouds.html
