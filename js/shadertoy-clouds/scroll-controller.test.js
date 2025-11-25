/**
 * Unit tests for ScrollController
 * 
 * Tests scroll progress calculation, transition trigger at 100%,
 * reset trigger at top, and throttling behavior.
 * 
 * Requirements: 2.1, 2.3, 2.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScrollController } from './scroll-controller.js';

describe('ScrollController', () => {
    let mockRenderer;
    let scrollController;

    beforeEach(() => {
        // Create mock renderer with required methods
        mockRenderer = {
            updateScroll: vi.fn(),
            reset: vi.fn(),
            isComplete: vi.fn(() => false)
        };

        // Mock window.scrollY
        Object.defineProperty(window, 'scrollY', {
            writable: true,
            configurable: true,
            value: 0
        });

        Object.defineProperty(window, 'pageYOffset', {
            writable: true,
            configurable: true,
            value: 0
        });
    });

    afterEach(() => {
        if (scrollController) {
            scrollController.destroy();
            scrollController = null;
        }
    });

    describe('constructor', () => {
        it('should create ScrollController with default options', () => {
            scrollController = new ScrollController(mockRenderer);

            expect(scrollController.renderer).toBe(mockRenderer);
            expect(scrollController.config.scrollDistance).toBe(600);
            expect(scrollController.config.resetThreshold).toBe(50);
            expect(scrollController.isEnabled).toBe(false);
            expect(scrollController.currentProgress).toBe(0.0);
        });

        it('should create ScrollController with custom options', () => {
            const onComplete = vi.fn();
            const onReset = vi.fn();

            scrollController = new ScrollController(mockRenderer, {
                scrollDistance: 1000,
                resetThreshold: 100,
                onComplete,
                onReset
            });

            expect(scrollController.config.scrollDistance).toBe(1000);
            expect(scrollController.config.resetThreshold).toBe(100);
            expect(scrollController.config.onComplete).toBe(onComplete);
            expect(scrollController.config.onReset).toBe(onReset);
        });

        it('should throw error if renderer is not provided', () => {
            expect(() => {
                new ScrollController(null);
            }).toThrow('ScrollController requires a renderer instance');
        });
    });

    describe('enable and disable', () => {
        beforeEach(() => {
            scrollController = new ScrollController(mockRenderer);
        });

        it('should enable scroll tracking', () => {
            const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

            scrollController.enable();

            expect(scrollController.isEnabled).toBe(true);
            expect(addEventListenerSpy).toHaveBeenCalledWith(
                'scroll',
                expect.any(Function),
                { passive: true }
            );

            addEventListenerSpy.mockRestore();
        });

        it('should disable scroll tracking', () => {
            const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

            scrollController.enable();
            scrollController.disable();

            expect(scrollController.isEnabled).toBe(false);
            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                'scroll',
                expect.any(Function)
            );

            removeEventListenerSpy.mockRestore();
        });

        it('should warn if already enabled', () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            scrollController.enable();
            scrollController.enable();

            expect(consoleWarnSpy).toHaveBeenCalledWith('ScrollController already enabled');

            consoleWarnSpy.mockRestore();
        });
    });

    describe('scroll progress calculation', () => {
        beforeEach(() => {
            scrollController = new ScrollController(mockRenderer, {
                scrollDistance: 600
            });
        });

        it('should calculate progress at 0% scroll', () => {
            window.scrollY = 0;
            scrollController.updateScrollProgress();

            expect(scrollController.getProgress()).toBe(0.0);
            expect(mockRenderer.updateScroll).toHaveBeenCalledWith(0.0);
        });

        it('should calculate progress at 50% scroll', () => {
            window.scrollY = 300;
            scrollController.updateScrollProgress();

            expect(scrollController.getProgress()).toBe(0.5);
            expect(mockRenderer.updateScroll).toHaveBeenCalledWith(0.5);
        });

        it('should calculate progress at 100% scroll', () => {
            window.scrollY = 600;
            scrollController.updateScrollProgress();

            expect(scrollController.getProgress()).toBe(1.0);
            expect(mockRenderer.updateScroll).toHaveBeenCalledWith(1.0);
        });

        it('should cap progress at 1.0 for over-scroll', () => {
            window.scrollY = 1000;
            scrollController.updateScrollProgress();

            expect(scrollController.getProgress()).toBe(1.0);
            expect(mockRenderer.updateScroll).toHaveBeenCalledWith(1.0);
        });

        it('should handle various scroll positions correctly', () => {
            const testCases = [
                { scrollY: 0, expected: 0.0 },
                { scrollY: 150, expected: 0.25 },
                { scrollY: 300, expected: 0.5 },
                { scrollY: 450, expected: 0.75 },
                { scrollY: 600, expected: 1.0 },
                { scrollY: 800, expected: 1.0 }
            ];

            testCases.forEach(({ scrollY, expected }) => {
                window.scrollY = scrollY;
                scrollController.updateScrollProgress();
                expect(scrollController.getProgress()).toBeCloseTo(expected, 5);
            });
        });
    });

    describe('transition trigger at 100%', () => {
        it('should trigger onComplete callback when reaching 100%', () => {
            const onComplete = vi.fn();
            scrollController = new ScrollController(mockRenderer, {
                scrollDistance: 600,
                onComplete
            });

            window.scrollY = 600;
            scrollController.updateScrollProgress();

            expect(onComplete).toHaveBeenCalledTimes(1);
            expect(scrollController.isComplete()).toBe(true);
        });

        it('should only trigger onComplete once', () => {
            const onComplete = vi.fn();
            scrollController = new ScrollController(mockRenderer, {
                scrollDistance: 600,
                onComplete
            });

            // Scroll to 100% multiple times
            window.scrollY = 600;
            scrollController.updateScrollProgress();
            scrollController.updateScrollProgress();
            scrollController.updateScrollProgress();

            expect(onComplete).toHaveBeenCalledTimes(1);
        });

        it('should set wasComplete flag when reaching 100%', () => {
            scrollController = new ScrollController(mockRenderer, {
                scrollDistance: 600
            });

            expect(scrollController.wasComplete).toBe(false);

            window.scrollY = 600;
            scrollController.updateScrollProgress();

            expect(scrollController.wasComplete).toBe(true);
        });
    });

    describe('reset trigger at top', () => {
        it('should trigger reset when scrolling back below threshold', () => {
            const onReset = vi.fn();
            scrollController = new ScrollController(mockRenderer, {
                scrollDistance: 600,
                resetThreshold: 50,
                onReset
            });

            // First scroll to 100%
            window.scrollY = 600;
            scrollController.updateScrollProgress();
            expect(scrollController.wasComplete).toBe(true);

            // Then scroll back to top
            window.scrollY = 30;
            scrollController.updateScrollProgress();

            expect(onReset).toHaveBeenCalledTimes(1);
            expect(mockRenderer.reset).toHaveBeenCalledTimes(1);
            expect(scrollController.wasComplete).toBe(false);
            expect(scrollController.getProgress()).toBe(0.0);
        });

        it('should not trigger reset if not previously complete', () => {
            const onReset = vi.fn();
            scrollController = new ScrollController(mockRenderer, {
                scrollDistance: 600,
                resetThreshold: 50,
                onReset
            });

            // Scroll to 50% then back to top
            window.scrollY = 300;
            scrollController.updateScrollProgress();

            window.scrollY = 30;
            scrollController.updateScrollProgress();

            expect(onReset).not.toHaveBeenCalled();
            expect(mockRenderer.reset).not.toHaveBeenCalled();
        });

        it('should use custom reset threshold', () => {
            const onReset = vi.fn();
            scrollController = new ScrollController(mockRenderer, {
                scrollDistance: 600,
                resetThreshold: 100,
                onReset
            });

            // Scroll to 100%
            window.scrollY = 600;
            scrollController.updateScrollProgress();

            // Scroll to 99 (below threshold)
            window.scrollY = 99;
            scrollController.updateScrollProgress();

            expect(onReset).toHaveBeenCalledTimes(1);
            expect(mockRenderer.reset).toHaveBeenCalledTimes(1);
        });

        it('should not reset if above threshold', () => {
            const onReset = vi.fn();
            scrollController = new ScrollController(mockRenderer, {
                scrollDistance: 600,
                resetThreshold: 50,
                onReset
            });

            // Scroll to 100%
            window.scrollY = 600;
            scrollController.updateScrollProgress();

            // Scroll to 51 (above threshold)
            window.scrollY = 51;
            scrollController.updateScrollProgress();

            expect(onReset).not.toHaveBeenCalled();
            expect(mockRenderer.reset).not.toHaveBeenCalled();
        });
    });

    describe('throttling behavior', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            scrollController = new ScrollController(mockRenderer, {
                scrollDistance: 600
            });
            scrollController.enable();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should throttle scroll events using requestAnimationFrame', () => {
            const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

            // Trigger multiple scroll events rapidly
            window.dispatchEvent(new Event('scroll'));
            window.dispatchEvent(new Event('scroll'));
            window.dispatchEvent(new Event('scroll'));

            // Should only call requestAnimationFrame once
            expect(rafSpy).toHaveBeenCalledTimes(1);

            rafSpy.mockRestore();
        });

        it('should allow new scroll event after frame completes', () => {
            let rafCallback = null;
            const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
                rafCallback = cb;
                return 1;
            });

            // First scroll event
            window.dispatchEvent(new Event('scroll'));
            expect(rafSpy).toHaveBeenCalledTimes(1);
            expect(scrollController.ticking).toBe(true);

            // Execute the callback to complete the frame
            rafCallback();
            expect(scrollController.ticking).toBe(false);

            // Second scroll event should trigger new requestAnimationFrame
            window.dispatchEvent(new Event('scroll'));
            expect(rafSpy).toHaveBeenCalledTimes(2);

            rafSpy.mockRestore();
        });

        it('should update scroll progress in animation frame', () => {
            const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
                cb();
                return 1;
            });

            window.scrollY = 300;
            window.dispatchEvent(new Event('scroll'));

            expect(mockRenderer.updateScroll).toHaveBeenCalledWith(0.5);

            rafSpy.mockRestore();
        });
    });

    describe('getProgress and isComplete', () => {
        beforeEach(() => {
            scrollController = new ScrollController(mockRenderer, {
                scrollDistance: 600
            });
        });

        it('should return current progress', () => {
            expect(scrollController.getProgress()).toBe(0.0);

            window.scrollY = 300;
            scrollController.updateScrollProgress();
            expect(scrollController.getProgress()).toBe(0.5);

            window.scrollY = 600;
            scrollController.updateScrollProgress();
            expect(scrollController.getProgress()).toBe(1.0);
        });

        it('should return completion status', () => {
            expect(scrollController.isComplete()).toBe(false);

            window.scrollY = 300;
            scrollController.updateScrollProgress();
            expect(scrollController.isComplete()).toBe(false);

            window.scrollY = 600;
            scrollController.updateScrollProgress();
            expect(scrollController.isComplete()).toBe(true);
        });
    });

    describe('setProgress', () => {
        beforeEach(() => {
            scrollController = new ScrollController(mockRenderer, {
                scrollDistance: 600
            });
        });

        it('should manually set progress', () => {
            scrollController.setProgress(0.5);

            expect(scrollController.getProgress()).toBe(0.5);
            expect(mockRenderer.updateScroll).toHaveBeenCalledWith(0.5);
        });

        it('should clamp progress to valid range', () => {
            scrollController.setProgress(-0.5);
            expect(scrollController.getProgress()).toBe(0.0);

            scrollController.setProgress(1.5);
            expect(scrollController.getProgress()).toBe(1.0);
        });

        it('should trigger completion when set to 1.0', () => {
            const onComplete = vi.fn();
            scrollController = new ScrollController(mockRenderer, {
                scrollDistance: 600,
                onComplete
            });

            scrollController.setProgress(1.0);

            expect(onComplete).toHaveBeenCalledTimes(1);
            expect(scrollController.wasComplete).toBe(true);
        });

        it('should reset wasComplete flag when set below 1.0 after completion', () => {
            scrollController.setProgress(1.0);
            expect(scrollController.wasComplete).toBe(true);

            scrollController.setProgress(0.5);
            expect(scrollController.wasComplete).toBe(false);
        });
    });

    describe('destroy', () => {
        it('should clean up resources and remove event listeners', () => {
            scrollController = new ScrollController(mockRenderer);
            scrollController.enable();

            const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

            scrollController.destroy();

            expect(scrollController.isEnabled).toBe(false);
            expect(scrollController.renderer).toBeNull();
            expect(removeEventListenerSpy).toHaveBeenCalled();

            removeEventListenerSpy.mockRestore();
        });
    });

    describe('edge cases', () => {
        beforeEach(() => {
            scrollController = new ScrollController(mockRenderer, {
                scrollDistance: 600
            });
        });

        it('should handle pageYOffset fallback for older browsers', () => {
            // Set scrollY to undefined to test pageYOffset fallback
            Object.defineProperty(window, 'scrollY', {
                writable: true,
                configurable: true,
                value: undefined
            });

            window.pageYOffset = 300;
            scrollController.updateScrollProgress();

            expect(scrollController.getProgress()).toBe(0.5);
        });

        it('should handle missing callbacks gracefully', () => {
            scrollController = new ScrollController(mockRenderer, {
                scrollDistance: 600
                // No onComplete or onReset callbacks
            });

            // Should not throw when reaching 100%
            window.scrollY = 600;
            expect(() => scrollController.updateScrollProgress()).not.toThrow();

            // Should not throw when resetting
            window.scrollY = 30;
            expect(() => scrollController.updateScrollProgress()).not.toThrow();
        });

        it('should handle zero scroll distance', () => {
            scrollController = new ScrollController(mockRenderer, {
                scrollDistance: 0
            });

            window.scrollY = 0;
            scrollController.updateScrollProgress();

            // With zero distance and zero scroll, we get 0/0 = NaN
            // The Math.min will propagate NaN
            expect(isNaN(scrollController.getProgress())).toBe(true);
        });
    });
});
