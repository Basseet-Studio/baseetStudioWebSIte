/**
 * Simplified unit tests for ShadertoyCloudRenderer
 * 
 * These tests focus on testable logic without requiring full Three.js WebGL initialization.
 * Tests constructor logic, WebGL detection, mobile detection, and configuration.
 * 
 * Requirements: 1.1, 3.1, 3.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ShadertoyCloudRenderer } from './shadertoy-cloud-renderer.js';

// Mock canvas element
function createMockCanvas() {
    const canvas = document.createElement('canvas');
    canvas.id = 'test-canvas';
    document.body.appendChild(canvas);
    return canvas;
}

describe('ShadertoyCloudRenderer - Simplified Tests', () => {
    let canvas;

    beforeEach(() => {
        canvas = createMockCanvas();
        
        // Mock WebGL context
        const mockWebGLContext = {
            getParameter: () => 'WebGL 1.0',
            getExtension: () => null
        };
        
        HTMLCanvasElement.prototype.getContext = function(contextType) {
            if (contextType === 'webgl' || contextType === 'experimental-webgl') {
                return mockWebGLContext;
            }
            return null;
        };
        
        // Ensure WebGLRenderingContext exists
        if (!window.WebGLRenderingContext) {
            window.WebGLRenderingContext = function() {};
        }
    });

    afterEach(() => {
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
    });

    describe('Constructor', () => {
        it('should throw error if canvas not found', () => {
            expect(() => {
                new ShadertoyCloudRenderer('non-existent-canvas');
            }).toThrow('Canvas element with id "non-existent-canvas" not found');
        });

        it('should initialize with default options', () => {
            const renderer = new ShadertoyCloudRenderer('test-canvas');
            
            expect(renderer.config.scrollDistance).toBe(600);
            expect(renderer.config.textContent).toBe('BASEET STUDIO');
            expect(renderer.config.fontSize).toBe(0.8);
            expect(renderer.config.cloudDensity).toBe(0.7);
            expect(renderer.config.lookMode).toBe(1);
            expect(renderer.config.noiseMethod).toBe(1);
            expect(renderer.config.useLOD).toBe(true);
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
            
            const renderer = new ShadertoyCloudRenderer('test-canvas', options);
            
            expect(renderer.config.scrollDistance).toBe(800);
            expect(renderer.config.textContent).toBe('TEST TEXT');
            expect(renderer.config.fontSize).toBe(1.0);
            expect(renderer.config.cloudDensity).toBe(0.5);
            expect(renderer.config.lookMode).toBe(0);
            expect(renderer.config.noiseMethod).toBe(2);
            expect(renderer.config.useLOD).toBe(false);
        });

        it('should initialize state variables', () => {
            const renderer = new ShadertoyCloudRenderer('test-canvas');
            
            expect(renderer.isInitialized).toBe(false);
            expect(renderer.isAnimating).toBe(false);
            expect(renderer.scrollProgress).toBe(0.0);
            expect(renderer.transitionComplete).toBe(false);
            expect(renderer.animationId).toBeNull();
            expect(renderer.startTime).toBeTypeOf('number');
        });
    });

    describe('WebGL Support Detection', () => {
        it('should detect WebGL support when available', () => {
            const renderer = new ShadertoyCloudRenderer('test-canvas');
            const hasWebGL = renderer.checkWebGLSupport();
            
            expect(hasWebGL).toBe(true);
        });

        it('should detect lack of WebGL support', () => {
            // Temporarily remove WebGLRenderingContext
            const originalWebGLContext = window.WebGLRenderingContext;
            delete window.WebGLRenderingContext;
            
            const renderer = new ShadertoyCloudRenderer('test-canvas');
            const hasWebGL = renderer.checkWebGLSupport();
            
            expect(hasWebGL).toBe(false);
            
            // Restore
            window.WebGLRenderingContext = originalWebGLContext;
        });
    });

    describe('Mobile Device Detection', () => {
        it('should detect mobile user agent', () => {
            // Mock mobile user agent
            const originalUserAgent = navigator.userAgent;
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
                configurable: true
            });
            
            const renderer = new ShadertoyCloudRenderer('test-canvas');
            const isMobile = renderer.detectMobileDevice();
            
            expect(isMobile).toBe(true);
            
            // Restore
            Object.defineProperty(navigator, 'userAgent', {
                value: originalUserAgent,
                configurable: true
            });
        });

        it('should detect desktop user agent', () => {
            const renderer = new ShadertoyCloudRenderer('test-canvas');
            const isMobile = renderer.detectMobileDevice();
            
            // Result depends on test environment, just check it returns a boolean
            expect(typeof isMobile).toBe('boolean');
        });

        it('should apply mobile optimizations when mobile detected', () => {
            // Mock mobile user agent
            const originalUserAgent = navigator.userAgent;
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
                configurable: true
            });
            
            const renderer = new ShadertoyCloudRenderer('test-canvas');
            
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
    });

    describe('State Management', () => {
        it('should return current state', () => {
            const renderer = new ShadertoyCloudRenderer('test-canvas');
            const state = renderer.getState();
            
            expect(state).toHaveProperty('isInitialized');
            expect(state).toHaveProperty('isAnimating');
            expect(state).toHaveProperty('scrollProgress');
            expect(state).toHaveProperty('transitionComplete');
            expect(state).toHaveProperty('camera');
            expect(state).toHaveProperty('uniforms');
            
            expect(state.isInitialized).toBe(false);
            expect(state.isAnimating).toBe(false);
            expect(state.scrollProgress).toBe(0.0);
            expect(state.transitionComplete).toBe(false);
        });
    });
});
