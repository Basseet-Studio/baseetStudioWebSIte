/**
 * TextureLoader - Handles loading and configuration of iChannel textures for Shadertoy shaders
 * 
 * This module loads real noise texture images for the volumetric cloud shader.
 * Using real textures instead of procedural generation produces much better results
 * without artifacts like straight lines or grid patterns.
 * 
 * Channel 0: Gray noise texture (for 3D noise via 2D lookup) - smooth cloud-like noise
 * Channel 1: Blue/white noise texture (for dithering) - TV static style
 * Channel 2: Optional additional texture
 * Channel 3: Optional additional texture
 */

import * as THREE from 'three';

/**
 * TextureLoader class for managing Shadertoy iChannel textures
 */
export class TextureLoader {
    /**
     * Load all four iChannel textures from image files
     * 
     * @returns {Promise<Object>} Object containing channel0, channel1, channel2, channel3 textures
     */
    static async loadChannelTextures() {
        console.log('Loading noise textures from image files...');
        
        const loader = new THREE.TextureLoader();
        
        // Define texture paths - using real noise images
        const texturePaths = {
            // Gray noise (smooth bubbles) - for cloud volume noise
            channel0: '/baseetStudioWebSIte/textures/gray-noise-256.png',
            // Blue/white noise (TV static) - for dithering
            channel1: '/baseetStudioWebSIte/textures/blue-noise-256.png',
            // Fallbacks use the same textures
            channel2: '/baseetStudioWebSIte/textures/gray-noise-256.png',
            channel3: '/baseetStudioWebSIte/textures/blue-noise-256.png'
        };
        
        try {
            // Load all textures in parallel
            const [channel0, channel1, channel2, channel3] = await Promise.all([
                this.loadTexture(loader, texturePaths.channel0, {
                    wrapS: THREE.RepeatWrapping,
                    wrapT: THREE.RepeatWrapping,
                    minFilter: THREE.LinearMipMapLinearFilter,
                    magFilter: THREE.LinearFilter,
                    generateMipmaps: true
                }),
                this.loadTexture(loader, texturePaths.channel1, {
                    wrapS: THREE.RepeatWrapping,
                    wrapT: THREE.RepeatWrapping,
                    minFilter: THREE.LinearFilter,
                    magFilter: THREE.LinearFilter,
                    generateMipmaps: false
                }),
                this.loadTexture(loader, texturePaths.channel2, {
                    wrapS: THREE.RepeatWrapping,
                    wrapT: THREE.RepeatWrapping,
                    minFilter: THREE.LinearFilter,
                    magFilter: THREE.LinearFilter,
                    generateMipmaps: false
                }),
                this.loadTexture(loader, texturePaths.channel3, {
                    wrapS: THREE.RepeatWrapping,
                    wrapT: THREE.RepeatWrapping,
                    minFilter: THREE.LinearFilter,
                    magFilter: THREE.LinearFilter,
                    generateMipmaps: false
                })
            ]);
            
            console.log('All noise textures loaded successfully');
            
            return {
                channel0,
                channel1,
                channel2,
                channel3
            };
        } catch (error) {
            console.warn('Failed to load texture images, falling back to procedural generation:', error);
            // Fall back to procedural generation if images fail to load
            return this.generateProceduralTextures();
        }
    }
    
    /**
     * Load a single texture with configuration
     * 
     * @param {THREE.TextureLoader} loader - The texture loader instance
     * @param {string} path - Path to the texture file
     * @param {Object} options - Texture configuration options
     * @returns {Promise<THREE.Texture>} Loaded and configured texture
     */
    static loadTexture(loader, path, options = {}) {
        return new Promise((resolve, reject) => {
            loader.load(
                path,
                (texture) => {
                    // Apply configuration
                    texture.wrapS = options.wrapS || THREE.RepeatWrapping;
                    texture.wrapT = options.wrapT || THREE.RepeatWrapping;
                    texture.minFilter = options.minFilter || THREE.LinearFilter;
                    texture.magFilter = options.magFilter || THREE.LinearFilter;
                    texture.generateMipmaps = options.generateMipmaps !== false;
                    texture.needsUpdate = true;
                    
                    console.log(`Loaded texture: ${path} (${texture.image.width}x${texture.image.height})`);
                    resolve(texture);
                },
                undefined, // onProgress
                (error) => {
                    console.error(`Failed to load texture: ${path}`, error);
                    reject(error);
                }
            );
        });
    }
    
    /**
     * Fallback: Generate procedural textures if image loading fails
     * 
     * @returns {Object} Object containing procedurally generated textures
     */
    static generateProceduralTextures() {
        console.log('Generating fallback procedural noise textures...');
        
        const channel0 = this.createGrayNoiseTexture(256);
        const channel1 = this.createWhiteNoiseTexture(256);
        const channel2 = this.createGrayNoiseTexture(256);
        const channel3 = this.createWhiteNoiseTexture(256);
        
        return { channel0, channel1, channel2, channel3 };
    }

    /**
     * Create a gray noise texture (fallback)
     * Uses simple white noise - not as good as real textures but works
     * 
     * @param {number} size - Texture size (default 256)
     * @returns {THREE.DataTexture} Gray noise texture
     */
    static createGrayNoiseTexture(size = 256) {
        const data = new Uint8Array(size * size * 4);
        
        let seed = 12345;
        const seededRandom = () => {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            return seed / 0x7fffffff;
        };
        
        for (let i = 0; i < size * size; i++) {
            const idx = i * 4;
            // Independent random values for R, G, B channels
            data[idx] = Math.floor(seededRandom() * 256);
            data[idx + 1] = Math.floor(seededRandom() * 256);
            data[idx + 2] = Math.floor(seededRandom() * 256);
            data[idx + 3] = 255;
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
     * Create a white noise texture for dithering (fallback)
     * 
     * @param {number} size - Texture size (default 256)
     * @returns {THREE.DataTexture} White noise texture
     */
    static createWhiteNoiseTexture(size = 256) {
        const data = new Uint8Array(size * size * 4);
        
        let seed = 54321;
        const seededRandom = () => {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            return seed / 0x7fffffff;
        };
        
        for (let i = 0; i < size * size; i++) {
            const value = Math.floor(seededRandom() * 256);
            const idx = i * 4;
            data[idx] = value;
            data[idx + 1] = value;
            data[idx + 2] = value;
            data[idx + 3] = 255;
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
