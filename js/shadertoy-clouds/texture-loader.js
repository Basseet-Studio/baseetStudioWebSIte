/**
 * TextureLoader - Handles loading and configuration of iChannel textures for Shadertoy shaders
 * 
 * This module provides functionality to generate the four iChannel textures used in the
 * Shadertoy volumetric cloud shader. Since Shadertoy's original textures are not easily
 * accessible, we generate compatible noise textures procedurally.
 * 
 * Channel 0: 256x256 RGBA noise texture (for 3D noise via 2D lookup)
 * Channel 1: 256x256 blue noise texture (for dithering)
 * Channel 2: Not used in NOISE_METHOD 1 (optional 3D texture)
 * Channel 3: Not used (optional additional texture)
 */

import * as THREE from 'three';

/**
 * TextureLoader class for managing Shadertoy iChannel textures
 */
export class TextureLoader {
    /**
     * Generate all four iChannel textures
     * 
     * @returns {Promise<Object>} Object containing channel0, channel1, channel2, channel3 textures
     */
    static async loadChannelTextures() {
        console.log('Generating procedural noise textures...');
        
        // Generate noise textures procedurally (matches Shadertoy's built-in textures)
        const channel0 = this.createGrayNoiseTexture(256);
        const channel1 = this.createBlueNoiseTexture(256);
        const channel2 = this.createGrayNoiseTexture(256); // Fallback for 3D noise
        const channel3 = this.createGrayNoiseTexture(256); // Optional
        
        console.log('Procedural noise textures generated');
        
        return {
            channel0: channel0,
            channel1: channel1,
            channel2: channel2,
            channel3: channel3
        };
    }

    /**
     * Create a 256x256 gray noise texture compatible with Shadertoy's iChannel0
     * This texture is used for 3D noise lookups via 2D texture sampling
     * 
     * The noise function uses: texture2D(iChannel0, (uv + 0.5) / 256.0).yx
     * So we need RGBA where R and G contain independent noise values
     * 
     * @param {number} size - Texture size (default 256)
     * @returns {THREE.DataTexture} Gray noise texture
     */
    static createGrayNoiseTexture(size = 256) {
        const data = new Uint8Array(size * size * 4);
        
        // Use a seeded random for reproducible noise
        let seed = 12345;
        const seededRandom = () => {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            return seed / 0x7fffffff;
        };
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const index = (y * size + x) * 4;
                
                // Generate independent noise values for R and G channels
                // These are used by the shader's noise() function
                const r = Math.floor(seededRandom() * 256);
                const g = Math.floor(seededRandom() * 256);
                const b = Math.floor(seededRandom() * 256);
                const a = 255;
                
                data[index] = r;
                data[index + 1] = g;
                data[index + 2] = b;
                data[index + 3] = a;
            }
        }
        
        const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        
        return texture;
    }

    /**
     * Create a blue noise texture for dithering (iChannel1)
     * Blue noise provides better visual quality for dithering than white noise
     * 
     * The shader uses: texture2D(iChannel1, fragCoord & 255 / 256.0).x
     * 
     * @param {number} size - Texture size (default 256)
     * @returns {THREE.DataTexture} Blue noise texture
     */
    static createBlueNoiseTexture(size = 256) {
        const data = new Uint8Array(size * size * 4);
        
        // Generate blue noise using a simple void-and-cluster approximation
        // For better quality, you would use a proper blue noise algorithm
        // This is a simplified version that provides reasonable dithering
        
        // Start with white noise
        const values = new Float32Array(size * size);
        let seed = 54321;
        const seededRandom = () => {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            return seed / 0x7fffffff;
        };
        
        for (let i = 0; i < size * size; i++) {
            values[i] = seededRandom();
        }
        
        // Simple blue noise approximation using high-pass filtered noise
        // This isn't true blue noise but provides better dithering than white noise
        const blueNoise = new Float32Array(size * size);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = y * size + x;
                let sum = 0;
                let count = 0;
                
                // Sample neighbors
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = (x + dx + size) % size;
                        const ny = (y + dy + size) % size;
                        sum += values[ny * size + nx];
                        count++;
                    }
                }
                
                // High-pass filter: original - low-pass
                const avg = sum / count;
                blueNoise[idx] = values[idx] - avg * 0.5 + 0.5;
                blueNoise[idx] = Math.max(0, Math.min(1, blueNoise[idx]));
            }
        }
        
        // Convert to texture data
        for (let i = 0; i < size * size; i++) {
            const value = Math.floor(blueNoise[i] * 255);
            const idx = i * 4;
            data[idx] = value;
            data[idx + 1] = value;
            data[idx + 2] = value;
            data[idx + 3] = 255;
        }
        
        const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.minFilter = THREE.NearestFilter; // Use nearest for dithering
        texture.magFilter = THREE.NearestFilter;
        texture.needsUpdate = true;
        
        return texture;
    }

    /**
     * Configure texture with proper wrapping and filtering for Shadertoy shaders
     * 
     * @param {THREE.Texture} texture - Texture to configure
     * @param {Object} options - Optional configuration overrides
     * @returns {THREE.Texture} Configured texture
     */
    static configureTexture(texture, options = {}) {
        texture.wrapS = options.wrapS || THREE.RepeatWrapping;
        texture.wrapT = options.wrapT || THREE.RepeatWrapping;
        texture.minFilter = options.minFilter || THREE.LinearFilter;
        texture.magFilter = options.magFilter || THREE.LinearFilter;
        texture.format = options.format || THREE.RGBAFormat;
        texture.type = options.type || THREE.UnsignedByteType;
        texture.needsUpdate = true;
        return texture;
    }
}
