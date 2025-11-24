import * as THREE from 'three';
import { ImprovedNoise } from './improved-noise.js';

/**
 * Smooth interpolation function (same as GLSL smoothstep)
 */
function smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

/**
 * Simple 3D Worley (Cellular) Noise
 * Returns distance to closest feature point
 */
function worley3D(x, y, z, cells) {
    const px = x * cells;
    const py = y * cells;
    const pz = z * cells;

    const ix = Math.floor(px);
    const iy = Math.floor(py);
    const iz = Math.floor(pz);

    const fx = px - ix;
    const fy = py - iy;
    const fz = pz - iz;

    let minDist = 1.0;

    // Check 3x3x3 neighbor cubes
    for (let k = -1; k <= 1; k++) {
        for (let j = -1; j <= 1; j++) {
            for (let i = -1; i <= 1; i++) {
                // Hash function to get random point in cell
                const n = (ix + i) * 137 + (iy + j) * 149 + (iz + k) * 167;
                const h = (Math.sin(n) * 43758.5453123) % 1;
                
                // Random point position in cell (0-1)
                // We use simple pseudo-random based on cell index
                const rx = 0.5 + 0.5 * Math.sin(h * 6.28 + 0.0);
                const ry = 0.5 + 0.5 * Math.sin(h * 6.28 + 2.0);
                const rz = 0.5 + 0.5 * Math.sin(h * 6.28 + 4.0);

                // Vector from current point to feature point
                const dx = (i + rx) - fx;
                const dy = (j + ry) - fy;
                const dz = (k + rz) - fz;

                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                minDist = Math.min(minDist, dist);
            }
        }
    }

    return 1.0 - minDist; // Invert so 1 is center of cell, 0 is edge
}

/**
 * Generate a 3D Perlin-Worley noise texture for volumetric clouds
 * @param {number} size - Texture dimension (64 or 128 for size³ voxels)
 * @returns {THREE.Data3DTexture} - 3D texture with Perlin-Worley noise data
 */
export function generate3DTexture(size = 128) {
    const data = new Uint8Array(size * size * size);
    const perlin = new ImprovedNoise();

    // Scale factors
    const perlinScale = 0.06;
    const worleyScale = 4.0; // Cells per unit

    let i = 0;

    for (let z = 0; z < size; z++) {
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Normalized coordinates
                const nx = x * perlinScale;
                const ny = y * perlinScale;
                const nz = z * perlinScale;

                // 1. Perlin Noise Base (Low Frequency)
                let p = 0;
                p += perlin.noise(nx, ny, nz) * 1.0;
                p += perlin.noise(nx * 2, ny * 2, nz * 2) * 0.5;
                p += perlin.noise(nx * 4, ny * 4, nz * 4) * 0.25;
                
                // Remap Perlin to [0, 1]
                p = (p + 1.0) * 0.5;

                // 2. Worley Noise (High Frequency Detail)
                // We use normalized coordinates [0, 1] for Worley
                const u = x / size;
                const v = y / size;
                const w = z / size;
                
                let worley = 0;
                worley += worley3D(u, v, w, 4) * 0.625;
                worley += worley3D(u, v, w, 8) * 0.25;
                worley += worley3D(u, v, w, 16) * 0.125;

                // 3. Perlin-Worley Mix
                // "Dilate" the Perlin noise using Worley noise
                // This creates the "cauliflower" shapes
                let finalNoise = p;
                
                // Remap: map(value, min, max, newMin, newMax)
                // We want to erode the Perlin noise with the Worley noise
                // Simple approach: Perlin * Worley
                // Better approach (Horizon Zero Dawn): Remap Perlin using Worley
                
                // Let's stick to a simpler "Cloud Shape" formula for this single channel texture
                // Cloud = Perlin * (Worley + offset)
                
                finalNoise = p * (worley + 0.2);

                // 4. Distance Falloff (Spherical) - Keep clouds contained in the box/sphere
                const dx = (x / size) - 0.5;
                const dy = (y / size) - 0.5;
                const dz = (z / size) - 0.5;
                const d = 1.0 - Math.sqrt(dx * dx + dy * dy + dz * dz) / 0.5;
                
                finalNoise *= Math.max(0, d);

                // Map to [0, 255]
                data[i] = Math.floor(Math.max(0, Math.min(255, finalNoise * 255)));
                i++;
            }
        }
    }

    // Create Three.js Data3DTexture
    const texture = new THREE.Data3DTexture(data, size, size, size);
    texture.format = THREE.RedFormat;
    texture.type = THREE.UnsignedByteType;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.RepeatWrapping; // Changed to Repeat for tiling if needed
    texture.wrapT = THREE.RepeatWrapping;
    texture.wrapR = THREE.RepeatWrapping;
    texture.needsUpdate = true;

    return texture;
}
