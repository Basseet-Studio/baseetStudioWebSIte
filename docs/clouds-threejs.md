# Real-time Dreamy Cloudscapes with Volumetric Raymarching

**Date:** October 31, 2023

## Introduction

I spent the past few months diving into the realm of Raymarching and studying some of its applications that may come in handy for future 3D projects, and while I managed to build a pretty diverse set of scenes, all of them consisted of rendering surfaces or solid objects. My blog post on Raymarching covered some of the many impressive capabilities of this rendering technique, and as I mentioned at the end of that post, that was only the tip of the iceberg; there is a lot more we can do with it.

One fascinating aspect of Raymarching I quickly encountered in my study was its capacity to be tweaked to render volumes. Instead of stopping the raymarched loop once the ray hits a surface, we push through and continue the process to sample the inside of an object. That is where my obsession with volumetric clouds started, and I think the countless hours I spent exploring the many Sky Islands in Zelda Tears of the Kingdom contributed a lot to my curiosity to learn more about how they work. I thus studied a lot of Shadertoy scenes such as "Clouds" by Inigo Quilez, "Starry Night" by al-ro, and "Volumetric Raymarching sample" by Suyoku leveraging many Volumetric Raymarching techniques to render smoke, clouds, and cloudscapes, which I obviously couldn't resist giving a try rebuilding myself.

I spent a great deal of time exploring the different ways I could use Raymarching to render clouds, from fully wrapping my head around the basics of Volumetric Raymarching to leveraging physically based properties of clouds to try getting a more realistic output while also trying to squeeze as much performance out of my scenes with neat performance improvement tips I learned along the way. I cover all of that in this article, which I hope can serve you as a field guide for your own volumetric rendering experiments and learnings.

> **👉 Prerequisites:** This article assumes you have basic knowledge about shaders, noise, and GLSL, or read "The Study of Shaders with React Three Fiber" as well as some notions about Raymarching, which you can learn more about in "Painting with Math: A Gentle Study of Raymarching".

---

## Volumetric Rendering: Raymarching with a Twist

In my previous blog post on Raymarching, we saw that the technique relied on:

