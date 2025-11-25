import * as THREE from 'three';
import { ImprovedNoise } from './improved-noise.js';

/**
 * Simple 3D Worley (Cellular) Noise
 * Returns distance to closest feature point (inverted)
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
                // Hash function
                const n = (ix + i) * 137 + (iy + j) * 149 + (iz + k) * 167;
                const h = (Math.sin(n) * 43758.5453123) % 1;
                
                // Random point in cell
                const rx = 0.5 + 0.5 * Math.sin(h * 6.28);
                const ry = 0.5 + 0.5 * Math.sin(h * 6.28 + 2.0);
                const rz = 0.5 + 0.5 * Math.sin(h * 6.28 + 4.0);

                const dx = (i + rx) - fx;
                const dy = (j + ry) - fy;
                const dz = (k + rz) - fz;

                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                minDist = Math.min(minDist, dist);
            }
        }
    }

    return 1.0 - minDist; // 1.0 = center, 0.0 = edge
}

/**
 * Generate a 3D Perlin-Worley noise texture
 * @param {number} size - Texture dimension (default 128)
 */
export function generate3DTexture(size = 128) {
    const data = new Uint8Array(size * size * size);
    const perlin = new ImprovedNoise();
    
    // Scale factors
    const perlinScale = 0.15; // Higher frequency for more clouds

    let i = 0;
    for (let z = 0; z < size; z++) {
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Normalized coordinates [0, 1]
                const u = x / size;
                const v = y / size;
                const w = z / size;

                // 1. Perlin Noise (Base Shape)
                // We use the integer-tiling property of ImprovedNoise
                const nx = x * perlinScale;
                const ny = y * perlinScale;
                const nz = z * perlinScale;

                let p = 0;
                p += perlin.noise(nx, ny, nz) * 1.0;
                p += perlin.noise(nx * 2, ny * 2, nz * 2) * 0.5;
                p += perlin.noise(nx * 4, ny * 4, nz * 4) * 0.25;
                p = (p + 1.0) * 0.5; // Remap to 0-1

                // 2. Worley Noise (Erosion/Detail)
                let worley = 0;
                worley += worley3D(u, v, w, 4) * 0.625;
                worley += worley3D(u, v, w, 8) * 0.25;
                worley += worley3D(u, v, w, 16) * 0.125;
                
                // 3. Combine: Perlin eroded by Worley
                // "Remap" Perlin using Worley
                // A simple approach: Perlin * (Worley + constant)
                let finalNoise = p * (worley + 0.2);
                
                // 4. Edge fade (Box) - prevent hard cuts at volume edges
                // Fade out at the very edges of the texture cube
                const edgeFade = Math.min(
                    Math.min(u, 1.0 - u),
                    Math.min(v, 1.0 - v),
                    Math.min(w, 1.0 - w)
                ) * 2.0; // Steep fade at edges
                
                finalNoise *= Math.min(1.0, edgeFade * 5.0); // Only fade very close to edge

                data[i] = Math.floor(Math.max(0, Math.min(255, finalNoise * 255)));
                i++;
            }
        }
    }

    const texture = new THREE.Data3DTexture(data, size, size, size);
    texture.format = THREE.RedFormat;
    texture.type = THREE.UnsignedByteType;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.wrapR = THREE.RepeatWrapping;
    texture.needsUpdate = true;

    return texture;
}
