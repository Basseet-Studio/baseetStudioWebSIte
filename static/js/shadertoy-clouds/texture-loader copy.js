/**
 * TextureLoader - Handles loading and configuration of iChannel textures for Shadertoy shaders
 * 
 * This module provides functionality to load the four iChannel textures used in the
 * Shadertoy volumetric cloud shader and configure them with appropriate settings
 * for seamless tiling and smooth interpolation.
 */

import * as THREE from 'three';

/**
 * TextureLoader class for managing Shadertoy iChannel textures
 */
export class TextureLoader {
    /**
     * Load all four iChannel textures asynchronously
     * 
     * @returns {Promise<Object>} Object containing channel0, channel1, channel2, channel3 textures
     * @throws {Error} If texture loading fails after retry
     */
    static async loadChannelTextures() {
        const texturePaths = [
            '/textures/ichannel0.png',
            '/textures/ichannel1.png',
            '/textures/ichannel2.png',
            '/textures/ichannel3.png'
        ];

        const loader = new THREE.TextureLoader();
        
        try {
            // Load all textures in parallel
            const texturePromises = texturePaths.map((path, index) => 
                this.loadSingleTexture(loader, path, index)
            );
            
            const textures = await Promise.all(texturePromises);
            
            return {
                channel0: textures[0],
                channel1: textures[1],
                channel2: textures[2],
                channel3: textures[3]
            };
        } catch (error) {
            console.error('Failed to load channel textures:', error);
            throw error;
        }
    }

    /**
     * Load a single texture with retry logic and fallback
     * 
     * @param {THREE.TextureLoader} loader - Three.js texture loader instance
     * @param {string} path - Path to the texture file
     * @param {number} channelIndex - Index of the channel (0-3)
     * @returns {Promise<THREE.Texture>} Loaded and configured texture
     */
    static async loadSingleTexture(loader, path, channelIndex) {
        return new Promise((resolve, reject) => {
            let retryCount = 0;
            const maxRetries = 1;

            const attemptLoad = () => {
                console.log(`DEBUG - Attempting to load texture: ${path}`);
                loader.load(
                    path,
                    // Success callback
                    (texture) => {
                        this.configureTexture(texture);
                        console.log(`DEBUG - Loaded texture: ${path}`, {
                            width: texture.image?.width,
                            height: texture.image?.height,
                            format: texture.format,
                            wrapS: texture.wrapS,
                            wrapT: texture.wrapT,
                            minFilter: texture.minFilter,
                            magFilter: texture.magFilter
                        });
                        resolve(texture);
                    },
                    // Progress callback
                    (progress) => {
                        if (progress.lengthComputable) {
                            console.log(`DEBUG - Loading ${path}: ${Math.round(progress.loaded / progress.total * 100)}%`);
                        }
                    },
                    // Error callback
                    (error) => {
                        console.warn(`DEBUG - Failed to load texture ${path} (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
                        
                        if (retryCount < maxRetries) {
                            retryCount++;
                            console.log(`DEBUG - Retrying texture load: ${path}`);
                            setTimeout(attemptLoad, 1000);
                        } else {
                            // Create fallback texture
                            console.warn(`DEBUG - Using fallback texture for channel ${channelIndex}`);
                            const fallbackTexture = this.createFallbackTexture(channelIndex);
                            this.configureTexture(fallbackTexture);
                            console.log(`DEBUG - Fallback texture created for channel ${channelIndex}:`, {
                                width: fallbackTexture.image?.width,
                                height: fallbackTexture.image?.height
                            });
                            resolve(fallbackTexture);
                        }
                    }
                );
            };

            attemptLoad();
        });
    }

    /**
     * Configure texture with proper wrapping and filtering for Shadertoy shaders
     * 
     * @param {THREE.Texture} texture - Texture to configure
     * @param {Object} options - Optional configuration overrides
     * @returns {THREE.Texture} Configured texture
     */
    static configureTexture(texture, options = {}) {
        // Set wrapping mode for seamless tiling
        texture.wrapS = options.wrapS || THREE.RepeatWrapping;
        texture.wrapT = options.wrapT || THREE.RepeatWrapping;
        
        // Set filtering for smooth interpolation
        texture.minFilter = options.minFilter || THREE.LinearFilter;
        texture.magFilter = options.magFilter || THREE.LinearFilter;
        
        // Set format and type
        texture.format = options.format || THREE.RGBAFormat;
        texture.type = options.type || THREE.UnsignedByteType;
        
        // Enable anisotropic filtering if available
        if (options.anisotropy !== undefined) {
            texture.anisotropy = options.anisotropy;
        }
        
        // Mark texture as needing update
        texture.needsUpdate = true;
        
        return texture;
    }

    /**
     * Create a procedurally generated fallback texture
     * 
     * @param {number} channelIndex - Index of the channel (0-3)
     * @returns {THREE.DataTexture} Procedurally generated noise texture
     */
    static createFallbackTexture(channelIndex) {
        const size = 256;
        const data = new Uint8Array(size * size * 4);
        
        // Generate simple noise pattern based on channel index
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const index = (i * size + j) * 4;
                
                // Different noise patterns for different channels
                let value;
                switch (channelIndex) {
                    case 0: // White noise
                        value = Math.random() * 255;
                        break;
                    case 1: // Blue noise approximation
                        value = (Math.sin(i * 0.1) * Math.cos(j * 0.1) + 1) * 127.5;
                        break;
                    case 2: // Perlin-like noise approximation
                        value = (Math.sin(i * 0.05) * Math.sin(j * 0.05) + 1) * 127.5;
                        break;
                    case 3: // Gradient noise
                        value = ((i + j) / (size * 2)) * 255;
                        break;
                    default:
                        value = 128;
                }
                
                data[index] = value;
                data[index + 1] = value;
                data[index + 2] = value;
                data[index + 3] = 255;
            }
        }
        
        const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
        texture.needsUpdate = true;
        
        return texture;
    }
}
