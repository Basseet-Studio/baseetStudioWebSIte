/**
 * Hero Cloud Adapter
 * Simplified adapter for volumetric clouds on the hero section
 * Works without ES6 modules for easier integration
 */

class CloudRenderer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.options = {
            density: options.density || 0.5,
            scale: options.scale || 1.0,
            scrollEnabled: options.scrollEnabled !== undefined ? options.scrollEnabled : true
        };
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cloudMesh = null;
        this.animationProgress = 0;
        this.isInitialized = false;
        this.animationId = null;
    }
    
    /**
     * Initialize the Three.js scene with volumetric clouds
     */
    init() {
        if (!window.THREE) {
            console.error('THREE.js is not loaded');
            return;
        }
        
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.canvas.offsetWidth / this.canvas.offsetHeight,
            0.1,
            1000
        );
        this.camera.position.z = 2;
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(this.canvas.offsetWidth, this.canvas.offsetHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Create cloud mesh
        this.createCloudMesh();
        
        // Handle resize
        window.addEventListener('resize', () => this.onResize());
        
        // Start animation
        this.isInitialized = true;
        this.animate();
    }
    
    /**
     * Create cloud mesh with volumetric shader
     */
    createCloudMesh() {
        if (!window.generate3DTexture || !window.vertexShader || !window.fragmentShader) {
            console.error('Cloud shader dependencies not loaded');
            return;
        }
        
        // Generate 3D noise texture
        const texture = window.generate3DTexture(128);
        
        // Create geometry
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        
        // Create shader material
        const material = new THREE.ShaderMaterial({
            vertexShader: window.vertexShader,
            fragmentShader: window.fragmentShader,
            uniforms: {
                map: { value: texture },
                threshold: { value: 0.3 },
                opacity: { value: this.options.density },
                steps: { value: 80.0 },
                time: { value: 0 }
            },
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false
        });
        
        // Create mesh
        this.cloudMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.cloudMesh);
    }
    
    /**
     * Animation loop
     */
    animate() {
        if (!this.isInitialized) return;
        
        this.animationId = requestAnimationFrame(() => this.animate());
        
        if (this.cloudMesh) {
            // Gentle rotation
            this.cloudMesh.rotation.y += 0.0003;
            this.cloudMesh.rotation.x += 0.0001;
            
            // Update based on animation progress (scroll)
            const progress = this.animationProgress;
            
            // Scale clouds as they approach viewer (zoom effect)
            const scale = this.options.scale * (1 + progress * 2);
            this.cloudMesh.scale.set(scale, scale, scale);
            
            // Move clouds upward and away as scroll progresses
            this.cloudMesh.position.y = progress * 3;
            this.cloudMesh.position.z = -progress * 2;
            
            // Fade out clouds as animation progresses
            if (this.cloudMesh.material.uniforms.opacity) {
                this.cloudMesh.material.uniforms.opacity.value = 
                    this.options.density * (1 - progress * 1.5);
            }
            
            // Update time uniform for animated effects
            if (this.cloudMesh.material.uniforms.time) {
                this.cloudMesh.material.uniforms.time.value += 0.001;
            }
        }
        
        // Render scene
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    /**
     * Set animation progress (0 to 1) based on scroll
     */
    setAnimationProgress(progress) {
        this.animationProgress = Math.max(0, Math.min(1, progress));
    }
    
    /**
     * Reset animation to initial state
     */
    resetAnimation() {
        this.animationProgress = 0;
        if (this.cloudMesh) {
            this.cloudMesh.scale.set(this.options.scale, this.options.scale, this.options.scale);
            this.cloudMesh.position.set(0, 0, 0);
            if (this.cloudMesh.material.uniforms.opacity) {
                this.cloudMesh.material.uniforms.opacity.value = this.options.density;
            }
        }
    }
    
    /**
     * Handle window resize
     */
    onResize() {
        if (!this.camera || !this.renderer) return;
        
        const width = this.canvas.offsetWidth;
        const height = this.canvas.offsetHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.cloudMesh) {
            if (this.cloudMesh.geometry) this.cloudMesh.geometry.dispose();
            if (this.cloudMesh.material) {
                if (this.cloudMesh.material.uniforms.map.value) {
                    this.cloudMesh.material.uniforms.map.value.dispose();
                }
                this.cloudMesh.material.dispose();
            }
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// Make it globally available
window.CloudRenderer = CloudRenderer;
