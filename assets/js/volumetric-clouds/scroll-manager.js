/**
 * ScrollManager
 * Controls scroll behavior and manages state transitions between cloud and site modes
 */
export class ScrollManager {
    /**
     * @param {Object} cloudRenderer - VolumetricCloudRenderer instance
     */
    constructor(cloudRenderer) {
        this.cloudRenderer = cloudRenderer;
        
        // State machine states
        this.STATES = {
            CLOUD_MODE: 'CLOUD_MODE',
            TRANSITIONING: 'TRANSITIONING',
            SITE_MODE: 'SITE_MODE'
        };
        
        // Initialize state to CLOUD_MODE
        this.state = this.STATES.CLOUD_MODE;
        
        // Configuration
        this.config = {
            scrollThreshold: 150,        // pixels to scroll down before transitioning
            staggerDelay: 800,            // ms to hold scroll up before returning to clouds
            transitionDuration: 600       // ms for transition animations
        };
        
        // Scroll tracking
        this.scrollAccumulator = 0;
        this.lastScrollTime = 0;
        this.scrollDirection = null;
        this.scrollUpStartTime = null;
        
        // Touch tracking
        this.touchStartY = 0;
        this.touchStartTime = 0;
        
        // Bind methods
        this.onWheel = this.onWheel.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize ScrollManager
     * Apply overscroll-behavior and add cloud-mode class to body
     */
    init() {
        // Apply overscroll-behavior to prevent page bounce
        document.body.style.overscrollBehavior = 'none';
        
        // Add cloud-mode class to body
        document.body.classList.add('cloud-mode');
        
        // Disable body overflow in CLOUD_MODE
        document.body.style.overflow = 'hidden';
        
        // Add event listeners
        window.addEventListener('wheel', this.onWheel, { passive: false });
        window.addEventListener('touchstart', this.onTouchStart, { passive: false });
        window.addEventListener('touchmove', this.onTouchMove, { passive: false });
        window.addEventListener('keydown', this.onKeyDown);
    }

    /**
     * Handle wheel events
     * Detects scroll direction and routes to appropriate handler
     * @param {WheelEvent} event - Wheel event
     */
    onWheel(event) {
        // Prevent events during TRANSITIONING state
        if (this.state === this.STATES.TRANSITIONING) {
            event.preventDefault();
            return;
        }
        
        const currentTime = Date.now();
        const delta = event.deltaY;
        
        // Detect scroll direction
        const newDirection = delta > 0 ? 'down' : 'up';
        
        // Reset accumulator if direction changed
        if (this.scrollDirection !== newDirection) {
            this.scrollAccumulator = 0;
            this.scrollDirection = newDirection;
        }
        
        this.lastScrollTime = currentTime;
        
        // Route to appropriate handler based on state
        if (this.state === this.STATES.CLOUD_MODE) {
            this.handleCloudMode(delta);
        } else if (this.state === this.STATES.SITE_MODE) {
            this.handleSiteMode(delta);
        }
    }

    /**
     * Handle scroll events in CLOUD_MODE
     * Accumulates downward scroll and triggers transition when threshold reached
     * @param {number} delta - Scroll delta value
     */
    handleCloudMode(delta) {
        // Only accumulate downward scroll
        if (delta > 0) {
            this.scrollAccumulator += Math.abs(delta);
            
            // Update scroll indicator with progress
            const progress = Math.min(this.scrollAccumulator / this.config.scrollThreshold, 1);
            this.updateScrollIndicator(progress);
            
            // Trigger transition when threshold reached
            if (this.scrollAccumulator >= this.config.scrollThreshold) {
                this.transitionToSite();
            }
        }
        // Prevent upward scroll from exiting cloud mode (do nothing)
    }

    /**
     * Handle scroll events in SITE_MODE
     * Detects scroll up at top of page and triggers transition after stagger delay
     * @param {number} delta - Scroll delta value
     */
    handleSiteMode(delta) {
        // Detect when at top of page (scrollY === 0)
        if (window.scrollY === 0 && delta < 0) {
            // Start stagger delay timer on upward scroll at top
            if (!this.scrollUpStartTime) {
                this.scrollUpStartTime = Date.now();
            }
            
            const timeHeld = Date.now() - this.scrollUpStartTime;
            
            // Update scroll indicator with progress
            const progress = Math.min(timeHeld / this.config.staggerDelay, 1);
            this.updateScrollIndicator(progress);
            
            // Dispatch stagger progress event for app bar
            window.dispatchEvent(new CustomEvent('staggerProgress', {
                detail: { progress }
            }));
            
            // Trigger transitionToCloud() after stagger delay of continuous upward scroll
            if (timeHeld >= this.config.staggerDelay) {
                this.transitionToCloud();
            }
        } else {
            // Reset timer if user stops or scrolls down
            this.scrollUpStartTime = null;
            this.updateScrollIndicator(0);
            
            // Dispatch progress reset event
            window.dispatchEvent(new CustomEvent('staggerProgress', {
                detail: { progress: 0 }
            }));
        }
    }

    /**
     * Transition from CLOUD_MODE to SITE_MODE
     * Fades out clouds and reveals site content
     */
    transitionToSite() {
        // Set state to TRANSITIONING
        this.state = this.STATES.TRANSITIONING;
        
        // Dispatch transition start event
        window.dispatchEvent(new CustomEvent('transitionStart', {
            detail: { from: 'cloud', to: 'site' }
        }));
        
        // Reset scroll accumulator
        this.scrollAccumulator = 0;
        
        // Fade out clouds via cloudRenderer.setVisibility(false)
        if (this.cloudRenderer) {
            this.cloudRenderer.setVisibility(false);
        }
        
        // Update body classes (remove cloud-mode, add site-mode)
        document.body.classList.remove('cloud-mode');
        document.body.classList.add('transitioning');
        
        // Enable body overflow after transition duration
        setTimeout(() => {
            document.body.classList.remove('transitioning');
            document.body.classList.add('site-mode');
            document.body.style.overflow = 'auto';
            
            // Set state to SITE_MODE and scroll to 1px
            this.state = this.STATES.SITE_MODE;
            window.scrollTo(0, 1);
            
            // Reset scroll indicator
            this.updateScrollIndicator(0);
            
            // Dispatch site mode enter event
            window.dispatchEvent(new CustomEvent('siteModeEnter'));
        }, this.config.transitionDuration);
    }

    /**
     * Transition from SITE_MODE to CLOUD_MODE
     * Scrolls to top and fades in clouds
     */
    transitionToCloud() {
        // Set state to TRANSITIONING
        this.state = this.STATES.TRANSITIONING;
        
        // Dispatch transition start event
        window.dispatchEvent(new CustomEvent('transitionStart', {
            detail: { from: 'site', to: 'cloud' }
        }));
        
        // Reset scroll up timer
        this.scrollUpStartTime = null;
        
        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Update body classes (remove site-mode, add transitioning)
        document.body.classList.remove('site-mode');
        document.body.classList.add('transitioning');
        
        // Wait a bit for scroll to complete, then fade in clouds
        setTimeout(() => {
            // Fade in clouds via cloudRenderer.setVisibility(true)
            if (this.cloudRenderer) {
                this.cloudRenderer.setVisibility(true);
            }
            
            // Update body classes (remove transitioning, add cloud-mode)
            document.body.classList.remove('transitioning');
            document.body.classList.add('cloud-mode');
            
            // Disable body overflow
            document.body.style.overflow = 'hidden';
            
            // Set state to CLOUD_MODE
            this.state = this.STATES.CLOUD_MODE;
            
            // Reset scroll indicator
            this.updateScrollIndicator(0);
            
            // Dispatch cloud mode enter event
            window.dispatchEvent(new CustomEvent('cloudModeEnter'));
        }, 300);
    }

    /**
     * Update scroll indicator
     * Updates indicator width based on progress (0-1)
     * @param {number} progress - Progress value between 0 and 1
     */
    updateScrollIndicator(progress) {
        const indicator = document.getElementById('scroll-indicator');
        
        if (!indicator) return;
        
        // Update indicator width based on progress
        const progressBar = indicator.querySelector('.scroll-progress');
        if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
        }
        
        // Control indicator opacity
        if (progress > 0) {
            indicator.style.opacity = '1';
        } else {
            indicator.style.opacity = '0';
        }
    }
    
