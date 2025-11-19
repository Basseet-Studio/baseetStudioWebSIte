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
     * Create multiple cloud puffs with volumetric shader
     */
    createCloudMesh() {
        if (!window.generate3DTexture || !window.vertexShader || !window.fragmentShader) {
            console.error('Cloud shader dependencies not loaded');
            return;
        }
        
        // Generate 3D noise texture
        const texture = window.generate3DTexture(128);
        
        // Create group to hold all clouds
        this.cloudMesh = new THREE.Group();
        
        // Create multiple cloud puffs with varied shapes and positions
        const cloudCount = 12; // Multiple clouds for depth
        
        for (let i = 0; i < cloudCount; i++) {
            // Random organic shapes using SphereGeometry with distortion
            const segments = 16 + Math.floor(Math.random() * 16); // 16-32 segments for variety
            const geometry = new THREE.SphereGeometry(
                0.3 + Math.random() * 0.4, // Random size 0.3-0.7
                segments,
                segments
            );
            
            // Distort vertices for irregular, organic cloud shapes
            const positions = geometry.attributes.position;
            for (let j = 0; j < positions.count; j++) {
                const x = positions.getX(j);
                const y = positions.getY(j);
                const z = positions.getZ(j);
                
                // Add noise-based distortion for fluffy cloud appearance
                const noise = Math.random() * 0.15;
                positions.setXYZ(
                    j,
                    x * (1 + noise),
                    y * (1 + noise * 1.2), // More vertical stretching
                    z * (1 + noise)
                );
            }
            geometry.attributes.position.needsUpdate = true;
            geometry.computeVertexNormals();
            
            // Create shader material with varied opacity for depth
            const material = new THREE.ShaderMaterial({
                vertexShader: window.vertexShader,
                fragmentShader: window.fragmentShader,
                uniforms: {
                    map: { value: texture },
                    threshold: { value: 0.25 + Math.random() * 0.15 }, // Varied density
                    opacity: { value: this.options.density * (0.5 + Math.random() * 0.5) },
                    steps: { value: 60.0 + Math.random() * 40.0 }, // Varied detail
                    time: { value: Math.random() * 100 }
                },
                side: THREE.BackSide,
                transparent: true,
                depthWrite: false
            });
            
            // Create individual cloud puff
            const cloudPuff = new THREE.Mesh(geometry, material);
            
            // Distribute clouds in 3D space around the text
            // Some in front, some behind, scattered horizontally
            cloudPuff.position.x = (Math.random() - 0.5) * 4; // -2 to 2
            cloudPuff.position.y = (Math.random() - 0.5) * 3; // -1.5 to 1.5
            cloudPuff.position.z = (Math.random() - 0.5) * 6 - 1; // -4 to 2 (mostly behind)
            
            // Random rotation for variety
            cloudPuff.rotation.x = Math.random() * Math.PI;
            cloudPuff.rotation.y = Math.random() * Math.PI;
            cloudPuff.rotation.z = Math.random() * Math.PI;
            
            // Store original position for animation
            cloudPuff.userData.originalPosition = cloudPuff.position.clone();
            cloudPuff.userData.rotationSpeed = {
                x: (Math.random() - 0.5) * 0.0002,
                y: (Math.random() - 0.5) * 0.0004,
                z: (Math.random() - 0.5) * 0.0002
            };
            
            this.cloudMesh.add(cloudPuff);
        }
        
        this.scene.add(this.cloudMesh);
    }
    
    /**
     * Animation loop
     */
    animate() {
        if (!this.isInitialized) return;
        
        this.animationId = requestAnimationFrame(() => this.animate());
        
        if (this.cloudMesh) {
            // Gentle rotation of entire cloud group
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
            
            // Update each cloud puff individually
            this.cloudMesh.children.forEach((cloudPuff, index) => {
                // Individual rotation for organic movement
                if (cloudPuff.userData.rotationSpeed) {
                    cloudPuff.rotation.x += cloudPuff.userData.rotationSpeed.x;
                    cloudPuff.rotation.y += cloudPuff.userData.rotationSpeed.y;
                    cloudPuff.rotation.z += cloudPuff.userData.rotationSpeed.z;
                }
                
                // Update time uniform for animated effects
                if (cloudPuff.material && cloudPuff.material.uniforms) {
                    if (cloudPuff.material.uniforms.time) {
                        cloudPuff.material.uniforms.time.value += 0.01;
                    }
                    
                    // Fade out clouds as animation progresses
                    if (cloudPuff.material.uniforms.opacity) {
                        const baseOpacity = this.options.density * (0.5 + Math.random() * 0.5);
                        cloudPuff.material.uniforms.opacity.value = baseOpacity * (1 - progress * 1.5);
                    }
                }
            });
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
            
            // Reset each cloud puff's opacity
            this.cloudMesh.children.forEach(cloudPuff => {
                if (cloudPuff.material && cloudPuff.material.uniforms && cloudPuff.material.uniforms.opacity) {
                    const baseOpacity = this.options.density * (0.5 + Math.random() * 0.5);
                    cloudPuff.material.uniforms.opacity.value = baseOpacity;
                }
            });
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
