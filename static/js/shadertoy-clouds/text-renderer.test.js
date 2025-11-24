/**
 * Unit tests for TextRenderer
 * 
 * Tests text mesh creation, text positioning, and font loading error handling.
 * 
 * Requirements: 6.1, 6.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { TextRenderer } from './text-renderer.js';

// Mock the FontLoader and TextGeometry
vi.mock('three/examples/jsm/loaders/FontLoader.js', () => ({
    FontLoader: vi.fn().mockImplementation(() => ({
        load: vi.fn()
    }))
}));

vi.mock('three/examples/jsm/geometries/TextGeometry.js', () => ({
    TextGeometry: vi.fn().mockImplementation((text, options) => {
        const geometry = new THREE.BufferGeometry();
        geometry.center = vi.fn();
        geometry._text = text;
        geometry._options = options;
        return geometry;
    })
}));

describe('TextRenderer', () => {
    describe('createTextMesh', () => {
        let mockFont;

        beforeEach(() => {
            mockFont = { isFont: true };
        });

        it('should create text mesh with default options', () => {
            const text = 'BASEET STUDIO';
            const mesh = TextRenderer.createTextMesh(text, mockFont);

            // Verify mesh is created
            expect(mesh).toBeInstanceOf(THREE.Mesh);
            expect(mesh.geometry).toBeDefined();
            expect(mesh.material).toBeDefined();

            // Verify material properties
            expect(mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial);
            expect(mesh.material.color.getHex()).toBe(0xffffff);
            expect(mesh.material.emissive.getHex()).toBe(0x4a6bc1);
            expect(mesh.material.emissiveIntensity).toBe(0.5);
            expect(mesh.material.metalness).toBe(0.3);
            expect(mesh.material.roughness).toBe(0.4);
        });

        it('should position text at correct z-coordinate', () => {
            const text = 'BASEET STUDIO';
            const mesh = TextRenderer.createTextMesh(text, mockFont);

            // Verify default position
            expect(mesh.position.z).toBe(-8);
        });

        it('should position text at custom z-coordinate', () => {
            const text = 'BASEET STUDIO';
            const customZ = -5;
            const mesh = TextRenderer.createTextMesh(text, mockFont, { positionZ: customZ });

            // Verify custom position
            expect(mesh.position.z).toBe(customZ);
        });

        it('should center text geometry', () => {
            const text = 'BASEET STUDIO';
            const mesh = TextRenderer.createTextMesh(text, mockFont);

            // Verify geometry.center() was called
            expect(mesh.geometry.center).toHaveBeenCalled();
        });

        it('should create text mesh with custom options', () => {
            const text = 'TEST TEXT';
            const customOptions = {
                size: 1.0,
                height: 0.3,
                color: 0xff0000,
                emissive: 0x00ff00,
                emissiveIntensity: 0.8,
                metalness: 0.5,
                roughness: 0.6,
                positionZ: -10
            };

            const mesh = TextRenderer.createTextMesh(text, mockFont, customOptions);

            // Verify custom material properties
            expect(mesh.material.color.getHex()).toBe(0xff0000);
            expect(mesh.material.emissive.getHex()).toBe(0x00ff00);
            expect(mesh.material.emissiveIntensity).toBe(0.8);
            expect(mesh.material.metalness).toBe(0.5);
            expect(mesh.material.roughness).toBe(0.6);

            // Verify custom position
            expect(mesh.position.z).toBe(-10);
        });

        it('should create geometry with correct text content', () => {
            const text = 'BASEET STUDIO';
            const mesh = TextRenderer.createTextMesh(text, mockFont);

            // Verify text content was passed to geometry
            expect(mesh.geometry._text).toBe(text);
        });

        it('should create geometry with correct font', () => {
            const text = 'BASEET STUDIO';
            const mesh = TextRenderer.createTextMesh(text, mockFont);

            // Verify font was passed to geometry
            expect(mesh.geometry._options.font).toBe(mockFont);
        });

        it('should create geometry with bevel enabled by default', () => {
            const text = 'BASEET STUDIO';
            const mesh = TextRenderer.createTextMesh(text, mockFont);

            // Verify bevel settings
            expect(mesh.geometry._options.bevelEnabled).toBe(true);
            expect(mesh.geometry._options.bevelThickness).toBe(0.03);
            expect(mesh.geometry._options.bevelSize).toBe(0.02);
            expect(mesh.geometry._options.bevelSegments).toBe(5);
        });

        it('should allow disabling bevel', () => {
            const text = 'BASEET STUDIO';
            const mesh = TextRenderer.createTextMesh(text, mockFont, { bevelEnabled: false });

            // Verify bevel is disabled
            expect(mesh.geometry._options.bevelEnabled).toBe(false);
        });
    });

    describe('loadFont', () => {
        it('should load font successfully', async () => {
            const mockFont = { isFont: true };
            const fontPath = '/fonts/helvetiker_bold.typeface.json';

            // Mock FontLoader to simulate successful load
            const { FontLoader } = await import('three/examples/jsm/loaders/FontLoader.js');
            const mockLoader = {
                load: vi.fn((path, onLoad) => {
                    onLoad(mockFont);
                })
            };
            FontLoader.mockImplementation(() => mockLoader);

            const font = await TextRenderer.loadFont(fontPath);

            expect(font).toBe(mockFont);
            expect(mockLoader.load).toHaveBeenCalledWith(
                fontPath,
                expect.any(Function),
                undefined,
                expect.any(Function)
            );
        });

        it('should handle font loading errors', async () => {
            const fontPath = '/fonts/missing.json';
            const error = new Error('Font not found');

            // Mock FontLoader to simulate error
            const { FontLoader } = await import('three/examples/jsm/loaders/FontLoader.js');
            const mockLoader = {
                load: vi.fn((path, onLoad, onProgress, onError) => {
                    onError(error);
                })
            };
            FontLoader.mockImplementation(() => mockLoader);

            await expect(TextRenderer.loadFont(fontPath)).rejects.toThrow('Font loading failed');
        });

        it('should use default font path when not specified', async () => {
            const mockFont = { isFont: true };
            const defaultPath = '/fonts/helvetiker_bold.typeface.json';

            // Mock FontLoader
            const { FontLoader } = await import('three/examples/jsm/loaders/FontLoader.js');
            const mockLoader = {
                load: vi.fn((path, onLoad) => {
                    onLoad(mockFont);
                })
            };
            FontLoader.mockImplementation(() => mockLoader);

            await TextRenderer.loadFont();

            expect(mockLoader.load).toHaveBeenCalledWith(
                defaultPath,
                expect.any(Function),
                undefined,
                expect.any(Function)
            );
        });
    });

    describe('createTextMeshWithFont', () => {
        it('should create text mesh with automatic font loading', async () => {
            const text = 'BASEET STUDIO';
            const mockFont = { isFont: true };

            // Mock loadFont
            const originalLoadFont = TextRenderer.loadFont;
            TextRenderer.loadFont = vi.fn().mockResolvedValue(mockFont);

            const mesh = await TextRenderer.createTextMeshWithFont(text);

            expect(TextRenderer.loadFont).toHaveBeenCalled();
            expect(mesh).toBeInstanceOf(THREE.Mesh);
            expect(mesh.position.z).toBe(-8);

            // Restore original method
            TextRenderer.loadFont = originalLoadFont;
        });

        it('should pass custom font path to loadFont', async () => {
            const text = 'TEST';
            const customFontPath = '/fonts/custom.json';
            const mockFont = { isFont: true };

            // Mock loadFont
            const originalLoadFont = TextRenderer.loadFont;
            TextRenderer.loadFont = vi.fn().mockResolvedValue(mockFont);

            await TextRenderer.createTextMeshWithFont(text, { fontPath: customFontPath });

            expect(TextRenderer.loadFont).toHaveBeenCalledWith(customFontPath);

            // Restore original method
            TextRenderer.loadFont = originalLoadFont;
        });

        it('should handle font loading errors in createTextMeshWithFont', async () => {
            const text = 'TEST';
            const error = new Error('Font load failed');

            // Mock loadFont to reject
            const originalLoadFont = TextRenderer.loadFont;
            TextRenderer.loadFont = vi.fn().mockRejectedValue(error);

            await expect(TextRenderer.createTextMeshWithFont(text)).rejects.toThrow();

            // Restore original method
            TextRenderer.loadFont = originalLoadFont;
        });

        it('should pass options to createTextMesh', async () => {
            const text = 'TEST';
            const mockFont = { isFont: true };
            const customOptions = {
                size: 1.5,
                positionZ: -10,
                color: 0xff0000
            };

            // Mock loadFont
            const originalLoadFont = TextRenderer.loadFont;
            TextRenderer.loadFont = vi.fn().mockResolvedValue(mockFont);

            const mesh = await TextRenderer.createTextMeshWithFont(text, customOptions);

            expect(mesh.position.z).toBe(-10);
            expect(mesh.material.color.getHex()).toBe(0xff0000);

            // Restore original method
            TextRenderer.loadFont = originalLoadFont;
        });
    });
});
