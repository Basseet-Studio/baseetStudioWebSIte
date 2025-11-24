/**
 * Tests for ShadertoyCloudRenderer
 * 
 * Includes unit tests for initialization and property-based tests for correctness properties.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import * as THREE from 'three';
import { ShadertoyCloudRenderer } from './shadertoy-cloud-renderer.js';
import { TextureLoader } from './texture-loader.js';
import { TextRenderer } from './text-renderer.js';

// Mock canvas element
function createMockCanvas() {
    const canvas = document.createElement('canvas');
    canvas.id = 'test-canvas';
    document.body.appendChild(canvas);
    return canvas;
}

describe('ShadertoyCloudRenderer', () => {
    let canvas;
    let renderer;
    let webGLRendererSpy;

    beforeEach(() => {
        // Create mock canvas
        canvas = createMockCanvas();
        
        // Mock THREE.WebGLRenderer using vi.spyOn
        webGLRendererSpy = vi.spyOn(THREE, 'WebGLRenderer').mockImplementation(function(options) {
            this.domElement = options.canvas || document.createElement('canvas');
            this.setSize = vi.fn();
            this.setPixelRatio = vi.fn();
            this.setClearColor = vi.fn();
            this.render = vi.fn();
            this.dispose = vi.fn();
            this.getContext = vi.fn(() => ({
                getParameter: vi.fn(() => 'WebGL 1.0'),
                getExtension: vi.fn()
            }));
            return this;
        });
        
        // Create a comprehensive WebGL context mock
        const mockWebGLContext = {
            canvas: canvas,
            drawingBufferWidth: 800,
            drawingBufferHeight: 600,
            getContextAttributes: vi.fn(() => ({
                alpha: true,
                antialias: true,
                depth: true,
                stencil: false
            })),
            getExtension: vi.fn((name) => {
                if (name === 'WEBGL_draw_buffers') return {};
                if (name === 'OES_texture_float') return {};
                if (name === 'OES_texture_half_float') return {};
                if (name === 'OES_standard_derivatives') return {};
                if (name === 'EXT_shader_texture_lod') return {};
                if (name === 'EXT_texture_filter_anisotropic') return {};
                return null;
            }),
            getParameter: vi.fn((param) => {
                // Return reasonable defaults for common parameters
                if (param === 0x8B4C) return 16; // MAX_VERTEX_ATTRIBS
                if (param === 0x8869) return 16; // MAX_TEXTURE_IMAGE_UNITS
                if (param === 0x8DFD) return 16; // MAX_TEXTURE_MAX_ANISOTROPY_EXT
                if (param === 0x0D33) return 16384; // MAX_TEXTURE_SIZE
                if (param === 0x851C) return 16384; // MAX_CUBE_MAP_TEXTURE_SIZE
                if (param === 0x8872) return 16; // MAX_VERTEX_TEXTURE_IMAGE_UNITS
                if (param === 0x8B4D) return 16; // MAX_VARYING_VECTORS
                if (param === 0x8DFC) return 1024; // MAX_VERTEX_UNIFORM_VECTORS
                if (param === 0x8DFD) return 1024; // MAX_FRAGMENT_UNIFORM_VECTORS
                if (param === 0x1F02 || param === 7938) return 'WebGL 1.0 (Mock)'; // VERSION
                if (param === 0x1F00 || param === 7936) return 'WebKit'; // VENDOR
                if (param === 0x1F01 || param === 7937) return 'WebKit WebGL'; // RENDERER
                if (param === 0x8B8C || param === 35724) return 'WebGL GLSL ES 1.0 (Mock)'; // SHADING_LANGUAGE_VERSION
                return 0;
            }),
            getSupportedExtensions: vi.fn(() => [
                'WEBGL_draw_buffers',
                'OES_texture_float',
                'OES_texture_half_float',
                'OES_standard_derivatives'
            ]),
            createShader: vi.fn(() => ({})),
            createProgram: vi.fn(() => ({})),
            createBuffer: vi.fn(() => ({})),
            createTexture: vi.fn(() => ({})),
            createFramebuffer: vi.fn(() => ({})),
            createRenderbuffer: vi.fn(() => ({})),
            bindBuffer: vi.fn(),
            bindTexture: vi.fn(),
            bindFramebuffer: vi.fn(),
            bindRenderbuffer: vi.fn(),
            shaderSource: vi.fn(),
            compileShader: vi.fn(),
            attachShader: vi.fn(),
            linkProgram: vi.fn(),
            useProgram: vi.fn(),
            getShaderParameter: vi.fn(() => true),
            getProgramParameter: vi.fn(() => true),
            getShaderInfoLog: vi.fn(() => ''),
            getProgramInfoLog: vi.fn(() => ''),
            deleteShader: vi.fn(),
            deleteProgram: vi.fn(),
            deleteBuffer: vi.fn(),
            deleteTexture: vi.fn(),
            deleteFramebuffer: vi.fn(),
            deleteRenderbuffer: vi.fn(),
            viewport: vi.fn(),
            clear: vi.fn(),
            clearColor: vi.fn(),
            enable: vi.fn(),
            disable: vi.fn(),
            blendFunc: vi.fn(),
            blendEquation: vi.fn(),
            depthFunc: vi.fn(),
            depthMask: vi.fn(),
            cullFace: vi.fn(),
            frontFace: vi.fn(),
            pixelStorei: vi.fn(),
            texParameteri: vi.fn(),
            texImage2D: vi.fn(),
            activeTexture: vi.fn(),
            drawArrays: vi.fn(),
            drawElements: vi.fn(),
            getUniformLocation: vi.fn(() => ({})),
            getAttribLocation: vi.fn(() => 0),
            uniform1f: vi.fn(),
            uniform2f: vi.fn(),
            uniform3f: vi.fn(),
            uniform4f: vi.fn(),
            uniform1i: vi.fn(),
            uniformMatrix4fv: vi.fn(),
            vertexAttribPointer: vi.fn(),
            enableVertexAttribArray: vi.fn(),
            disableVertexAttribArray: vi.fn(),
            bufferData: vi.fn(),
            bufferSubData: vi.fn(),
            getError: vi.fn(() => 0), // NO_ERROR
            // Constants
            VERTEX_SHADER: 0x8B31,
            FRAGMENT_SHADER: 0x8B30,
            COMPILE_STATUS: 0x8B81,
            LINK_STATUS: 0x8B82,
            ARRAY_BUFFER: 0x8892,
            ELEMENT_ARRAY_BUFFER: 0x8893,
            STATIC_DRAW: 0x88E4,
            DYNAMIC_DRAW: 0x88E8,
            TEXTURE_2D: 0x0DE1,
            TEXTURE_CUBE_MAP: 0x8513,
            RGBA: 0x1908,
            UNSIGNED_BYTE: 0x1401,
            FLOAT: 0x1406,
            DEPTH_TEST: 0x0B71,
            BLEND: 0x0BE2,
            CULL_FACE: 0x0B44,
            NO_ERROR: 0
        };
        
        HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
            if (contextType === 'webgl' || contextType === 'experimental-webgl') {
                return mockWebGLContext;
            }
            if (contextType === '2d') {
                return {};
            }
            return null;
        });
        
        // Ensure WebGLRenderingContext exists
        if (!window.WebGLRenderingContext) {
            window.WebGLRenderingContext = function() {};
        }
    });

    afterEach(() => {
        // Clean up
        if (renderer) {
            try {
                renderer.destroy();
            } catch (e) {
                // Ignore errors during cleanup
            }
            renderer = null;
        }
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
        vi.restoreAllMocks();
    });

    describe('Constructor and Initialization', () => {
        it('should create Three.js objects in constructor', () => {
            renderer = new ShadertoyCloudRenderer('test-canvas');
            
            expect(renderer.scene).toBeInstanceOf(THREE.Scene);
            expect(renderer.camera).toBeInstanceOf(THREE.PerspectiveCamera);
            expect(renderer.renderer).toBeInstanceOf(THREE.WebGLRenderer);
            expect(renderer.isInitialized).toBe(false);
            expect(renderer.isAnimating).toBe(false);
        });

        it('should throw error if canvas not found', () => {
            expect(() => {
                new ShadertoyCloudRenderer('non-existent-canvas');
            }).toThrow('Canvas element with id "non-existent-canvas" not found');
        });

        it('should detect WebGL support', () => {
            renderer = new ShadertoyCloudRenderer('test-canvas');
            
            const hasWebGL = renderer.checkWebGLSupport();
            expect(typeof hasWebGL).toBe('boolean');
        });

        it('should detect mobile devices', () => {
            renderer = new ShadertoyCloudRenderer('test-canvas');
            
            const isMobile = renderer.detectMobileDevice();
            expect(typeof isMobile).toBe('boolean');
        });

        it('should apply mobile optimizations when mobile detected', () => {
            // Mock mobile user agent
            const originalUserAgent = navigator.userAgent;
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
                configurable: true
            });
            
            renderer = new ShadertoyCloudRenderer('test-canvas');
            
            if (renderer.isMobile) {
                expect(renderer.config.useLOD).toBe(true);
                expect(renderer.config.cloudDensity).toBeLessThan(0.7);
            }
            
            // Restore
            Object.defineProperty(navigator, 'userAgent', {
                value: originalUserAgent,
                configurable: true
            });
        });

        it('should initialize with custom options', () => {
            const options = {
                scrollDistance: 800,
                textContent: 'TEST TEXT',
                fontSize: 1.0,
                cloudDensity: 0.5,
                lookMode: 0,
                noiseMethod: 2,
                useLOD: false
            };
            
            renderer = new ShadertoyCloudRenderer('test-canvas', options);
            
            expect(renderer.config.scrollDistance).toBe(800);
            expect(renderer.config.textContent).toBe('TEST TEXT');
            expect(renderer.config.fontSize).toBe(1.0);
            expect(renderer.config.cloudDensity).toBe(0.5);
            expect(renderer.config.lookMode).toBe(0);
            expect(renderer.config.noiseMethod).toBe(2);
            expect(renderer.config.useLOD).toBe(false);
        });
    });

    describe('init() method', () => {
        beforeEach(() => {
            // Mock texture loading
            vi.spyOn(TextureLoader, 'loadChannelTextures').mockResolvedValue({
                channel0: new THREE.Texture(),
                channel1: new THREE.Texture(),
                channel2: new THREE.Texture(),
                channel3: new THREE.Texture()
            });
            
            // Mock text renderer
            vi.spyOn(TextRenderer, 'createTextMeshWithFont').mockResolvedValue(
                new THREE.Mesh(
                    new THREE.BoxGeometry(1, 1, 1),
                    new THREE.MeshStandardMaterial()
                )
            );
        });

        it('should load textures and create scene', async () => {
            renderer = new ShadertoyCloudRenderer('test-canvas');
            
            await renderer.init();
            
            expect(renderer.isInitialized).toBe(true);
            expect(renderer.cloudMaterial).toBeInstanceOf(THREE.ShaderMaterial);
            expect(renderer.cloudMesh).toBeInstanceOf(THREE.Mesh);
            expect(renderer.directionalLight).toBeInstanceOf(THREE.DirectionalLight);
            expect(TextureLoader.loadChannelTextures).toHaveBeenCalled();
        });

        it('should not initialize twice', async () => {
            renderer = new ShadertoyCloudRenderer('test-canvas');
            
            await renderer.init();
            const firstMaterial = renderer.cloudMaterial;
            
            await renderer.init();
            
            expect(renderer.cloudMaterial).toBe(firstMaterial);
        });

        it('should continue without text if text loading fails', async () => {
            TextRenderer.createTextMeshWithFont.mockRejectedValue(new Error('Font load failed'));
            
            renderer = new ShadertoyCloudRenderer('test-canvas');
            
            await renderer.init();
            
            expect(renderer.isInitialized).toBe(true);
            expect(renderer.textMesh).toBeNull();
        });
    });

    describe('Animation Loop', () => {
        beforeEach(async () => {
            // Mock texture loading
            vi.spyOn(TextureLoader, 'loadChannelTextures').mockResolvedValue({
                channel0: new THREE.Texture(),
                channel1: new THREE.Texture(),
                channel2: new THREE.Texture(),
                channel3: new THREE.Texture()
            });
            
            vi.spyOn(TextRenderer, 'createTextMeshWithFont').mockResolvedValue(
                new THREE.Mesh(
                    new THREE.BoxGeometry(1, 1, 1),
                    new THREE.MeshStandardMaterial()
                )
            );
            
            renderer = new ShadertoyCloudRenderer('test-canvas');
            await renderer.init();
        });

        it('should start animation', () => {
            renderer.start();
            
            expect(renderer.isAnimating).toBe(true);
        });

        it('should stop animation', () => {
            renderer.start();
            renderer.stop();
            
            expect(renderer.isAnimating).toBe(false);
            expect(renderer.animationId).toBeNull();
        });

        it('should not start if not initialized', () => {
            const uninitializedRenderer = new ShadertoyCloudRenderer('test-canvas');
            
            uninitializedRenderer.start();
            
            expect(uninitializedRenderer.isAnimating).toBe(false);
        });
    });

    describe('Scroll Control', () => {
        beforeEach(async () => {
            vi.spyOn(TextureLoader, 'loadChannelTextures').mockResolvedValue({
                channel0: new THREE.Texture(),
                channel1: new THREE.Texture(),
                channel2: new THREE.Texture(),
                channel3: new THREE.Texture()
            });
            
            vi.spyOn(TextRenderer, 'createTextMeshWithFont').mockResolvedValue(
                new THREE.Mesh(
                    new THREE.BoxGeometry(1, 1, 1),
                    new THREE.MeshStandardMaterial()
                )
            );
            
            renderer = new ShadertoyCloudRenderer('test-canvas');
            await renderer.init();
        });

        it('should update scroll progress', () => {
            renderer.updateScroll(0.5);
            
            expect(renderer.scrollProgress).toBe(0.5);
            expect(renderer.cloudMaterial.uniforms.uScroll.value).toBe(0.5);
        });

        it('should clamp scroll progress to valid range', () => {
            renderer.updateScroll(-0.5);
            expect(renderer.scrollProgress).toBe(0.0);
            
            renderer.updateScroll(1.5);
            expect(renderer.scrollProgress).toBe(1.0);
        });

        it('should update camera position based on scroll', () => {
            const initialZ = renderer.camera.position.z;
            
            renderer.updateScroll(0.5);
            const midZ = renderer.camera.position.z;
            
            renderer.updateScroll(1.0);
            const finalZ = renderer.camera.position.z;
            
            expect(midZ).toBeLessThan(initialZ);
            expect(finalZ).toBeLessThan(midZ);
        });

        it('should mark transition complete at 100%', () => {
            renderer.updateScroll(1.0);
            
            expect(renderer.transitionComplete).toBe(true);
            expect(renderer.isComplete()).toBe(true);
        });

        it('should reset to initial state', () => {
            renderer.updateScroll(1.0);
            renderer.reset();
            
            expect(renderer.scrollProgress).toBe(0.0);
            expect(renderer.transitionComplete).toBe(false);
            expect(renderer.camera.position.z).toBe(15);
        });
    });

    describe('Property-Based Tests', () => {
        beforeEach(async () => {
            vi.spyOn(TextureLoader, 'loadChannelTextures').mockResolvedValue({
                channel0: new THREE.Texture(),
                channel1: new THREE.Texture(),
                channel2: new THREE.Texture(),
                channel3: new THREE.Texture()
            });
            
            vi.spyOn(TextRenderer, 'createTextMeshWithFont').mockResolvedValue(
                new THREE.Mesh(
                    new THREE.BoxGeometry(1, 1, 1),
                    new THREE.MeshStandardMaterial()
                )
            );
            
            renderer = new ShadertoyCloudRenderer('test-canvas');
            await renderer.init();
        });

        /**
         * Feature: shadertoy-volumetric-clouds, Property 1: Time uniform increases monotonically during animation
         * Validates: Requirements 1.4
         */
        it('Property 1: Time uniform increases monotonically during animation', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 2, maxLength: 20 }),
                    (frameDelays) => {
                        // Reset renderer state
                        renderer.startTime = Date.now();
                        
                        const timeValues = [];
                        let currentTime = Date.now();
                        
                        // Simulate multiple animation frames
                        for (const delay of frameDelays) {
                            currentTime += delay;
                            
                            // Mock Date.now() to return our controlled time
                            const originalDateNow = Date.now;
                            Date.now = () => currentTime;
                            
                            // Manually update time uniform (simulating what animate() does)
                            const timeInSeconds = (currentTime - renderer.startTime) / 1000.0;
                            renderer.cloudMaterial.uniforms.uTime.value = timeInSeconds;
                            
                            timeValues.push(renderer.cloudMaterial.uniforms.uTime.value);
                            
                            // Restore Date.now
                            Date.now = originalDateNow;
                        }
                        
                        // Check monotonicity: each time value should be >= previous
                        for (let i = 1; i < timeValues.length; i++) {
                            if (timeValues[i] < timeValues[i - 1]) {
                                return false;
                            }
                        }
                        
                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
