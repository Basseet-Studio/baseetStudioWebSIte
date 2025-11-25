/**
 * TextRenderer - Handles 3D text mesh creation for "BASEET STUDIO"
 * 
 * This module provides functionality to create and configure 3D text meshes
 * that float within the volumetric cloud scene. The text uses Three.js
 * TextGeometry with proper materials and positioning.
 */

import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

/**
 * TextRenderer class for managing 3D text in the cloud scene
 */
export class TextRenderer {
    /**
     * Load a font for text rendering
     * 
     * @param {string} fontPath - Path to the font JSON file
     * @returns {Promise<THREE.Font>} Loaded font object
     * @throws {Error} If font loading fails
     */
    static async loadFont(fontPath = '/fonts/helvetiker_bold.typeface.json') {
        return new Promise((resolve, reject) => {
            const loader = new FontLoader();
            
            loader.load(
                fontPath,
                // Success callback
                (font) => {
                    console.log(`Loaded font: ${fontPath}`);
                    resolve(font);
                },
                // Progress callback
                undefined,
                // Error callback
                (error) => {
                    console.error(`Failed to load font ${fontPath}:`, error);
                    reject(new Error(`Font loading failed: ${error.message || 'Unknown error'}`));
                }
            );
        });
    }

    /**
     * Create a 3D text mesh with the specified text and options
     * 
     * @param {string} text - Text content to render (e.g., "BASEET STUDIO")
     * @param {THREE.Font} font - Loaded font object
     * @param {Object} options - Configuration options
     * @param {number} options.size - Font size (default: 0.8)
     * @param {number} options.height - Text extrusion depth (default: 0.2)
     * @param {number} options.curveSegments - Number of curve segments (default: 12)
     * @param {boolean} options.bevelEnabled - Enable beveling (default: true)
     * @param {number} options.bevelThickness - Bevel thickness (default: 0.03)
     * @param {number} options.bevelSize - Bevel size (default: 0.02)
     * @param {number} options.bevelSegments - Bevel segments (default: 5)
     * @param {number} options.color - Material color (default: 0xffffff)
     * @param {number} options.emissive - Emissive color (default: 0x4a6bc1)
     * @param {number} options.emissiveIntensity - Emissive intensity (default: 0.5)
     * @param {number} options.metalness - Material metalness (default: 0.3)
     * @param {number} options.roughness - Material roughness (default: 0.4)
     * @param {number} options.positionZ - Z position in scene (default: -8)
     * @returns {THREE.Mesh} Configured text mesh
     */
    static createTextMesh(text, font, options = {}) {
        // Merge options with defaults
        const config = {
            size: options.size !== undefined ? options.size : 0.8,
            height: options.height !== undefined ? options.height : 0.2,
            curveSegments: options.curveSegments !== undefined ? options.curveSegments : 12,
            bevelEnabled: options.bevelEnabled !== undefined ? options.bevelEnabled : true,
            bevelThickness: options.bevelThickness !== undefined ? options.bevelThickness : 0.03,
            bevelSize: options.bevelSize !== undefined ? options.bevelSize : 0.02,
            bevelSegments: options.bevelSegments !== undefined ? options.bevelSegments : 5,
            color: options.color !== undefined ? options.color : 0xffffff,
            emissive: options.emissive !== undefined ? options.emissive : 0x4a6bc1,
            emissiveIntensity: options.emissiveIntensity !== undefined ? options.emissiveIntensity : 0.5,
            metalness: options.metalness !== undefined ? options.metalness : 0.3,
            roughness: options.roughness !== undefined ? options.roughness : 0.4,
            positionZ: options.positionZ !== undefined ? options.positionZ : -8
        };

        // Create text geometry
        const geometry = new TextGeometry(text, {
            font: font,
            size: config.size,
            height: config.height,
            curveSegments: config.curveSegments,
            bevelEnabled: config.bevelEnabled,
            bevelThickness: config.bevelThickness,
            bevelSize: config.bevelSize,
            bevelSegments: config.bevelSegments
        });

        // Center the geometry
        geometry.center();

        // Create material with emissive properties
        const material = new THREE.MeshStandardMaterial({
            color: config.color,
            emissive: config.emissive,
            emissiveIntensity: config.emissiveIntensity,
            metalness: config.metalness,
            roughness: config.roughness
        });

        // Create mesh
        const textMesh = new THREE.Mesh(geometry, material);

        // Position text in cloud volume
        textMesh.position.z = config.positionZ;

        return textMesh;
    }

    /**
     * Create a 3D text mesh with automatic font loading
     * 
     * @param {string} text - Text content to render
     * @param {Object} options - Configuration options (same as createTextMesh)
     * @param {string} options.fontPath - Path to font file (default: '/fonts/helvetiker_bold.typeface.json')
     * @returns {Promise<THREE.Mesh>} Configured text mesh
     */
    static async createTextMeshWithFont(text, options = {}) {
        const fontPath = options.fontPath || '/fonts/helvetiker_bold.typeface.json';
        
        try {
            const font = await this.loadFont(fontPath);
            return this.createTextMesh(text, font, options);
        } catch (error) {
            console.error('Failed to create text mesh:', error);
            throw error;
        }
    }
}
