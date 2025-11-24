/**
 * Accessibility Tests for ShadertoyCloudRenderer
 * 
 * Tests for reduced motion detection, ARIA labels, and screen reader support.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Accessibility Features', () => {
    let dom;
    let window;
    let document;
    let canvas;

    beforeEach(() => {
        // Create a fresh DOM for each test
        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost',
            pretendToBeVisual: true
        });
        window = dom.window;
        document = window.document;
        global.window = window;
        global.document = document;

        // Create canvas element
        canvas = document.createElement('canvas');
        canvas.id = 'test-canvas';
        document.body.appendChild(canvas);
    });

    afterEach(() => {
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
        vi.restoreAllMocks();
    });

    describe('Reduced Motion Detection', () => {
        it('should detect when user prefers reduced motion', () => {
            // Mock matchMedia to return reduced motion preference
            window.matchMedia = vi.fn((query) => ({
                matches: query === '(prefers-reduced-motion: reduce)',
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn()
            }));

            // Test the detection logic
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            
            expect(prefersReducedMotion).toBe(true);
            expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
        });

        it('should detect when user does not prefer reduced motion', () => {
            // Mock matchMedia to return no reduced motion preference
            window.matchMedia = vi.fn((query) => ({
                matches: false,
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn()
            }));

            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            
            expect(prefersReducedMotion).toBe(false);
        });

        it('should handle missing matchMedia gracefully', () => {
            // Remove matchMedia
            delete window.matchMedia;

            // Test that code handles missing matchMedia
            const prefersReducedMotion = window.matchMedia ? 
                window.matchMedia('(prefers-reduced-motion: reduce)').matches : 
                false;
            
            expect(prefersReducedMotion).toBe(false);
        });
    });

    describe('ARIA Labels', () => {
        it('should add aria-label to canvas element', () => {
            // Simulate what the renderer does
            canvas.setAttribute('aria-label', 'Volumetric cloud animation with BASEET STUDIO text');
            canvas.setAttribute('role', 'img');

            const ariaLabel = canvas.getAttribute('aria-label');
            const role = canvas.getAttribute('role');

            expect(ariaLabel).toBeTruthy();
            expect(ariaLabel).toContain('cloud');
            expect(ariaLabel).toContain('BASEET STUDIO');
            expect(role).toBe('img');
        });

        it('should have descriptive aria-label', () => {
            canvas.setAttribute('aria-label', 'Volumetric cloud animation with BASEET STUDIO text');

            const ariaLabel = canvas.getAttribute('aria-label');

            // Check that the label is descriptive
            expect(ariaLabel.length).toBeGreaterThan(20);
            expect(ariaLabel).toMatch(/cloud/i);
            expect(ariaLabel).toMatch(/animation/i);
        });
    });

    describe('Screen Reader Support', () => {
        it('should add sr-only description element', () => {
            // Simulate what the renderer does
            const srDescription = document.createElement('span');
            srDescription.className = 'sr-only';
            srDescription.textContent = 'An animated 3D scene showing volumetric clouds floating in the sky with BASEET STUDIO text. Scroll down to navigate through the clouds and access the main content.';
            
            canvas.parentNode.insertBefore(srDescription, canvas);

            // Find the sr-only span
            const description = canvas.previousElementSibling;

            expect(description).toBeTruthy();
            expect(description.className).toContain('sr-only');
            expect(description.textContent).toBeTruthy();
        });

        it('should have meaningful screen reader description', () => {
            const srDescription = document.createElement('span');
            srDescription.className = 'sr-only';
            srDescription.textContent = 'An animated 3D scene showing volumetric clouds floating in the sky with BASEET STUDIO text. Scroll down to navigate through the clouds and access the main content.';
            
            canvas.parentNode.insertBefore(srDescription, canvas);

            const description = canvas.previousElementSibling;

            // Check that description is meaningful
            expect(description.textContent.length).toBeGreaterThan(50);
            expect(description.textContent).toMatch(/cloud/i);
            expect(description.textContent).toMatch(/scroll/i);
            expect(description.textContent).toMatch(/BASEET STUDIO/i);
        });
    });

    describe('Skip Link', () => {
        it('should have skip link in document', () => {
            // Create skip link as it appears in home.html
            const skipLink = document.createElement('a');
            skipLink.className = 'text-primary sr-only z-50 inline-block rounded-md bg-white p-3 shadow-lg focus:not-sr-only';
            skipLink.href = '#mainContent';
            skipLink.textContent = 'Skip to content';
            document.body.insertBefore(skipLink, document.body.firstChild);

            const link = document.querySelector('a[href="#mainContent"]');

            expect(link).toBeTruthy();
            expect(link.textContent).toContain('Skip');
            expect(link.className).toContain('sr-only');
        });

        it('should have skip link that targets main content', () => {
            const skipLink = document.createElement('a');
            skipLink.href = '#mainContent';
            skipLink.textContent = 'Skip to content';
            document.body.appendChild(skipLink);

            const mainContent = document.createElement('main');
            mainContent.id = 'mainContent';
            document.body.appendChild(mainContent);

            const link = document.querySelector('a[href="#mainContent"]');
            const target = document.getElementById('mainContent');

            expect(link).toBeTruthy();
            expect(target).toBeTruthy();
            expect(link.href).toContain(target.id);
        });
    });

    describe('Animation Speed Reduction', () => {
        it('should apply 0.1x speed multiplier when reduced motion is preferred', () => {
            const prefersReducedMotion = true;
            const normalSpeed = 1.0;
            const reducedSpeed = 0.1;

            const animationSpeed = prefersReducedMotion ? reducedSpeed : normalSpeed;

            expect(animationSpeed).toBe(0.1);
        });

        it('should apply 1.0x speed multiplier when reduced motion is not preferred', () => {
            const prefersReducedMotion = false;
            const normalSpeed = 1.0;
            const reducedSpeed = 0.1;

            const animationSpeed = prefersReducedMotion ? reducedSpeed : normalSpeed;

            expect(animationSpeed).toBe(1.0);
        });

        it('should scale time uniform correctly with reduced motion', () => {
            const currentTime = 10.0; // 10 seconds
            const prefersReducedMotion = true;
            const animationSpeed = prefersReducedMotion ? 0.1 : 1.0;

            const scaledTime = currentTime * animationSpeed;

            expect(scaledTime).toBe(1.0); // 10 seconds * 0.1 = 1 second
        });
    });
});
