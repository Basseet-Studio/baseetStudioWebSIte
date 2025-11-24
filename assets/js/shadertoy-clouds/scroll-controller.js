/**
 * ScrollController - Manages scroll-based camera movement for cloud renderer
 * 
 * This class tracks window scroll position, calculates scroll progress,
 * and updates the cloud renderer accordingly. It uses requestAnimationFrame
 * for throttling to ensure smooth performance.
 */

/**
 * ScrollController class for managing scroll-based interactions
 */
export class ScrollController {
    /**
     * Create a new ScrollController instance
     * 
     * @param {Object} renderer - ShadertoyCloudRenderer instance
     * @param {Object} options - Configuration options
     * @param {number} options.scrollDistance - Distance in pixels to scroll through scene (default: 600)
     * @param {number} options.resetThreshold - Scroll position below which to reset (default: 50)
     * @param {Function} options.onComplete - Callback when scroll reaches 100%
     * @param {Function} options.onReset - Callback when scroll resets to top
     */
    constructor(renderer, options = {}) {
        if (!renderer) {
            throw new Error('ScrollController requires a renderer instance');
        }

        this.renderer = renderer;
        
        // Configuration
        this.config = {
            scrollDistance: options.scrollDistance !== undefined ? options.scrollDistance : 600,
            resetThreshold: options.resetThreshold !== undefined ? options.resetThreshold : 50,
            onComplete: options.onComplete || null,
            onReset: options.onReset || null
        };

        // State
        this.isEnabled = false;
        this.currentProgress = 0.0;
        this.wasComplete = false;
        this.ticking = false;

        // Bound event handler
        this.boundHandleScroll = null;
    }

    /**
     * Enable scroll tracking and start listening to scroll events
     */
    enable() {
        if (this.isEnabled) {
            console.warn('ScrollController already enabled');
            return;
        }

        this.isEnabled = true;
        this.boundHandleScroll = this.handleScroll.bind(this);
        
        // Use passive listener for better scroll performance
        window.addEventListener('scroll', this.boundHandleScroll, { passive: true });
        
        console.log('ScrollController enabled');
    }

    /**
     * Disable scroll tracking and stop listening to scroll events
     */
    disable() {
        if (!this.isEnabled) {
            return;
        }

        this.isEnabled = false;
        
        if (this.boundHandleScroll) {
            window.removeEventListener('scroll', this.boundHandleScroll);
            this.boundHandleScroll = null;
        }

        console.log('ScrollController disabled');
    }

    /**
     * Handle scroll events with requestAnimationFrame throttling
     */
    handleScroll() {
        if (!this.ticking) {
            requestAnimationFrame(() => {
                this.updateScrollProgress();
                this.ticking = false;
            });
            this.ticking = true;
        }
    }

    /**
     * Update scroll progress and handle state transitions
     */
    updateScrollProgress() {
        const scrollY = window.scrollY || window.pageYOffset;

        // Check for reset condition (scrolled back to top)
        if (scrollY < this.config.resetThreshold && this.wasComplete) {
            this.handleReset();
            return;
        }

        // Calculate scroll progress (0.0 to 1.0)
        const progress = Math.min(scrollY / this.config.scrollDistance, 1.0);
        this.currentProgress = progress;

        // Update renderer
        this.renderer.updateScroll(progress);

        // Check for completion
        if (progress >= 1.0 && !this.wasComplete) {
            this.handleComplete();
        }
    }

    /**
     * Handle scroll completion (reached 100%)
     */
    handleComplete() {
        this.wasComplete = true;
        console.log('Scroll transition complete');

        if (this.config.onComplete && typeof this.config.onComplete === 'function') {
            this.config.onComplete();
        }
    }

    /**
     * Handle scroll reset (scrolled back to top)
     */
    handleReset() {
        this.wasComplete = false;
        this.currentProgress = 0.0;
        
        // Reset renderer
        this.renderer.reset();
        
        console.log('Scroll reset to initial state');

        if (this.config.onReset && typeof this.config.onReset === 'function') {
            this.config.onReset();
        }
    }

    /**
     * Get current scroll progress
     * 
     * @returns {number} Current progress from 0.0 to 1.0
     */
    getProgress() {
        return this.currentProgress;
    }

    /**
     * Check if scroll transition is complete
     * 
     * @returns {boolean} True if progress >= 1.0
     */
    isComplete() {
        return this.currentProgress >= 1.0;
    }

    /**
     * Manually set scroll progress (useful for testing or programmatic control)
     * 
     * @param {number} progress - Progress value from 0.0 to 1.0
     */
    setProgress(progress) {
        progress = Math.max(0.0, Math.min(1.0, progress));
        this.currentProgress = progress;
        this.renderer.updateScroll(progress);

        if (progress >= 1.0 && !this.wasComplete) {
            this.handleComplete();
        } else if (progress < 1.0 && this.wasComplete) {
            this.wasComplete = false;
        }
    }

    /**
     * Clean up and remove event listeners
     */
    destroy() {
        console.log('Destroying ScrollController...');
        this.disable();
        this.renderer = null;
        console.log('ScrollController destroyed');
    }
}
