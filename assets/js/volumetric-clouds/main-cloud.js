/**
 * Main Cloud Initialization Module
 * Entry point for volumetric cloud system
 * Handles feature detection, reduced motion support, and component initialization
 */

import { VolumetricCloudRenderer } from './cloud-renderer.js';
import { ScrollManager } from './scroll-manager.js';

/**
 * Check if user prefers reduced motion
 * @returns {boolean} - True if reduced motion is preferred
 */
function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Apply CSS fallback for reduced motion or WebGL unsupported
 * Adds fallback class and initializes in SITE_MODE
 */
function applyCSSFallback() {
    console.warn('Volumetric clouds disabled. Using CSS fallback.');
    
    // Add fallback class to body
    document.body.classList.add('css-clouds-fallback');
    
    // Hide cloud canvas container
    const container = document.getElementById('volumetric-cloud-canvas');
    if (container) {
        container.style.display = 'none';
    }
    
    // Initialize page in SITE_MODE (normal state)
    document.body.classList.add('site-mode');
    document.body.style.overflow = 'auto';
}

/**
 * Initialize volumetric cloud system
 * Creates renderer and scroll manager, wires up components
 */
function initializeCloudSystem() {
    // Check for reduced motion preference
    if (prefersReducedMotion()) {
        applyCSSFallback();
        return;
    }
    
    // Create VolumetricCloudRenderer instance with options
    const cloudRenderer = new VolumetricCloudRenderer('volumetric-cloud-canvas', {
        // Options will use defaults based on device detection
        // Desktop: textureSize=128, steps=100, pixelRatio=2.0
        // Mobile: textureSize=64, steps=50, pixelRatio=1.5
    });
    
    // Check if renderer initialized successfully (WebGL support)
    if (!cloudRenderer.renderer) {
        // WebGL not supported, fallback already applied by renderer
        applyCSSFallback();
        return;
    }
    
    // Create ScrollManager instance with cloudRenderer
    const scrollManager = new ScrollManager(cloudRenderer);
    
    // Expose to window object on localhost for debugging
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.cloudRenderer = cloudRenderer;
        window.scrollManager = scrollManager;
        console.log('Debug mode: cloudRenderer and scrollManager exposed to window object');
    }
}

/**
 * Entry point - wait for DOM to be ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCloudSystem);
} else {
    // DOM already loaded
    initializeCloudSystem();
}
