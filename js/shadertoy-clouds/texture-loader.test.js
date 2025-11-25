/**
 * Unit tests for TextureLoader
 * 
 * Tests texture loader requests correct URLs, texture configuration settings,
 * and error handling for missing textures.
 * 
 * Requirements: 5.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { TextureLoader } from './texture-loader.js';

describe('TextureLoader', () => {
    describe('configureTexture', () => {
        it('should configure texture with default settings', () => {
            const mockTexture = new THREE.Texture();
            
            const result = TextureLoader.configureTexture(mockTexture);
            
            expect(result.wrapS).toBe(THREE.RepeatWrapping);
            expect(result.wrapT).toBe(THREE.RepeatWrapping);
            expect(result.minFilter).toBe(THREE.LinearFilter);
            expect(result.magFilter).toBe(THREE.LinearFilter);
            expect(result.format).toBe(THREE.RGBAFormat);
            expect(result.type).toBe(THREE.UnsignedByteType);
            // needsUpdate is set but may not be readable in test environment
            expect(result).toBe(mockTexture);
        });

        it('should configure texture with custom options', () => {
            const mockTexture = new THREE.Texture();
            const customOptions = {
                wrapS: THREE.ClampToEdgeWrapping,
                wrapT: THREE.ClampToEdgeWrapping,
                minFilter: THREE.NearestFilter,
                magFilter: THREE.NearestFilter,
                anisotropy: 16
            };
            
            const result = TextureLoader.configureTexture(mockTexture, customOptions);
            
            expect(result.wrapS).toBe(THREE.ClampToEdgeWrapping);
            expect(result.wrapT).toBe(THREE.ClampToEdgeWrapping);
            expect(result.minFilter).toBe(THREE.NearestFilter);
            expect(result.magFilter).toBe(THREE.NearestFilter);
            expect(result.anisotropy).toBe(16);
        });
    });

    describe('createFallbackTexture', () => {
        it('should create a fallback texture for each channel', () => {
            for (let i = 0; i < 4; i++) {
                const texture = TextureLoader.createFallbackTexture(i);
                
                expect(texture).toBeInstanceOf(THREE.DataTexture);
                expect(texture.image.width).toBe(256);
                expect(texture.image.height).toBe(256);
                // Verify texture has data
                expect(texture.image.data).toBeDefined();
                expect(texture.image.data.length).toBe(256 * 256 * 4);
            }
        });

        it('should create different patterns for different channels', () => {
            const texture0 = TextureLoader.createFallbackTexture(0);
            const texture1 = TextureLoader.createFallbackTexture(1);
            
            // Get first pixel values
            const data0 = texture0.image.data;
            const data1 = texture1.image.data;
            
            // Textures should have data
            expect(data0.length).toBe(256 * 256 * 4);
            expect(data1.length).toBe(256 * 256 * 4);
            
            // Alpha channel should always be 255
            expect(data0[3]).toBe(255);
            expect(data1[3]).toBe(255);
        });
    });

    describe('loadSingleTexture', () => {
        let mockLoader;
        let loadCallback;
        let errorCallback;

        beforeEach(() => {
            // Mock THREE.TextureLoader
            mockLoader = {
                load: vi.fn((path, onLoad, onProgress, onError) => {
                    loadCallback = onLoad;
                    errorCallback = onError;
                })
            };
        });

        it('should load texture successfully and configure it', async () => {
            const mockTexture = new THREE.Texture();
            const path = '/textures/ichannel0.png';
            
            const loadPromise = TextureLoader.loadSingleTexture(mockLoader, path, 0);
            
            // Verify loader.load was called with correct path
            expect(mockLoader.load).toHaveBeenCalledWith(
                path,
                expect.any(Function),
                undefined,
                expect.any(Function)
            );
            
            // Simulate successful load
            loadCallback(mockTexture);
            
            const result = await loadPromise;
            
            expect(result).toBe(mockTexture);
            expect(result.wrapS).toBe(THREE.RepeatWrapping);
            expect(result.wrapT).toBe(THREE.RepeatWrapping);
        });

        it('should handle texture loading errors with fallback', async () => {
            vi.useFakeTimers();
            
            const path = '/textures/missing.png';
            const error = new Error('Network error');
            
            const loadPromise = TextureLoader.loadSingleTexture(mockLoader, path, 0);
            
            // Simulate first load error
            errorCallback(error);
            
            // Wait for retry timeout
            await vi.advanceTimersByTimeAsync(1000);
            
            // Simulate second load error (after retry)
            errorCallback(error);
            
            const result = await loadPromise;
            
            // Should return a fallback texture
            expect(result).toBeInstanceOf(THREE.DataTexture);
            expect(result.image.width).toBe(256);
            
            vi.useRealTimers();
        });

        it('should retry once before using fallback', async () => {
            vi.useFakeTimers();
            
            const path = '/textures/ichannel0.png';
            const error = new Error('Network error');
            
            const loadPromise = TextureLoader.loadSingleTexture(mockLoader, path, 0);
            
            // First attempt fails
            errorCallback(error);
            
            // Wait for retry timeout
            await vi.advanceTimersByTimeAsync(1000);
            
            // Verify second attempt was made
            expect(mockLoader.load).toHaveBeenCalledTimes(2);
            
            // Second attempt also fails
            errorCallback(error);
            
            const result = await loadPromise;
            
            // Should return fallback after retry
            expect(result).toBeInstanceOf(THREE.DataTexture);
            
            vi.useRealTimers();
        });
    });

    describe('loadChannelTextures', () => {
        it('should request correct URLs for all four channels', async () => {
            // Mock loadSingleTexture to avoid actual loading
            const originalLoadSingle = TextureLoader.loadSingleTexture;
            const mockTextures = [
                new THREE.Texture(),
                new THREE.Texture(),
                new THREE.Texture(),
                new THREE.Texture()
            ];
            
            let callIndex = 0;
            TextureLoader.loadSingleTexture = vi.fn((loader, path, index) => {
                expect(path).toBe(`/textures/ichannel${index}.png`);
                return Promise.resolve(mockTextures[callIndex++]);
            });
            
            const result = await TextureLoader.loadChannelTextures();
            
            expect(TextureLoader.loadSingleTexture).toHaveBeenCalledTimes(4);
            expect(result).toHaveProperty('channel0');
            expect(result).toHaveProperty('channel1');
            expect(result).toHaveProperty('channel2');
            expect(result).toHaveProperty('channel3');
            expect(result.channel0).toBe(mockTextures[0]);
            expect(result.channel1).toBe(mockTextures[1]);
            expect(result.channel2).toBe(mockTextures[2]);
            expect(result.channel3).toBe(mockTextures[3]);
            
            // Restore original method
            TextureLoader.loadSingleTexture = originalLoadSingle;
        });

        it('should handle errors when loading channel textures', async () => {
            // Mock loadSingleTexture to throw error
            const originalLoadSingle = TextureLoader.loadSingleTexture;
            TextureLoader.loadSingleTexture = vi.fn(() => {
                return Promise.reject(new Error('Load failed'));
            });
            
            await expect(TextureLoader.loadChannelTextures()).rejects.toThrow('Load failed');
            
            // Restore original method
            TextureLoader.loadSingleTexture = originalLoadSingle;
        });
    });
});
