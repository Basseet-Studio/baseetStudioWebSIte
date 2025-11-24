# Cool Clouds with Good FPS: Implementation Guide

## 1. Inspiration Source Analysis

You requested a focus on two specific Shadertoy examples. Here is the breakdown of their techniques:

### A. "Clouds" by Inigo Quilez (XslGRr)

- **Technique:** Volumetric Raymarching.
- **Core Logic:**
  - Marches rays through a 3D volume.
  - Samples a **procedural noise function** (FBM - Fractal Brownian Motion) at each step to get density.
  - Calculates lighting using **Beer's Law** (absorption) and a directional derivative for self-shadowing.
- **Why it looks "Cool":** It uses high-quality noise and physically plausible lighting (dark bottoms, bright tops).
- **Why it's "Heavy":** It samples the noise function many times per pixel (e.g., 64-128 steps).

### B. "Volumetric Clouds" (3dlfWs)

- **Technique:** Similar Volumetric Raymarching but often with different noise textures or optimization tricks.
- **Key Difference:** Often uses pre-computed 3D textures instead of calculating noise on the fly for every pixel, which is faster.

---

## 2. The "Good FPS" Strategy for Your Stack

To get these "Shadertoy-quality" clouds running at 60fps on a website (which is harder than a dedicated GPU demo), we cannot just copy-paste the code. We must use **Optimization Layers**.

### The "Blue Noise + Temporal Reprojection" Stack

This is the industry standard for real-time clouds.

1.  **Low-Res Raymarching:**
    - Don't raymarch every pixel. Raymarch at **half or quarter resolution**.
    - Upscale the result to the full screen.
    - _Gain:_ 4x to 16x performance boost.

2.  **Blue Noise Dithering:**
    - Instead of taking 100 steps per ray, take only **16-32 steps**.
    - Add a random "offset" (Blue Noise) to the starting position of each ray.
    - This turns "banding artifacts" (ugly stripes) into "noise" (film grain), which looks much better and allows fewer steps.

3.  **Bounded Volume (Your Current Advantage):**
    - Shadertoys usually render the _whole sky_.
    - You are rendering _specific cloud clusters_.
    - **Keep this!** Raymarching inside a `SphereGeometry` or `BoxGeometry` is much faster than raymarching the infinite sky because rays stop early.

---

## 3. Implementation Plan: "The Hybrid Approach"

We will combine the **Visuals of XslGRr** with the **Performance of Bounded Volumes**.

### Step 1: The Noise Texture (Crucial)

Inigo Quilez's shader calculates noise _mathematically_ in the loop. This is slow for JS/WebGL.
**Solution:** Generate a high-quality **3D Perlin-Worley Noise Texture** once at startup (or load a PNG sprite sheet) and sample it.

- _Action:_ Update `texture-generator.js` to create a seamless 3D noise texture.

### Step 2: The Shader (The "Cool" Part)

We need to rewrite your `fragmentShader` to use the lighting model from `XslGRr`.

**New Fragment Shader Logic:**

```glsl
// Pseudo-code for the new shader
float map(vec3 p) {
    // Sample our pre-computed 3D texture
    float d = texture(noise3D, p * scale).r;
    // Erode edges for "fluffy" look
    d -= texture(detailNoise3D, p * scale * 4.0).r * 0.3;
    return d;
}

vec4 raymarch(vec3 ro, vec3 rd) {
    float sumDensity = 0.0;
    vec3 p = ro;

    // Jitter start position with Blue Noise (for FPS)
    float t = jitter(gl_FragCoord.xy);
    p += rd * t * stepSize;

    for(int i=0; i<32; i++) { // Only 32 steps!
        float density = map(p);

        if(density > 0.01) {
            // Lighting Calculation (The "IQ" Magic)
            float light = getLight(p, lightDir);

            // Accumulate
            sumDensity += density;
            color += vec4(cloudColor * light, density);
        }
        p += rd * stepSize;
    }
    return color;
}
```

### Step 3: Performance Tuning

1.  **Reduce Steps:** Start with 32 steps. If it looks bad, increase to 48.
2.  **Texture Resolution:** Use a 64x64x64 texture. It's small enough for mobile but detailed enough for fluffiness.
3.  **LOD (Level of Detail):** If the user scrolls away, stop animating or reduce steps.

## 4. Summary of Changes Required

To achieve this "Cool Clouds + Good FPS" goal, we need to:

1.  **Replace** `texture-generator.js` with a more complex noise generator (Perlin-Worley).
2.  **Rewrite** `shaders.js` to use the "IQ Lighting Model" (Beer's Law + Phase Function).
3.  **Keep** `optimized-cloud-scene.js` mostly as is, but tune the parameters (density, step count) to match the new shader.

This approach gives you the **look** of the Shadertoys but the **performance** of a game engine.
