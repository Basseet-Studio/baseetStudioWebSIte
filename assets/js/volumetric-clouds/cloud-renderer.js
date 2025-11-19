import * as THREE from 'three';
import { generate3DTexture } from './texture-generator.js';
import { vertexShader, fragmentShader } from './shaders.js';

/**
 * VolumetricCloudRenderer
 * Manages Three.js scene, WebGL rendering, and volumetric cloud visualization
 * using raymarching shaders
 */
export class VolumetricCloudRenderer {
    /**
     * @param {string} containerId - DOM element ID for the canvas container
     * @param {Object} options - Configuration options
     * @param {number} options.textureSize - 3D texture resolution (default: 128 desktop, 64 mobile)
     * @param {number} options.threshold - Cloud density threshold (default: 0.25)
     * @param {number} options.opacity - Cloud opacity multiplier (default: 0.25)
     * @param {number} options.steps - Raymarching iterations (default: 100 desktop, 50 mobile)
     * @param {number} options.rotationSpeed - Rotation speed in radians per frame (default: 0.0005)
     */
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            console.error(`Container with id "${containerId}" not found`);
            return;
        }
        
        // Detect mobile devices
        this.isMobile = this.detectMobile();
        
        // Configure settings based on device type
        this.config = {
            textureSize: options.textureSize || (this.isMobile ? 64 : 128),
            threshold: options.threshold || 0.25,
            opacity: options.opacity || 0.25,
            steps: options.steps || (this.isMobile ? 50.0 : 100.0),
            rotationSpeed: options.rotationSpeed || 0.0005
        };
        
        // Initialize state
        this.isAnimating = false;
        this.animationId = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cloudMesh = null;
        
        // Bind methods
        this.animate = this.animate.bind(this);
        this.onResize = this.onResize.bind(this);
        this.onVisibilityChange = this.onVisibilityChange.bind(this);
        
        // Initialize the renderer
        this.init();
    }
    
    /**
     * Detect if the device is mobile
     * @returns {boolean} - True if mobile device
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        ) || window.innerWidth < 768;
    }
    
    /**
     * Check if WebGL is supported in the browser
     * @returns {boolean} - True if WebGL is supported
     */
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const hasWebGL = !!(
                window.WebGLRenderingContext &&
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
            );
            return hasWebGL;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Handle WebGL fallback
     * Hides canvas and adds fallback class to body
     */
    handleWebGLFallback() {
        console.warn('WebGL not supported. Using CSS fallback.');
        
        // Hide the canvas container
        if (this.container) {
            this.container.style.display = 'none';
        }
        
        // Add fallback class to body
        document.body.classList.add('css-clouds-fallback');
    }
    
    /**
     * Initialize the Three.js scene, camera, renderer, and cloud mesh
     */
    init() {
        // Check WebGL support
        if (!this.checkWebGLSupport()) {
            this.handleWebGLFallback();
            return;
        }
        
        // Initialize Three.js scene
        this.scene = new THREE.Scene();
        
        // Initialize camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 1.5;
        
        // Initialize renderer
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: !this.isMobile, // Disable antialiasing on mobile for performance
            powerPreference: 'high-performance'
        });
        
        // Set pixel ratio based on device type
        const maxPixelRatio = this.isMobile ? 1.5 : 2.0;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);
        
        // Create cloud mesh
        this.createCloudMesh();
        
        // Add event listeners
        window.addEventListener('resize', this.onResize);
        document.addEventListener('visibilitychange', this.onVisibilityChange);
        
        // Start animation
        this.startAnimation();
    }
    
    /**
     * Create the cloud mesh with shader material
     */
    createCloudMesh() {
        // Generate 3D Perlin noise texture
        const texture = generate3DTexture(this.config.textureSize);
        
        // Create box geometry (1x1x1 cube)
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        
        // Create shader material
        const material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                map: { value: texture },
                threshold: { value: this.config.threshold },
                opacity: { value: this.config.opacity },
                steps: { value: this.config.steps }
            },
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false
        });
        
        // Create mesh and add to scene
        this.cloudMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.cloudMesh);
    }
    
    /**
     * Animation loop
     * Applies rotation and renders the scene
     */
    animate() {
        if (!this.isAnimating) return;
        
        this.animationId = requestAnimationFrame(this.animate);
        
        // Apply gentle rotation to cloud mesh
        if (this.cloudMesh) {
            this.cloudMesh.rotation.y += this.config.rotationSpeed;
        }
        
        // Render scene
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    /**
     * Start the animation loop
     */
    startAnimation() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.animate();
    }
    
    /**
     * Stop the animation loop
     */
    stopAnimation() {
        this.isAnimating = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    /**
     * Set visibility of the cloud canvas
     * @param {boolean} visible - True to show clouds, false to hide
     */
    setVisibility(visible) {
        if (!this.container) return;
        
        if (visible) {
            // Fade in clouds
            this.container.style.opacity = '1';
            this.startAnimation();
        } else {
            // Fade out clouds
            this.container.style.opacity = '0';
            
            // Stop animation after transition completes
            setTimeout(() => {
                if (this.container.style.opacity === '0') {
                    this.stopAnimation();
                }
            }, 600); // Match CSS transition duration
        }
    }
    
    /**
     * Handle window resize
     */
    onResize() {
        if (!this.camera || !this.renderer) return;
        
        // Update camera aspect ratio
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * Handle visibility change (tab hidden/visible)
     */
    onVisibilityChange() {
        if (document.hidden) {
            // Pause animation when tab is hidden
            this.stopAnimation();
        } else {
            // Resume animation when tab becomes visible
            // Only if container is visible (opacity > 0)
            if (this.container && parseFloat(this.container.style.opacity) > 0) {
                this.startAnimation();
            }
        }
    }
    
    /**
     * Clean up resources and remove event listeners
     */
    destroy() {
        // Stop animation
        this.stopAnimation();
        
        // Remove event listeners
        window.removeEventListener('resize', this.onResize);
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        
        // Dispose of Three.js resources
        if (this.cloudMesh) {
            if (this.cloudMesh.geometry) {
                this.cloudMesh.geometry.dispose();
            }
            if (this.cloudMesh.material) {
                this.cloudMesh.material.dispose();
                
                // Dispose of texture
                if (this.cloudMesh.material.uniforms.map.value) {
                    this.cloudMesh.material.uniforms.map.value.dispose();
                }
            }
        }
        
        // Dispose of renderer
        if (this.renderer) {
            this.renderer.dispose();
            
            // Remove canvas from DOM
            if (this.container && this.renderer.domElement) {
                this.container.removeChild(this.renderer.domElement);
            }
        }
        
        // Clear references
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cloudMesh = null;
    }
}
