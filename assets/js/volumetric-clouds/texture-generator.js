import * as THREE from 'three';
import { ImprovedNoise } from './improved-noise.js';

/**
 * Generate a 3D Perlin noise texture for volumetric clouds
 * @param {number} size - Texture dimension (64 or 128 for size³ voxels)
 * @returns {THREE.Data3DTexture} - 3D texture with Perlin noise data
 */
export function generate3DTexture(size = 128) {
    const data = new Uint8Array(size * size * size);
    const perlin = new ImprovedNoise();

    // Scale factor for noise sampling
    // Lower scale = larger features (fluffier)
    const scale = 0.06;

    let i = 0;

    // Generate multi-octave Perlin noise
    for (let z = 0; z < size; z++) {
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Normalized coordinates
                const nx = x * scale;
                const ny = y * scale;
                const nz = z * scale;

                // Multi-octave noise (4 octaves)
                // Adjusted weights for more billowy look
                let value = 0;
                value += perlin.noise(nx, ny, nz) * 0.6;           // Octave 1 (Base shape)
                value += perlin.noise(nx * 2, ny * 2, nz * 2) * 0.3;      // Octave 2 (Detail)
                value += perlin.noise(nx * 4, ny * 4, nz * 4) * 0.15;     // Octave 3 (Fine detail)
                value += perlin.noise(nx * 8, ny * 8, nz * 8) * 0.05;     // Octave 4 (Micro detail)

                // Normalize and clamp
                // Bias towards transparency for fluffier edges
                value = Math.max(-1, Math.min(1, value));

                // Map to [0, 255]
                data[i] = Math.floor((value * 0.5 + 0.5) * 255);
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
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.wrapR = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;

    return texture;
}