    /**
     * Handle touch start events
     * Records initial touch position and timestamp
     * @param {TouchEvent} event - Touch event
     */
    onTouchStart(event) {
        // Record initial touch Y coordinate
        this.touchStartY = event.touches[0].clientY;
        
        // Record timestamp
        this.touchStartTime = Date.now();
    }
    
    /**
     * Handle touch move events
     * Calculates touch delta and applies same logic as wheel events
     * @param {TouchEvent} event - Touch event
     */
    onTouchMove(event) {
        // Prevent default during TRANSITIONING
        if (this.state === this.STATES.TRANSITIONING) {
            event.preventDefault();
            return;
        }
        
        // Calculate touch delta from initial position
        const currentY = event.touches[0].clientY;
        const touchDelta = this.touchStartY - currentY; // Positive = swipe up, negative = swipe down
        
        // Convert touch delta to wheel-like delta for consistency
        // Multiply by a factor to make touch feel similar to wheel
        const wheelEquivalentDelta = touchDelta * 2;
        
        // Detect scroll direction
        const newDirection = wheelEquivalentDelta > 0 ? 'down' : 'up';
        
        // Reset accumulator if direction changed
        if (this.scrollDirection !== newDirection) {
            this.scrollAccumulator = 0;
            this.scrollDirection = newDirection;
        }
        
        // Handle CLOUD_MODE touch gestures
        if (this.state === this.STATES.CLOUD_MODE) {
            // Only accumulate upward swipes (touchDelta > 0 means swipe up)
            if (touchDelta > 0) {
                this.scrollAccumulator += Math.abs(touchDelta);
                
                // Update scroll indicator with progress
                const progress = Math.min(this.scrollAccumulator / this.config.scrollThreshold, 1);
                this.updateScrollIndicator(progress);
                
                // Trigger transition when threshold reached
                if (this.scrollAccumulator >= this.config.scrollThreshold) {
                    this.transitionToSite();
                    // Reset touch start position to prevent multiple triggers
                    this.touchStartY = currentY;
                    this.scrollAccumulator = 0;
                }
            }
        } 
        // Handle SITE_MODE touch gestures
        else if (this.state === this.STATES.SITE_MODE) {
            // Detect when at top of page and swiping down (touchDelta < 0)
            if (window.scrollY === 0 && touchDelta < 0) {
                // Prevent default to avoid page scroll
                event.preventDefault();
                
                // Start stagger delay timer on downward swipe at top
                if (!this.scrollUpStartTime) {
                    this.scrollUpStartTime = Date.now();
                }
                
                const timeHeld = Date.now() - this.scrollUpStartTime;
                
                // Update scroll indicator with progress
                const progress = Math.min(timeHeld / this.config.staggerDelay, 1);
                this.updateScrollIndicator(progress);
                
                // Trigger transitionToCloud() after 300ms of continuous downward swipe
                if (timeHeld >= this.config.staggerDelay) {
                    this.transitionToCloud();
                    // Reset touch start position
                    this.touchStartY = currentY;
                    this.scrollUpStartTime = null;
                }
            } else {
                // Reset timer if user stops or swipes up
                this.scrollUpStartTime = null;
                this.updateScrollIndicator(0);
            }
        }
        
        // Update touch start position for continuous tracking
        this.touchStartY = currentY;
    }
    
