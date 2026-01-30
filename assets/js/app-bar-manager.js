/**
 * AppBarManager - Manages app bar state, styling, and interactions
 * Synchronizes with scroll manager events for seamless transitions
 */
class AppBarManager {
    constructor(appBarElement) {
        if (!appBarElement) {
            console.error('AppBarManager: App bar element not found');
            return;
        }

        // Store references
        this.appBar = appBarElement;
        this.progressIndicator = appBarElement.querySelector('.progress-indicator');
        this.mobileMenuToggle = appBarElement.querySelector('.mobile-menu-toggle');
        this.mobileMenu = appBarElement.querySelector('.mobile-menu');
        this.mobileNavLinks = appBarElement.querySelectorAll('.mobile-nav-links a');

        // Initialize state
        this.currentMode = 'cloud';
        this.isTransitioning = false;
        this.mobileMenuOpen = false;
        this.rafId = null;
        this.lastStateChange = 0;
        this.stateChangeDebounce = 50; // ms

        // Bind methods to instance
        this.setCloudMode = this.setCloudMode.bind(this);
        this.setSiteMode = this.setSiteMode.bind(this);
        this.updateProgress = this.updateProgress.bind(this);
        this.toggleMobileMenu = this.toggleMobileMenu.bind(this);
        this.closeMobileMenu = this.closeMobileMenu.bind(this);
        this.handleCloudModeEnter = this.handleCloudModeEnter.bind(this);
        this.handleSiteModeEnter = this.handleSiteModeEnter.bind(this);
        this.handleStaggerProgress = this.handleStaggerProgress.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.handleMobileNavClick = this.handleMobileNavClick.bind(this);

        // Verify required elements
        if (!this.progressIndicator) {
            console.warn('AppBarManager: Progress indicator not found');
        }

        // Initialize event listeners
        this.initEventListeners();
    }

    /**
     * Initialize all event listeners
     */
    initEventListeners() {
        // Scroll manager events
        try {
            window.addEventListener('cloudModeEnter', this.handleCloudModeEnter);
            window.addEventListener('siteModeEnter', this.handleSiteModeEnter);
            window.addEventListener('staggerProgress', this.handleStaggerProgress);
        } catch (error) {
            console.error('AppBarManager: Failed to register scroll manager event listeners:', error);
        }

        // Mobile menu events
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.addEventListener('click', this.toggleMobileMenu);
        }

        // Mobile nav link clicks
        this.mobileNavLinks.forEach(link => {
            link.addEventListener('click', this.handleMobileNavClick);
        });