- **Signed Distance Fields (SDFs):** Functions that return the distance of a given point in space to the surface of an object
- **A Raymarching loop:** Where we march step-by-step alongside rays cast from an origin point (a camera, the observer's eye) through each pixel of an output image, and we calculate the distance to the object's surface using our SDF. Once that distance is small enough, we can draw a pixel.

If you've practiced this technique on some of your own scenes, you're in luck: Volumetric Raymarching relies on the same principles: there's a loop, rays cast from an origin, and SDFs. However, since we're rendering volumes instead of surfaces, there's a tiny twist to the technique 👀.

### How to Sample a Volume

The first time we got introduced to the concept of SDF, we learned that it was important not to step inside the object during our Raymarching loop to have a beautiful render. I even emphasized that fact in one of my diagrams showcasing 3 points relative to an object:

- **P1** is located far from the surface, in green, representing a positive distance to the surface
- **P2** is located at a close distance ε to the surface, in orange
- **P3** positioned inside the object, in red, representing a negative distance to the surface

_Diagram showcasing 3 points, P1, P2, and P3, being respectively, at a positive distance, small distance, and inside a sphere._

When sampling a volume, we'll need to actually raymarch inside our object and reframe how we think of SDF: instead of representing the distance to the surface, we will now use it as the **density** of our volume.

- When raymarching **outside**, the density is null, or `0`
- Once we raymarch **inside**, it is positive

To illustrate this new way of thinking about Raymarching in the context of volume, here's a modified version of the widget I introduced in my blog post on the topic earlier this year.

That reframing of what an SDF represents ends up changing two core principles in our Raymarching technique that will have to be reflected in our code:

1. We have to march step-by-step with a **constant step size** along our rays. We no longer use the distance returned by the SDF.
2. Our SDF now returns the **opposite of the distance** to the surface to properly represent the density of our object (positive on the inside, 0 on the outside)

### Our First Volumetric Raymarching Scene

Now that we have a grasp of sampling volumes using what we know about Raymarching, we can try implementing it by modifying an existing scene. For brevity, I'm not detailing the setup of a basic of Raymarching scenes. If you want a good starting point you can head to my Raymarching setup I already introduced in a previous article.

The setup of the scene is quite similar to what we're familiar with in classic Raymarching; the modifications we'll need to do are located in:

#### SDF Functions

We'll need to return the opposite of the distance: `-d` instead of `d`.

```glsl
float sdSphere(vec3 p, float radius) {
  return length(p) - radius;
}

float scene(vec3 p) {
  float distance = sdSphere(p, 1.0);
  return -distance;
}
```

#### Volumetric Raymarching Loop with Constant Step Size

```glsl
#define MAX_STEPS 100

const float MARCH_SIZE = 0.08;

float depth = 0.0;
vec3 p = rayOrigin + depth * rayDirection;
vec4 res = vec4(0.0);

for (int i = 0; i < MAX_STEPS; i++) {
  float density = scene(p);
  if (density > 0.0) {
    // ...
  }

  depth += MARCH_SIZE;
  p = rayOrigin + depth * rayDirection;
}
```

Now comes another question: what shall we draw once our density is positive to represent a volume? For this first example, we can keep things simple and play with the alpha channel of our colors to make it proportional to the density of our volume: the denser our object gets as we march into it, the more opaque/darker it will be.

#### Simple Volumetric Raymarching Loop

```glsl
const float MARCH_SIZE = 0.08;

vec4 raymarch(vec3 rayOrigin, vec3 rayDirection) {
  float depth = 0.0;
  vec3 p = rayOrigin + depth * rayDirection;
  vec4 res = vec4(0.0);

  for (int i = 0; i < MAX_STEPS; i++) {
    float density = scene(p);

    // We only draw the density if it's greater than 0
    if (density > 0.0) {
      vec4 color = vec4(mix(vec3(1.0,1.0,1.0), vec3(0.0, 0.0, 0.0), density), density);
      color.rgb *= color.a;
      res += color * (1.0 - res.a);
    }

    depth += MARCH_SIZE;
    p = rayOrigin + depth * rayDirection;
  }

  return res;
}
```

_This produces a volumetric sphere._

---

## Drawing Fluffy Raymarched Clouds

We now know and applied the basics of Volumetric Raymarching. So far, we only rendered a simple volumetric sphere with constant density as we march through the volume, which is a good start. We can now try using that simple scene as a foundation to render something more interesting: clouds!

### Noisy Volume

Going from our simple SDF of a sphere to a cloud consists of drawing it with a bit more noise. Clouds don't have a uniform shape nor do they have a uniform density, thus we need to introduce some organic randomness through noise in our Raymarching loop. If you read some of my previous articles, you should already be familiar with the concept of:

- Noise, Perlin noise, and value noise derivative
- Fractal Brownian Motion (FBM)
- Texture-based noise

To generate raymarched landscapes, we used a noise texture, noise derivatives, and FBM to get a detailed organic result. We'll rely on some of those concepts to create organic randomness and obtain a cloud from our SDF ☁️.

#### Noise Function for Raymarched Landscape

```glsl
vec3 noise(vec2 x) {
  vec2 p = floor(x);
  vec2 f = fract(x);
  vec2 u = f * f * (3. - 2. * f);

  float a = textureLod(uTexture, (p + vec2(.0,.0)) / 256., 0.).x;
  float b = textureLod(uTexture, (p + vec2(1.0,.0)) / 256., 0.).x;
  float c = textureLod(uTexture, (p + vec2(.0,1.0)) / 256., 0.).x;
  float d = textureLod(uTexture, (p + vec2(1.0,1.0)) / 256., 0.).x;

  float noiseValue = a + (b-a) * u.x + (c-a) * u.y + (a - b - c + d) * u.x * u.y;
  vec2 noiseDerivative = 6. * f * (1. - f) * (vec2(b - a, c - a) + (a - b - c + d) * u.yx);

  return vec3(noiseValue, noiseDerivative);
}
```

#### Noise Function for Volumetric Clouds

For clouds, our noise function looks a bit different:

```glsl
float noise(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f * f * (3. - 2. * f);

  vec2 uv = (p.xy + vec2(37.0, 239.0) * p.z) + f.xy;
  vec2 tex = textureLod(uNoise, (uv + 0.5) / 256.0, 0.0).yx;

  return mix(tex.x, tex.y, f.z) * 2.0 - 1.0;
}
```

To tell you the truth, I saw this function in many Shadertoy demos without necessarily seeing a credited author or even a link to an explanation; I kept using it throughout my work as it still yielded a convincing cloud noise pattern. Here's an attempt at gathering together some of its specificities from my own understanding:

- Clouds are 3D structures, so our function takes in a `vec3` as input: a point in space within our cloud
- The texture lookup differs from its landscape counterpart: we're sampling it as a 2D slice from a 3D position. The `vec2(37.0, 239.0) * p.z` seems a bit arbitrary to me, but from what I gathered, it allows for more variation in the resulting noise
- We then mix two noise values from our texture lookup based on the z value to generate a smooth noise pattern and rescale it within the `[-1, 1]` range

During my research, I found that game devs and other 3D creators use a large variety of noises to get more realistic-looking clouds. If you're interested in reading more on that topic, you can check the following write-ups:

- How Big Budget AAA Games Render Clouds
- This presentation on the EA Frostbite engine starting at page 30

#### Fractal Brownian Motion (FBM)

Applying this noise along with a Fractal Brownian motion is pretty similar to what we're used to with Raymarched landscapes:

```glsl
float fbm(vec3 p) {
  vec3 q = p + uTime * 0.5 * vec3(1.0, -0.2, -1.0);
  float g = noise(q);

  float f = 0.0;
  float scale = 0.5;
  float factor = 2.02;

  for (int i = 0; i < 6; i++) {
    f += scale * noise(q);
    q *= factor;
    factor += 0.21;
    scale *= 0.5;
  }

  return f;
}

float scene(vec3 p) {
  float distance = sdSphere(p, 1.0);
  float f = fbm(p);

  return -distance + f;
}
```

If we apply the code above to our previous demo, we do get something that starts to look like a cloud 👀

---

## Adding Light

Once again, we're just "starting" to see something approaching our goal, but a crucial element is missing to make our cloud feel more cloudy: **light**.

The demo we just saw in the previous part lacks depth and shadows and thus doesn't feel very realistic overall, and that's due to the lack of diffuse light.

We had similar issues in:

- Our first demo from the Raymarching blog post
- Our Dispersion shader

Adding diffuse and optionally specular lighting can go a long way to give your shader material or scene a sense of depth.

To add light to our cloud and consequentially obtain better shadows, one may want to apply the same lighting we used in standard Raymarching scenes:

1. Calculate the normal of each sample point using our scene function
2. Use the dot product of the normal and the light direction

### Diffuse Lighting in Raymarched Scene Using Normals

```glsl
vec3 getNormal(vec3 p) {
  vec2 e = vec2(.01, 0);

  vec3 n = scene(p) - vec3(
    scene(p-e.xyy),
    scene(p-e.yxy),
    scene(p-e.yyx)
  );

  return normalize(n);
}

void main() {
  // ...

  vec3 ro = vec3(0.0, 0.0, 5.0);
  vec3 rd = normalize(vec3(uv, -1.0));
  vec3 lightPosition = vec3(1.0);

  float d = raymarch(ro, rd);
  vec3 p = ro + rd * d;

  vec3 color = vec3(0.0);

  if (d < MAX_DIST) {
    vec3 normal = getNormal(p);
    vec3 lightDirection = normalize(lightPosition - p);

    float diffuse = max(dot(normal, lightDirection), 0.0);
    color = vec3(1.0, 1.0, 1.0) * diffuse;
  }

  gl_FragColor = vec4(color, 1.0);
}
```

That would work in theory, but it's not the optimal choice for Volumetric Raymarching:

- The `getNormal` function requires a lot of sample points to estimate the "gradient" in every direction. In the code above, we need 4, but there are code snippets that require 6 for a more accurate result
- Our volumetric raymarching loop is more resource-intensive: we're walking at a constant step size along our ray to sample the density of our volume

### Directional Derivatives for Lighting

Thus, we need another method or approximation for our diffuse light. Luckily, Inigo Quilez presents a technique to solve this problem in his article on directional derivatives. Instead of having to sample our density in every direction like `getNormal`, this method simplifies the problem by sampling the density at our sampling point `p` and at an offset in the direction of the light and getting the difference between those values to approximate how the light scatters roughly inside our volume.

_Diagram showcasing 2 sampled points P1 and P2 with both their diffuse lighting calculated by sampling extra points P1' and P2' in the direction of the light_

In the diagram above, you can see that we're sampling our density at `p1` and at another point `p1'` that's a bit further along the light ray:

- If the density increases along that path, that means the volume gets denser, and light will scatter more
- If the density gets smaller, our cloud is less thick, and thus, the light will scatter less

This method only requires 2 sampling points and consequentially requires fewer resources to give us a good approximation of how the light behaves with the volume around `p1`.

> **Note:** The directional derivative method to calculate diffuse lighting works only with a few light sources. That is an acceptable limitation, as our scenes only feature one light source: the sun.

We can apply this diffuse formula to our demo as follows:

```glsl
// Inside the raymarching loop
if (density > 0.0) {
  // Directional derivative for fast diffuse lighting
  float diffuse = clamp((scene(p) - scene(p + 0.3 * sunDirection)) / 0.3, 0.0, 1.0);

  vec3 lin = vec3(0.60, 0.60, 0.75) * 1.1 + 0.8 * vec3(1.0, 0.6, 0.3) * diffuse;
  vec4 color = vec4(mix(vec3(1.0, 1.0, 1.0), vec3(0.0, 0.0, 0.0), density), density);
  color.rgb *= lin;
  color.rgb *= color.a;
  res += color * (1.0 - res.a);
}
```

That is, once again, very similar to what we were doing in standard Raymarching, except that now, we have to include it inside the Raymarching loop as we're sampling a volume and thus have to run the calculation multiple times throughout the volume as the density may vary whereas a surface required only one diffuse lighting computation (at the surface).

You can observe the difference between our cloud without lighting and with diffuse lighting below 👇

---

## Creative Experiments with SDFs

Let's take a little break to tweak our scene and have some fun with what we built so far! Despite the differences between the standard Raymarching and its volumetric counterpart, there are still a lot of SDF-related concepts you can apply when building cloudscapes.

You can try to make a cloud in fun shapes like a cross or a torus, or even better, try to make it morph from one form to another over time:

### Mixing SDFs to Morph Volumetric Clouds

```glsl
mat2 rotate2D(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

float nextStep(float t, float len, float smo) {
  float tt = mod(t += smo, len);
  float stp = floor(t / len) - 1.0;
  return smoothstep(0.0, smo, tt) + stp;
}

float scene(vec3 p) {
  vec3 p1 = p;
  p1.xz *= rotate2D(-PI * 0.1);
  p1.yz *= rotate2D(PI * 0.3);

  float s1 = sdTorus(p1, vec2(1.3, 0.9));
  float s2 = sdCross(p1 * 2.0, 0.6);
  float s3 = sdSphere(p, 1.5);
  float s4 = sdCapsule(p, vec3(-2.0, -1.5, 0.0), vec3(2.0, 1.5, 0.0), 1.0);

  float t = mod(nextStep(uTime, 3.0, 1.2), 4.0);

  float distance = mix(s1, s2, clamp(t, 0.0, 1.0));
  distance = mix(distance, s3, clamp(t - 1.0, 0.0, 1.0));
  distance = mix(distance, s4, clamp(t - 2.0, 0.0, 1.0));
  distance = mix(distance, s1, clamp(t - 3.0, 0.0, 1.0));

  float f = fbm(p);

  return -distance + f;
}
```

This demo is a reproduction of a volumetric rendering related Shadertoy scene. I really like this creation because the result is very organic, and it gives the impression that the cloud is rolling into its next shape naturally.

### Other Creative Ideas

You can also try to render:

- Clouds merging together using the `min` and `smoothmin` of two SDFs
- Repeating clouds through space using the `mod` function

There are a lot of creative compositions to try!

---

## Performance Optimization

You may notice that running the scenes we built so far may make your computer sound like a jet engine at high resolution or at least not look as smooth as they could. Luckily, we can do something about it and use some performance optimization techniques to strike the right balance between FPS count and output quality.

### Complete Shader Example

```glsl
uniform float uTime;
uniform vec2 uResolution;
uniform sampler2D uNoise;

#define MAX_STEPS 100

float sdSphere(vec3 p, float radius) {
  return length(p) - radius;
}

float noise(in vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);

  vec2 uv = (p.xy + vec2(37.0, 239.0) * p.z) + f.xy;
  vec2 tex = textureLod(uNoise, (uv + 0.5) / 256.0, 0.0).yx;

  return mix(tex.x, tex.y, f.z) * 2.0 - 1.0;
}

float fbm(vec3 p) {
  vec3 q = p + uTime * 0.5 * vec3(1.0, -0.2, -1.0);
  float g = noise(q);

  float f = 0.0;
  float scale = 0.5;
  float factor = 2.02;

  for (int i = 0; i < 6; i++) {
    f += scale * noise(q);
    q *= factor;
    factor += 0.21;
    scale *= 0.5;
  }

  return f;
}

float scene(vec3 p) {
  float distance = sdSphere(p, 1.0);
  float f = fbm(p);

  return -distance + f;
}

const vec3 SUN_POSITION = vec3(1.0, 0.0, 0.0);
const float MARCH_SIZE = 0.08;

vec4 raymarch(vec3 rayOrigin, vec3 rayDirection) {
  float depth = 0.0;
  vec3 p = rayOrigin + depth * rayDirection;
  vec3 sunDirection = normalize(SUN_POSITION);

  vec4 res = vec4(0.0);

  for (int i = 0; i < MAX_STEPS; i++) {
    float density = scene(p);

    // We only draw the density if it's greater than 0
    if (density > 0.0) {
      // Directional derivative for fast diffuse lighting
      float diffuse = clamp((scene(p) - scene(p + 0.3 * sunDirection)) / 0.3, 0.0, 1.0);
      vec3 lin = vec3(0.60, 0.60, 0.75) * 1.1 + 0.8 * vec3(1.0, 0.6, 0.3) * diffuse;
      vec4 color = vec4(mix(vec3(1.0, 1.0, 1.0), vec3(0.0, 0.0, 0.0), density), density);
      color.rgb *= lin;
      color.rgb *= color.a;
      res += color * (1.0 - res.a);
    }

    depth += MARCH_SIZE;
    p = rayOrigin + depth * rayDirection;
  }

  return res;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  uv -= 0.5;
  uv.x *= uResolution.x / uResolution.y;

  // Ray Origin - camera
  vec3 ro = vec3(0.0, 0.0, 5.0);
  // Ray Direction
  vec3 rd = normalize(vec3(uv, -1.0));

  vec3 color = vec3(0.0);

  // Sun and Sky
  vec3 sunDirection = normalize(SUN_POSITION);
  float sun = clamp(dot(sunDirection, rd), 0.0, 1.0);

  // Base sky color
  color = vec3(0.7, 0.7, 0.90);
  // Add vertical gradient
  color -= 0.8 * vec3(0.90, 0.75, 0.90) * rd.y;
  // Add sun color to sky
  color += 0.5 * vec3(1.0, 0.5, 0.3) * pow(sun, 10.0);

  // Cloud
  vec4 res = raymarch(ro, rd);
  color = color * (1.0 - res.a) + res.rgb;

  gl_FragColor = vec4(color, 1.0);
}
```