    /**
     * Handle keyboard events
     * Handles arrow keys, page down, and space for navigation
     * @param {KeyboardEvent} event - Keyboard event
     */
    onKeyDown(event) {
        // Prevent events during TRANSITIONING state
        if (this.state === this.STATES.TRANSITIONING) {
            return;
        }
        
        // Handle CLOUD_MODE keyboard navigation
        if (this.state === this.STATES.CLOUD_MODE) {
            // Detect Arrow Down, Page Down, Space
            if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
                // Prevent default behavior for handled keys
                event.preventDefault();
                
                // Trigger transition to site
                this.transitionToSite();
            }
        }
        // Handle SITE_MODE keyboard navigation
        else if (this.state === this.STATES.SITE_MODE) {
            // Detect Arrow Up at scrollY === 0
            if (event.key === 'ArrowUp' && window.scrollY === 0) {
                // Prevent default behavior for handled keys
                event.preventDefault();
                
                // Trigger transition to clouds
                this.transitionToCloud();
            }
        }
    }
    
    /**
     * Clean up event listeners
     */
    destroy() {
        window.removeEventListener('wheel', this.onWheel);
        window.removeEventListener('touchstart', this.onTouchStart);
        window.removeEventListener('touchmove', this.onTouchMove);
        window.removeEventListener('keydown', this.onKeyDown);
    }
}