        // Outside click to close mobile menu
        document.addEventListener('click', this.handleOutsideClick);
    }

    /**
     * Set app bar to cloud mode
     */
    setCloudMode() {
        // Debounce rapid state changes
        const now = Date.now();
        if (now - this.lastStateChange < this.stateChangeDebounce) {
            return;
        }
        this.lastStateChange = now;

        this.currentMode = 'cloud';
        this.appBar.classList.remove('app-bar-site');
        this.appBar.classList.add('app-bar-cloud');
        
        // Reset progress indicator
        this.updateProgress(0);
        
        // Close mobile menu if open
        this.closeMobileMenu();

        // Mark as transitioning
        this.isTransitioning = true;
        this.appBar.style.willChange = 'opacity, background-color';

        // Remove will-change after transition
        setTimeout(() => {
            this.isTransitioning = false;
            this.appBar.style.willChange = 'auto';
        }, 600);
    }

    /**
     * Set app bar to site mode
     */
    setSiteMode() {
        // Debounce rapid state changes
        const now = Date.now();
        if (now - this.lastStateChange < this.stateChangeDebounce) {
            return;
        }
        this.lastStateChange = now;

        this.currentMode = 'site';
        this.appBar.classList.remove('app-bar-cloud');
        this.appBar.classList.add('app-bar-site');
        
        // Reset progress indicator
        this.updateProgress(0);
        
        // Close mobile menu if open
        this.closeMobileMenu();

        // Mark as transitioning
        this.isTransitioning = true;
        this.appBar.style.willChange = 'opacity, background-color';

        // Remove will-change after transition
        setTimeout(() => {
            this.isTransitioning = false;
            this.appBar.style.willChange = 'auto';
        }, 600);
    }

    /**
     * Update progress indicator
     * @param {number} progress - Progress value from 0 to 1
     */
    updateProgress(progress) {
        if (!this.progressIndicator) return;

        // Use requestAnimationFrame for smooth updates
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }

        this.rafId = requestAnimationFrame(() => {
            if (progress > 0) {
                this.progressIndicator.style.width = `${progress * 100}%`;
                this.progressIndicator.style.opacity = '1';
            } else {
                this.progressIndicator.style.width = '0%';
                this.progressIndicator.style.opacity = '0';
            }
        });
    }

    /**
     * Toggle mobile menu open/close
     */
    toggleMobileMenu() {
        if (this.mobileMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    /**
     * Open mobile menu
     */
    openMobileMenu() {
        if (!this.mobileMenu || !this.mobileMenuToggle) return;

        this.mobileMenuOpen = true;
        this.mobileMenu.classList.add('open');
        this.mobileMenu.setAttribute('aria-hidden', 'false');
        this.mobileMenuToggle.setAttribute('aria-expanded', 'true');

        // Prevent body scroll (using class for better compatibility)
        document.body.classList.add('mobile-menu-open');
    }

    /**
     * Close mobile menu and reset state
     */
    closeMobileMenu() {
        if (!this.mobileMenu || !this.mobileMenuToggle) return;

        this.mobileMenuOpen = false;
        this.mobileMenu.classList.remove('open');
        this.mobileMenu.setAttribute('aria-hidden', 'true');
        this.mobileMenuToggle.setAttribute('aria-expanded', 'false');

        // Restore body scroll
        document.body.classList.remove('mobile-menu-open');
    }

    /**
     * Handle cloudModeEnter event
     */
    handleCloudModeEnter() {
        try {
            this.setCloudMode();
        } catch (error) {
            console.error('AppBarManager: Error handling cloudModeEnter:', error);
        }
    }

    /**
     * Handle siteModeEnter event
     */
    handleSiteModeEnter() {
        try {
            this.setSiteMode();
        } catch (error) {
            console.error('AppBarManager: Error handling siteModeEnter:', error);
        }
    }

    /**
     * Handle staggerProgress event
     * @param {CustomEvent} event - Event with progress detail
     */
    handleStaggerProgress(event) {
        try {
            const progress = event.detail?.progress || 0;
            this.updateProgress(progress);
        } catch (error) {
            console.error('AppBarManager: Error handling staggerProgress:', error);
        }
    }

    /**
     * Handle clicks outside mobile menu to close it
     * @param {MouseEvent} event - Click event
     */
    handleOutsideClick(event) {
        if (!this.mobileMenuOpen) return;

        const isClickInsideMenu = this.mobileMenu?.contains(event.target);
        const isClickOnToggle = this.mobileMenuToggle?.contains(event.target);

        if (!isClickInsideMenu && !isClickOnToggle) {
            this.closeMobileMenu();
        }
    }

    /**
     * Handle mobile navigation link clicks
     */
    handleMobileNavClick() {
        this.closeMobileMenu();
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        // Remove scroll manager event listeners
        window.removeEventListener('cloudModeEnter', this.handleCloudModeEnter);
        window.removeEventListener('siteModeEnter', this.handleSiteModeEnter);
        window.removeEventListener('staggerProgress', this.handleStaggerProgress);

        // Remove mobile menu event listeners
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.removeEventListener('click', this.toggleMobileMenu);
        }

        this.mobileNavLinks.forEach(link => {
            link.removeEventListener('click', this.handleMobileNavClick);
        });

        document.removeEventListener('click', this.handleOutsideClick);

        // Cancel any pending animation frames
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }

        // Restore body scroll if menu was open
        if (this.mobileMenuOpen) {
            document.body.classList.remove('mobile-menu-open');
        }
    }
}

// Export for module usage
export default AppBarManager;
