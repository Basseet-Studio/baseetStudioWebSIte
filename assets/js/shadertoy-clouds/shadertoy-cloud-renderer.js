/**
 * ShadertoyCloudRenderer - Main class for rendering volumetric clouds with Shadertoy shaders
 * 
 * This class manages the complete Three.js scene including camera, renderer, shader material,
 * 3D text, and animation loop. It handles scroll-based camera movement, mobile optimization,
 * and lifecycle management.
 */

import * as THREE from 'three';
import { TextureLoader } from './texture-loader.js';
import { getShaderConfig } from './shadertoy-shaders.js';
import { TextRenderer } from './text-renderer.js';

/**
 * Main renderer class for Shadertoy-based volumetric clouds
 */
export class ShadertoyCloudRenderer {
    /**
     * Create a new ShadertoyCloudRenderer instance
     * 
     * @param {string} canvasId - ID of the canvas element to render to
     * @param {Object} options - Configuration options
     * @param {number} options.scrollDistance - Pixels to scroll through scene (default: 600)
     * @param {string} options.textContent - Text to display (default: 'BASEET STUDIO')
     * @param {number} options.fontSize - Font size for 3D text (default: 0.8)
     * @param {number} options.cloudDensity - Cloud density multiplier (default: 0.7)
     * @param {number} options.lookMode - 0: sunset, 1: bright (default: 1)
     * @param {number} options.noiseMethod - Noise sampling method (default: 1)
     * @param {boolean} options.useLOD - Enable level of detail optimization (default: true)
     */
    constructor(canvasId, options = {}) {
        // Store canvas reference
        this.canvasId = canvasId;
        this.canvas = document.getElementById(canvasId);
        
        if (!this.canvas) {
            throw new Error(`Canvas element with id "${canvasId}" not found`);
        }

        // Configuration options
        this.config = {
            scrollDistance: options.scrollDistance !== undefined ? options.scrollDistance : 600,
            textContent: options.textContent || 'BASEET STUDIO',
            fontSize: options.fontSize !== undefined ? options.fontSize : 0.8,
            cloudDensity: options.cloudDensity !== undefined ? options.cloudDensity : 0.7,
            lookMode: options.lookMode !== undefined ? options.lookMode : 1,
            noiseMethod: options.noiseMethod !== undefined ? options.noiseMethod : 1,
            useLOD: options.useLOD !== undefined ? options.useLOD : true
        };

        // Check WebGL support
        if (!this.checkWebGLSupport()) {
            throw new Error('WebGL is not supported in this browser');
        }

        // Detect mobile device and adjust quality settings
        this.isMobile = this.detectMobileDevice();
        if (this.isMobile) {
            console.log('Mobile device detected, reducing quality settings');
            this.config.useLOD = true; // Force LOD on mobile
            this.config.cloudDensity *= 0.7; // Reduce density for performance
        }

        // Initialize state variables
        this.isInitialized = false;
        this.isAnimating = false;
        this.scrollProgress = 0.0;
        this.transitionComplete = false;
        this.animationId = null;
        this.startTime = Date.now();

        // Detect prefers-reduced-motion
        this.prefersReducedMotion = this.detectReducedMotionPreference();
        if (this.prefersReducedMotion) {
            console.log('Reduced motion preference detected, adjusting animation settings');
        }

        // Three.js objects (will be initialized in init())
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cloudMaterial = null;
        this.cloudMesh = null;
        this.textMesh = null;
        this.directionalLight = null;

        // Event listeners (will be bound in init())
        this.boundHandleVisibilityChange = null;
        this.boundHandleResize = null;

        // Initialize Three.js scene, camera, and renderer
        this.initializeThreeJS();
    }

    /**
     * Check if WebGL is supported in the current browser
     * 
     * @returns {boolean} True if WebGL is supported, false otherwise
     */
    checkWebGLSupport() {
        try {
            const testCanvas = document.createElement('canvas');
            const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
            return !!(window.WebGLRenderingContext && gl);
        } catch (e) {
            return false;
        }
    }

