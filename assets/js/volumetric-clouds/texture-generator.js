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
                let value = 0;
                value += perlin.noise(nx / 1.5, ny, nz / 1.5) * 1.0;      // Octave 1 (Base) - Anisotropic like Three.js
                value += perlin.noise(nx * 2, ny * 2, nz * 2) * 0.5;      // Octave 2  
                value += perlin.noise(nx * 4, ny * 4, nz * 4) * 0.25;     // Octave 3

                // CRITICAL: Calculate spherical distance FIRST (Three.js method)
                const dx = (x / size) - 0.5;
                const dy = (y / size) - 0.5;
                const dz = (z / size) - 0.5;
                const d = 1.0 - Math.sqrt(dx * dx + dy * dy + dz * dz) / 0.5;
                
                // Three.js formula: (128 + 128 * noise) * d * d
                // This means: shift noise to [0, 256], then apply distance falloff
                const densityValue = (128 + 128 * value) * Math.max(0, d) * Math.max(0, d);

                // Map to [0, 255]
                data[i] = Math.floor(Math.max(0, Math.min(255, densityValue)));
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
