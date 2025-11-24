/**
 * Tests for Shadertoy Shaders
 * 
 * Includes both unit tests and property-based tests for shader compilation
 * and uniform configuration.
 * 
 * Requirements: 5.1, 5.2, 5.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as THREE from 'three';
import { vertexShader, fragmentShader, getShaderConfig } from './shadertoy-shaders.js';

describe('Shadertoy Shaders', () => {
    describe('Shader Source', () => {
        it('should contain required uniforms in fragment shader', () => {
            // Test that shader source contains all required Shadertoy-to-Three.js uniform mappings
            expect(fragmentShader).toContain('uniform float uTime');
            expect(fragmentShader).toContain('uniform vec2 uResolution');
            expect(fragmentShader).toContain('uniform vec2 uMouse');
            expect(fragmentShader).toContain('uniform float uScroll');
            expect(fragmentShader).toContain('uniform sampler2D uChannel0');
            expect(fragmentShader).toContain('uniform sampler2D uChannel1');
            expect(fragmentShader).toContain('uniform sampler2D uChannel2');
            expect(fragmentShader).toContain('uniform sampler2D uChannel3');
            expect(fragmentShader).toContain('uniform int uLookMode');
            expect(fragmentShader).toContain('uniform int uNoiseMethod');
            expect(fragmentShader).toContain('uniform int uUseLOD');
        });

        it('should contain required functions in fragment shader', () => {
            // Test that shader implements all required cloud density functions
            expect(fragmentShader).toContain('float map5(');
            expect(fragmentShader).toContain('float map4(');
            expect(fragmentShader).toContain('float map3(');
            expect(fragmentShader).toContain('float map2(');
            expect(fragmentShader).toContain('float noise(');
            expect(fragmentShader).toContain('vec4 raymarch(');
            expect(fragmentShader).toContain('vec4 render(');
            expect(fragmentShader).toContain('mat3 setCamera(');
        });

        it('should use Three.js conventions instead of Shadertoy variables', () => {
            // Verify Shadertoy variables are NOT used as actual variables (only in comments is OK)
            // Check that they're not used in actual GLSL code by looking for them without comment context
            const codeWithoutComments = fragmentShader.replace(/\/\/.*$/gm, '');
            expect(codeWithoutComments).not.toMatch(/\biTime\b/);
            expect(codeWithoutComments).not.toMatch(/\biResolution\b/);
            expect(codeWithoutComments).not.toMatch(/\biMouse\b/);
            expect(codeWithoutComments).not.toMatch(/\biChannel0\b/);
            expect(codeWithoutComments).not.toMatch(/\biChannel1\b/);
            
            // Verify Three.js uniforms ARE used
            expect(fragmentShader).toContain('uTime');
            expect(fragmentShader).toContain('uResolution');
            expect(fragmentShader).toContain('uMouse');
            expect(fragmentShader).toContain('uChannel0');
            expect(fragmentShader).toContain('uChannel1');
        });

        it('should contain vUv and vWorldPosition in vertex shader', () => {
            expect(vertexShader).toContain('varying vec2 vUv');
            expect(vertexShader).toContain('varying vec3 vWorldPosition');
            expect(vertexShader).toContain('vUv = uv');
            expect(vertexShader).toContain('vWorldPosition');
        });
    });

    describe('Shader Compilation', () => {
        it('should compile vertex shader without errors', () => {
            // Create a minimal WebGL context to test shader compilation
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) {
                console.warn('WebGL not available, skipping shader compilation test');
                return;
            }
            
            const shader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(shader, vertexShader);
            gl.compileShader(shader);
            
            const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
            if (!compiled) {
                const error = gl.getShaderInfoLog(shader);
                console.error('Vertex shader compilation error:', error);
            }
            
            expect(compiled).toBe(true);
        });

        it('should compile fragment shader without errors', () => {
            // Create a minimal WebGL context to test shader compilation
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) {
                console.warn('WebGL not available, skipping shader compilation test');
                return;
            }
            
            const shader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(shader, fragmentShader);
            gl.compileShader(shader);
            
            const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
            if (!compiled) {
                const error = gl.getShaderInfoLog(shader);
                console.error('Fragment shader compilation error:', error);
            }
            
            expect(compiled).toBe(true);
        });
    });

    describe('getShaderConfig', () => {
        it('should create shader config with all required uniforms', () => {
            const mockTextures = {
                channel0: new THREE.Texture(),
                channel1: new THREE.Texture(),
                channel2: new THREE.Texture(),
                channel3: new THREE.Texture()
            };
            
            const config = getShaderConfig(mockTextures);
            
            // Verify all required uniforms exist
            expect(config.uniforms).toHaveProperty('uTime');
            expect(config.uniforms).toHaveProperty('uResolution');
            expect(config.uniforms).toHaveProperty('uMouse');
            expect(config.uniforms).toHaveProperty('uScroll');
            expect(config.uniforms).toHaveProperty('uChannel0');
            expect(config.uniforms).toHaveProperty('uChannel1');
            expect(config.uniforms).toHaveProperty('uChannel2');
            expect(config.uniforms).toHaveProperty('uChannel3');
            expect(config.uniforms).toHaveProperty('uLookMode');
            expect(config.uniforms).toHaveProperty('uNoiseMethod');
            expect(config.uniforms).toHaveProperty('uUseLOD');
            
            // Verify shaders are included
            expect(config.vertexShader).toBe(vertexShader);
            expect(config.fragmentShader).toBe(fragmentShader);
        });

        it('should set texture uniforms correctly', () => {
            const mockTextures = {
                channel0: new THREE.Texture(),
                channel1: new THREE.Texture(),
                channel2: new THREE.Texture(),
                channel3: new THREE.Texture()
            };
            
            const config = getShaderConfig(mockTextures);
            
            expect(config.uniforms.uChannel0.value).toBe(mockTextures.channel0);
            expect(config.uniforms.uChannel1.value).toBe(mockTextures.channel1);
            expect(config.uniforms.uChannel2.value).toBe(mockTextures.channel2);
            expect(config.uniforms.uChannel3.value).toBe(mockTextures.channel3);
        });

        it('should use default values for optional parameters', () => {
            const mockTextures = {
                channel0: new THREE.Texture(),
                channel1: new THREE.Texture(),
                channel2: new THREE.Texture(),
                channel3: new THREE.Texture()
            };
            
            const config = getShaderConfig(mockTextures);
            
            expect(config.uniforms.uTime.value).toBe(0.0);
            expect(config.uniforms.uScroll.value).toBe(0.0);
            expect(config.uniforms.uLookMode.value).toBe(1);
            expect(config.uniforms.uNoiseMethod.value).toBe(1);
            expect(config.uniforms.uUseLOD.value).toBe(1);
        });

        it('should accept custom options', () => {
            const mockTextures = {
                channel0: new THREE.Texture(),
                channel1: new THREE.Texture(),
                channel2: new THREE.Texture(),
                channel3: new THREE.Texture()
            };
            
            const options = {
                lookMode: 0,
                noiseMethod: 2,
                useLOD: 0,
                mouse: { x: 0.7, y: 0.3 }
            };
            
            const config = getShaderConfig(mockTextures, options);
            
            expect(config.uniforms.uLookMode.value).toBe(0);
            expect(config.uniforms.uNoiseMethod.value).toBe(2);
            expect(config.uniforms.uUseLOD.value).toBe(0);
            expect(config.uniforms.uMouse.value).toEqual({ x: 0.7, y: 0.3 });
        });
    });

    describe('Property-Based Tests', () => {
        /**
         * Property 7: All required uniforms are set before rendering
         * 
         * Feature: shadertoy-volumetric-clouds, Property 7: All required uniforms are set before rendering
         * Validates: Requirements 5.4
         * 
         * For any shader configuration, all required uniforms should be present with non-null values
         * before the shader can be used for rendering.
         */
        it('property: all required uniforms are set before rendering', () => {
            fc.assert(
                fc.property(
                    // Generate random texture configurations
                    fc.record({
                        channel0: fc.constant(new THREE.Texture()),
                        channel1: fc.constant(new THREE.Texture()),
                        channel2: fc.constant(new THREE.Texture()),
                        channel3: fc.constant(new THREE.Texture())
                    }),
                    // Generate random options
                    fc.record({
                        lookMode: fc.integer({ min: 0, max: 1 }),
                        noiseMethod: fc.integer({ min: 0, max: 2 }),
                        useLOD: fc.integer({ min: 0, max: 1 }),
                        mouse: fc.record({
                            x: fc.double({ min: 0, max: 1 }),
                            y: fc.double({ min: 0, max: 1 })
                        }),
                        resolution: fc.record({
                            x: fc.integer({ min: 1, max: 4096 }),
                            y: fc.integer({ min: 1, max: 4096 })
                        })
                    }),
                    (textures, options) => {
                        // Get shader configuration
                        const config = getShaderConfig(textures, options);
                        
                        // Define required uniform keys
                        const requiredUniforms = [
                            'uTime',
                            'uResolution',
                            'uMouse',
                            'uScroll',
                            'uChannel0',
                            'uChannel1',
                            'uChannel2',
                            'uChannel3',
                            'uLookMode',
                            'uNoiseMethod',
                            'uUseLOD'
                        ];
                        
                        // Property: All required uniforms must exist
                        for (const uniformKey of requiredUniforms) {
                            expect(config.uniforms).toHaveProperty(uniformKey);
                            expect(config.uniforms[uniformKey]).toHaveProperty('value');
                        }
                        
                        // Property: Texture uniforms must have non-null values
                        expect(config.uniforms.uChannel0.value).not.toBeNull();
                        expect(config.uniforms.uChannel1.value).not.toBeNull();
                        expect(config.uniforms.uChannel2.value).not.toBeNull();
                        expect(config.uniforms.uChannel3.value).not.toBeNull();
                        
                        // Property: Numeric uniforms must have defined values
                        expect(config.uniforms.uTime.value).toBeDefined();
                        expect(config.uniforms.uScroll.value).toBeDefined();
                        expect(config.uniforms.uLookMode.value).toBeDefined();
                        expect(config.uniforms.uNoiseMethod.value).toBeDefined();
                        expect(config.uniforms.uUseLOD.value).toBeDefined();
                        
                        // Property: Resolution and mouse must be objects with x/y properties
                        expect(config.uniforms.uResolution.value).toHaveProperty('x');
                        expect(config.uniforms.uResolution.value).toHaveProperty('y');
                        expect(config.uniforms.uMouse.value).toHaveProperty('x');
                        expect(config.uniforms.uMouse.value).toHaveProperty('y');
                        
                        return true;
                    }
                ),
                { numRuns: 100 } // Run 100 iterations as specified in design
            );
        });
    });
});