    /**
     * Detect if the current device is mobile
     * 
     * @returns {boolean} True if mobile device, false otherwise
     */
    detectMobileDevice() {
        // Check user agent
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        
        // Check screen size
        const isSmallScreen = window.innerWidth <= 768;
        
        // Check touch support
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        return mobileRegex.test(userAgent.toLowerCase()) || (isSmallScreen && isTouchDevice);
    }

    /**
     * Detect if the user prefers reduced motion
     * 
     * @returns {boolean} True if user prefers reduced motion, false otherwise
     */
    detectReducedMotionPreference() {
        // Check for prefers-reduced-motion media query
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            return mediaQuery.matches;
        }
        return false;
    }

    /**
     * Initialize Three.js scene, camera, and renderer
     * This is called in the constructor to set up the basic Three.js objects
     */
    initializeThreeJS() {
        // Add ARIA labels to canvas for accessibility
        this.canvas.setAttribute('aria-label', 'Volumetric cloud animation with BASEET STUDIO text');
        this.canvas.setAttribute('role', 'img');
        
        // Add screen reader description
        const srDescription = document.createElement('span');
        srDescription.className = 'sr-only';
        srDescription.textContent = 'An animated 3D scene showing volumetric clouds floating in the sky with BASEET STUDIO text. Scroll down to navigate through the clouds and access the main content.';
        
        // Insert description before canvas
        if (this.canvas.parentNode) {
            this.canvas.parentNode.insertBefore(srDescription, this.canvas);
        }

        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x4584b4, 10, 50);

        // Create camera - use OrthographicCamera for full-screen shader effect
        // This ensures the shader plane fills the entire screen
        // IMPORTANT: near=-1, far=1 so the plane at z=0 is within the view frustum
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
        this.camera.position.set(0, 0, 0);
        
        console.log('DEBUG - Camera setup:', {
            type: 'OrthographicCamera',
            position: this.camera.position.toArray(),
            near: this.camera.near,
            far: this.camera.far
        });

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: !this.isMobile // Disable antialiasing on mobile for performance
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(this.isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);

        console.log('Three.js initialized:', {
            scene: !!this.scene,
            camera: !!this.camera,
            renderer: !!this.renderer,
            isMobile: this.isMobile,
            ariaLabel: this.canvas.getAttribute('aria-label')
        });
    }

    /**
     * Get the current state of the renderer
     * 
     * @returns {Object} Current state object
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            isAnimating: this.isAnimating,
            scrollProgress: this.scrollProgress,
            transitionComplete: this.transitionComplete,
            camera: {
                position: this.camera ? this.camera.position.clone() : null,
                rotation: this.camera ? this.camera.rotation.clone() : null,
                fov: this.camera ? this.camera.fov : null
            },
            uniforms: this.cloudMaterial ? {
                time: this.cloudMaterial.uniforms.uTime.value,
                scroll: this.cloudMaterial.uniforms.uScroll.value,
                resolution: this.cloudMaterial.uniforms.uResolution.value.clone(),
                mouse: this.cloudMaterial.uniforms.uMouse.value.clone()
            } : null
        };
    }

    /**
     * Initialize the cloud renderer asynchronously
     * Loads textures, creates shader material, loads 3D text, and sets up the scene
     * 
     * @returns {Promise<void>}
     * @throws {Error} If initialization fails
     */
    async init() {
        if (this.isInitialized) {
            console.warn('Renderer already initialized');
            return;
        }

        try {
            console.log('Initializing ShadertoyCloudRenderer...');

            // Load iChannel textures
            console.log('Loading textures...');
            const textures = await TextureLoader.loadChannelTextures();
            console.log('Textures loaded successfully');
            
            // DEBUG: Log texture details
            console.log('DEBUG - Texture details:', {
                channel0: textures.channel0 ? {
                    image: textures.channel0.image ? 'loaded' : 'missing',
                    width: textures.channel0.image?.width,
                    height: textures.channel0.image?.height
                } : 'null',
                channel1: textures.channel1 ? {
                    image: textures.channel1.image ? 'loaded' : 'missing',
                    width: textures.channel1.image?.width,
                    height: textures.channel1.image?.height
                } : 'null',
                channel2: textures.channel2 ? 'present' : 'null',
                channel3: textures.channel3 ? 'present' : 'null'
            });

            // Create shader material with Shadertoy shaders
            console.log('Creating shader material...');
            const shaderConfig = getShaderConfig(textures, {
                resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
                mouse: new THREE.Vector2(0.5, 0.5),
                lookMode: this.config.lookMode,
                noiseMethod: this.config.noiseMethod,
                useLOD: this.config.useLOD ? 1 : 0,
                debugMode: this.config.debugMode || 0
            });
            
            // DEBUG: Log shader config
            console.log('DEBUG - Shader config:', {
                resolution: shaderConfig.uniforms.uResolution.value,
                mouse: shaderConfig.uniforms.uMouse.value,
                lookMode: shaderConfig.uniforms.uLookMode.value,
                noiseMethod: shaderConfig.uniforms.uNoiseMethod.value,
                debugMode: shaderConfig.uniforms.uDebugMode.value,
                hasChannel0: !!shaderConfig.uniforms.uChannel0.value,
                hasChannel1: !!shaderConfig.uniforms.uChannel1.value
            });

            this.cloudMaterial = new THREE.ShaderMaterial({
                uniforms: shaderConfig.uniforms,
                vertexShader: shaderConfig.vertexShader,
                fragmentShader: shaderConfig.fragmentShader,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide
            });
            console.log('Shader material created');
            
            // DEBUG: Check for shader compilation errors
            console.log('DEBUG - ShaderMaterial:', {
                program: this.cloudMaterial.program,
                needsUpdate: this.cloudMaterial.needsUpdate
            });

            // Create cloud plane/volume mesh
            // Make it a full-screen quad that fills the viewport
            const planeGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
            this.cloudMesh = new THREE.Mesh(planeGeometry, this.cloudMaterial);
            // Position it in front of the camera as a screen-space quad
            this.cloudMesh.frustumCulled = false; // Ensure it's always rendered
            this.scene.add(this.cloudMesh);
            
            console.log('DEBUG - Cloud mesh added to scene:', {
                geometry: {
                    type: planeGeometry.type,
                    width: 2,
                    height: 2,
                    vertices: planeGeometry.attributes.position?.count
                },
                mesh: {
                    position: this.cloudMesh.position.toArray(),
                    visible: this.cloudMesh.visible,
                    frustumCulled: this.cloudMesh.frustumCulled
                }
            });

            // Load and create 3D text mesh
            console.log('Loading 3D text...');
            try {
                this.textMesh = await TextRenderer.createTextMeshWithFont(
                    this.config.textContent,
                    {
                        size: this.config.fontSize,
                        height: 0.2,
                        positionZ: -8
                    }
                );
                this.scene.add(this.textMesh);
                console.log('3D text added to scene');
            } catch (error) {
                console.error('Failed to load 3D text:', error);
                console.warn('Continuing without 3D text');
                // Continue without text - not critical for cloud rendering
            }

            // Set up scene lighting (directional light for text)
            this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
            this.directionalLight.position.set(-5, 5, 5);
            this.directionalLight.target.position.set(0, 0, -8);
            this.scene.add(this.directionalLight);
            this.scene.add(this.directionalLight.target);
            console.log('Lighting added to scene');

            // Add ambient light for overall illumination
            const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
            this.scene.add(ambientLight);

            // Set up event listeners
            this.setupEventListeners();

            // Mark as initialized
            this.isInitialized = true;
            console.log('ShadertoyCloudRenderer initialized successfully');

        } catch (error) {
            console.error('Failed to initialize ShadertoyCloudRenderer:', error);
            throw error;
        }
    }

    /**
     * Set up event listeners for visibility change and window resize
     */
    setupEventListeners() {
        // Visibility change handler
        this.boundHandleVisibilityChange = this.handleVisibilityChange.bind(this);
        document.addEventListener('visibilitychange', this.boundHandleVisibilityChange);

        // Window resize handler
        this.boundHandleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.boundHandleResize);

        console.log('Event listeners set up');
    }

    /**
     * Handle visibility change events (pause/resume animation)
     */
    handleVisibilityChange() {
        if (document.hidden) {
            console.log('Tab hidden, pausing animation');
            this.stop();
        } else {
            console.log('Tab visible, resuming animation');
            this.start();
        }
    }

    /**
     * Handle window resize events
     */
    handleResize() {
        if (!this.camera || !this.renderer || !this.cloudMaterial) {
            return;
        }

        // OrthographicCamera doesn't need aspect ratio update
        // Just update the projection matrix
        this.camera.updateProjectionMatrix();

        // Update renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // Update shader resolution uniform
        this.cloudMaterial.uniforms.uResolution.value.set(
            window.innerWidth,
            window.innerHeight
        );

        console.log('Renderer resized:', window.innerWidth, 'x', window.innerHeight);
    }

    /**
     * Start the animation loop
     */
    start() {
        if (!this.isInitialized) {
            console.warn('Cannot start animation: renderer not initialized');
            return;
        }

        if (this.isAnimating) {
            console.warn('Animation already running');
            return;
        }

        this.isAnimating = true;
        this.animate();
        console.log('Animation started');
    }

    /**
     * Stop the animation loop
     */
    stop() {
        if (!this.isAnimating) {
            return;
        }

        this.isAnimating = false;
        
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        console.log('Animation stopped');
    }

    /**
     * Main animation loop
     * Updates time uniform and renders the scene
     */
    animate() {
        if (!this.isAnimating) {
            return;
        }

        // Request next frame
        this.animationId = requestAnimationFrame(() => this.animate());

        // Update time uniform (in seconds)
        // Apply reduced animation speed if user prefers reduced motion
        const currentTime = (Date.now() - this.startTime) / 1000.0;
        const animationSpeed = this.prefersReducedMotion ? 0.1 : 1.0;
        
        if (this.cloudMaterial && this.cloudMaterial.uniforms.uTime) {
            this.cloudMaterial.uniforms.uTime.value = currentTime * animationSpeed;
        }

        // DEBUG: Log first few frames
        if (!this._frameCount) this._frameCount = 0;
        this._frameCount++;
        if (this._frameCount <= 5) {
            console.log(`DEBUG - Frame ${this._frameCount}:`, {
                time: currentTime * animationSpeed,
                cameraPos: this.camera?.position?.toArray(),
                meshVisible: this.cloudMesh?.visible,
                meshPosition: this.cloudMesh?.position?.toArray(),
                sceneChildren: this.scene?.children?.length,
                rendererInfo: this.renderer?.info?.render
            });
        }

        // Render scene
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
            
            // DEBUG: Check for WebGL errors on first frame
            if (this._frameCount === 1) {
                const gl = this.renderer.getContext();
                const error = gl.getError();
                if (error !== gl.NO_ERROR) {
                    console.error('DEBUG - WebGL error:', error);
                }
            }
        }
    }

    /**
     * Update scroll progress and camera position
     * 
     * @param {number} progress - Scroll progress from 0.0 to 1.0
     */
    updateScroll(progress) {
        // Clamp progress to valid range
        progress = Math.max(0.0, Math.min(1.0, progress));
        this.scrollProgress = progress;

        // Update shader uniform - the shader handles the camera movement internally
        if (this.cloudMaterial && this.cloudMaterial.uniforms.uScroll) {
            this.cloudMaterial.uniforms.uScroll.value = progress;
        }

        // Check if transition is complete
        if (progress >= 1.0) {
            this.transitionComplete = true;
        }
    }

    /**
     * Check if the scroll transition is complete
     * 
     * @returns {boolean} True if scroll progress >= 1.0
     */
    isComplete() {
        return this.scrollProgress >= 1.0;
    }

    /**
     * Reset the renderer to initial state
     */
    reset() {
        this.scrollProgress = 0.0;
        this.transitionComplete = false;
        
        // Reset camera position
        if (this.camera) {
            this.camera.position.set(0, 0, 0);
        }

        // Reset shader uniforms
        if (this.cloudMaterial) {
            if (this.cloudMaterial.uniforms.uScroll) {
                this.cloudMaterial.uniforms.uScroll.value = 0.0;
            }
        }

        console.log('Renderer reset to initial state');
    }

    /**
     * Set debug mode for shader visualization
     * @param {number} mode - 0: normal, 1: UV, 2: normalized coords, 3: ray direction, 4: noise texture, 5: density
     */
    setDebugMode(mode) {
        if (this.cloudMaterial && this.cloudMaterial.uniforms.uDebugMode) {
            this.cloudMaterial.uniforms.uDebugMode.value = parseFloat(mode);
            console.log(`DEBUG - Set debug mode to ${mode}`);
            console.log('Debug modes: 0=normal, 1=UV, 2=coords, 3=ray dir, 4=noise, 5=solid blue');
        }
    }

    /**
     * Get debug info about the current state
     */
    getDebugInfo() {
        const info = {
            isInitialized: this.isInitialized,
            isAnimating: this.isAnimating,
            frameCount: this._frameCount || 0,
            camera: this.camera ? {
                position: this.camera.position.toArray(),
                fov: this.camera.fov,
                aspect: this.camera.aspect
            } : null,
            cloudMesh: this.cloudMesh ? {
                visible: this.cloudMesh.visible,
                position: this.cloudMesh.position.toArray(),
                scale: this.cloudMesh.scale.toArray()
            } : null,
            material: this.cloudMaterial ? {
                visible: this.cloudMaterial.visible,
                transparent: this.cloudMaterial.transparent,
                uniforms: {
                    time: this.cloudMaterial.uniforms.uTime?.value,
                    resolution: this.cloudMaterial.uniforms.uResolution?.value,
                    debugMode: this.cloudMaterial.uniforms.uDebugMode?.value,
                    hasChannel0: !!this.cloudMaterial.uniforms.uChannel0?.value,
                    hasChannel1: !!this.cloudMaterial.uniforms.uChannel1?.value
                }
            } : null,
            renderer: this.renderer ? {
                size: { width: this.renderer.domElement.width, height: this.renderer.domElement.height },
                pixelRatio: this.renderer.getPixelRatio(),
                info: this.renderer.info.render
            } : null,
            scene: this.scene ? {
                childCount: this.scene.children.length,
                children: this.scene.children.map(c => c.type)
            } : null
        };
        console.log('DEBUG INFO:', info);
        return info;
    }

    /**
     * Clean up resources and remove event listeners
     */
    destroy() {
        console.log('Destroying ShadertoyCloudRenderer...');

        // Stop animation
        this.stop();

        // Remove event listeners
        if (this.boundHandleVisibilityChange) {
            document.removeEventListener('visibilitychange', this.boundHandleVisibilityChange);
        }
        if (this.boundHandleResize) {
            window.removeEventListener('resize', this.boundHandleResize);
        }

        // Dispose Three.js resources
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (object.material.map) {
                        object.material.map.dispose();
                    }
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }

        // Dispose renderer
        if (this.renderer) {
            this.renderer.dispose();
        }

        // Clear references
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cloudMaterial = null;
        this.cloudMesh = null;
        this.textMesh = null;
        this.directionalLight = null;

        this.isInitialized = false;
        console.log('ShadertoyCloudRenderer destroyed');
    }
}

