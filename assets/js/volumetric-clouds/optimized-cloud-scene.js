/**
 * Optimized 3D Cloud Scene with Text
 * Features:
 * - 3D text that stays centered in the scene
 * - Clouds that move around the text on scroll
 * - Smooth camera movement through z-space
 * - Proper transition to hero section
 */

import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { generate3DTexture } from './texture-generator.js';
import { vertexShader, fragmentShader } from './shaders.js';

class OptimizedCloudScene {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas with id "${canvasId}" not found`);
            return;
        }

        // Configuration
        this.config = {
            cloudCount: options.cloudCount || 20,
            cloudDensity: options.cloudDensity || 0.6,
            scrollDistance: options.scrollDistance || 600, // Pixels to scroll through clouds
            textContent: options.textContent || 'BASEET STUDIO',
            fontSize: options.fontSize || 1.2,
            ...options
        };

        // Scene components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cloudGroup = null;
        this.textMesh = null;
        this.fontLoader = null;

        // Animation state
        this.scrollProgress = 0; // 0 to 1
        this.isAnimating = false;
        this.animationId = null;

        // Bind methods
        this.animate = this.animate.bind(this);
        this.onResize = this.onResize.bind(this);
        this.onScroll = this.onScroll.bind(this);

        // Initialize
        this.init();
    }

    /**
     * Initialize the Three.js scene
     */
    async init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0f3460, 0.15); // Atmospheric fog

        // Create camera - start far back
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.camera.position.set(0, 0, 15); // Start 15 units back

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x0f3460, 0); // Transparent background

        // Add ambient light for text visibility
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        // Add directional light for depth
        const directionalLight = new THREE.DirectionalLight(0x496BC1, 1.5);
        directionalLight.position.set(5, 5, 10);
        this.scene.add(directionalLight);

        // Create cloud group
        this.createClouds();

        // Create 3D text
        await this.create3DText();

        // Event listeners
        window.addEventListener('resize', this.onResize);
        window.addEventListener('scroll', this.onScroll, { passive: true });

        // Start animation
        this.isAnimating = true;
        this.animate();
    }

    /**
     * Create volumetric clouds scattered in 3D space
     */
    createClouds() {
        this.cloudGroup = new THREE.Group();

        // Generate 3D noise texture
        const texture = generate3DTexture(128);

        for (let i = 0; i < this.config.cloudCount; i++) {
            // Create varied cloud shapes
            const size = 0.8 + Math.random() * 1.2;
            const geometry = new THREE.SphereGeometry(size, 16, 16);

            // Distort geometry for organic shapes
            const positions = geometry.attributes.position;
            for (let j = 0; j < positions.count; j++) {
                const x = positions.getX(j);
                const y = positions.getY(j);
                const z = positions.getZ(j);
                
                const noise = Math.random() * 0.2;
                positions.setXYZ(
                    j,
                    x * (1 + noise),
                    y * (1 + noise * 1.3),
                    z * (1 + noise)
                );
            }
            geometry.attributes.position.needsUpdate = true;
            geometry.computeVertexNormals();

            // Create cloud material
            const material = new THREE.ShaderMaterial({
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                uniforms: {
                    map: { value: texture },
                    threshold: { value: 0.2 + Math.random() * 0.15 },
                    opacity: { value: this.config.cloudDensity * (0.4 + Math.random() * 0.6) },
                    steps: { value: 60.0 + Math.random() * 40.0 },
                    time: { value: Math.random() * 100 }
                },
                side: THREE.BackSide,
                transparent: true,
                depthWrite: false
            });

            const cloud = new THREE.Mesh(geometry, material);

            // Position clouds in a cylinder around the camera path
            // Spread them along the z-axis from -5 to 20
            const angle = (i / this.config.cloudCount) * Math.PI * 4; // Multiple spirals
            const radius = 4 + Math.random() * 6; // 4-10 units from center
            const zPos = -5 + (i / this.config.cloudCount) * 25; // Spread along path

            cloud.position.x = Math.cos(angle) * radius;
            cloud.position.y = (Math.random() - 0.5) * 8; // -4 to 4 vertically
            cloud.position.z = zPos + (Math.random() - 0.5) * 3; // Some z variation

            // Random rotation
            cloud.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            // Store original position and rotation speed
            cloud.userData.originalPosition = cloud.position.clone();
            cloud.userData.originalRotation = cloud.rotation.clone();
            cloud.userData.rotationSpeed = {
                x: (Math.random() - 0.5) * 0.001,
                y: (Math.random() - 0.5) * 0.002,
                z: (Math.random() - 0.5) * 0.001
            };

            this.cloudGroup.add(cloud);
        }

        this.scene.add(this.cloudGroup);
    }

    /**
     * Create 3D text using TextGeometry
     * Falls back to simple mesh text if font loading fails
     */
    async create3DText() {
        // Try to load font from CDN
        const fontLoader = new FontLoader();
        
        try {
            const font = await new Promise((resolve, reject) => {
                fontLoader.load(
                    'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',
                    resolve,
                    undefined,
                    reject
                );
            });

            // Create text geometry
            const textGeometry = new TextGeometry(this.config.textContent, {
                font: font,
                size: this.config.fontSize,
                height: 0.3,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.05,
                bevelSize: 0.04,
                bevelOffset: 0,
                bevelSegments: 5
            });

            // Center the geometry
            textGeometry.computeBoundingBox();
            const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
            textGeometry.translate(-textWidth / 2, -this.config.fontSize / 2, 0);

            // Create gradient material for text
            const textMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                metalness: 0.3,
                roughness: 0.4,
                emissive: 0x496BC1,
                emissiveIntensity: 0.2
            });

            this.textMesh = new THREE.Mesh(textGeometry, textMaterial);
            this.textMesh.position.z = 5; // Position text at z=5 (camera starts at 15)
            
            // Add subtle animation to text
            this.textMesh.userData.floatSpeed = 0.0005;
            this.textMesh.userData.floatAmount = 0.1;

            this.scene.add(this.textMesh);
            
            console.log('3D text created successfully');
        } catch (error) {
            console.warn('Failed to load font, using fallback:', error);
            this.createFallbackText();
        }
    }

    /**
     * Create fallback text if font loading fails
     */
    createFallbackText() {
        // Create a simple plane with text texture as fallback
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 2048;
        canvas.height = 512;

        // Draw text on canvas
        context.fillStyle = '#ffffff';
        context.font = 'bold 160px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(this.config.textContent, canvas.width / 2, canvas.height / 2);

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        
        // Create material
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
        });

        // Create geometry
        const geometry = new THREE.PlaneGeometry(8, 2);
        
        this.textMesh = new THREE.Mesh(geometry, material);
        this.textMesh.position.z = 5;
        
        this.scene.add(this.textMesh);
        
        console.log('Fallback text created');
    }

    /**
     * Handle scroll events
     */
    onScroll() {
        const scrollY = window.scrollY || window.pageYOffset;
        
        // Calculate scroll progress (0 to 1)
        this.scrollProgress = Math.min(scrollY / this.config.scrollDistance, 1);
    }

    /**
     * Animation loop
     */
    animate() {
        if (!this.isAnimating) return;

        this.animationId = requestAnimationFrame(this.animate);

        const time = Date.now() * 0.001;

        // Update camera position based on scroll
        // Move camera forward through the clouds
        const cameraZ = 15 - (this.scrollProgress * 12); // Move from z=15 to z=3
        this.camera.position.z = cameraZ;

        // Subtle camera sway for organic feel
        this.camera.position.x = Math.sin(time * 0.2) * 0.2;
        this.camera.position.y = Math.cos(time * 0.15) * 0.15;
        this.camera.lookAt(0, 0, 5); // Always look at text position

        // Update clouds
        if (this.cloudGroup) {
            this.cloudGroup.children.forEach((cloud, index) => {
                // Rotate clouds gently
                if (cloud.userData.rotationSpeed) {
                    cloud.rotation.x += cloud.userData.rotationSpeed.x;
                    cloud.rotation.y += cloud.userData.rotationSpeed.y;
                    cloud.rotation.z += cloud.userData.rotationSpeed.z;
                }

                // Update time uniform for animation
                if (cloud.material && cloud.material.uniforms && cloud.material.uniforms.time) {
                    cloud.material.uniforms.time.value = time + index;
                }

                // Fade out clouds as camera passes through them
                const distanceToCamera = Math.abs(cloud.position.z - cameraZ);
                const fadeDistance = 3;
                const fadeFactor = Math.min(distanceToCamera / fadeDistance, 1);
                
                if (cloud.material && cloud.material.uniforms && cloud.material.uniforms.opacity) {
                    const baseOpacity = this.config.cloudDensity * (0.4 + Math.random() * 0.6);
                    cloud.material.uniforms.opacity.value = baseOpacity * fadeFactor * (1 - this.scrollProgress * 0.5);
                }
            });
        }

        // Animate text - subtle float and glow
        if (this.textMesh) {
            this.textMesh.position.y = Math.sin(time * this.textMesh.userData.floatSpeed * 1000) * this.textMesh.userData.floatAmount;
            
            // Increase glow as camera approaches
            if (this.textMesh.material.emissiveIntensity !== undefined) {
                this.textMesh.material.emissiveIntensity = 0.2 + this.scrollProgress * 0.5;
            }

            // Subtle rotation
            this.textMesh.rotation.y = Math.sin(time * 0.1) * 0.05;
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Handle window resize
     */
    onResize() {
        if (!this.camera || !this.renderer) return;

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Reset animation to initial state
     */
    reset() {
        this.scrollProgress = 0;
        this.camera.position.set(0, 0, 15);
        
        // Reset clouds
        if (this.cloudGroup) {
            this.cloudGroup.children.forEach(cloud => {
                cloud.rotation.copy(cloud.userData.originalRotation);
                if (cloud.material && cloud.material.uniforms && cloud.material.uniforms.opacity) {
                    const baseOpacity = this.config.cloudDensity * (0.4 + Math.random() * 0.6);
                    cloud.material.uniforms.opacity.value = baseOpacity;
                }
            });
        }

        // Reset text
        if (this.textMesh) {
            this.textMesh.position.y = 0;
            if (this.textMesh.material.emissiveIntensity !== undefined) {
                this.textMesh.material.emissiveIntensity = 0.2;
            }
        }
    }

    /**
     * Get completion status (true when scroll is complete)
     */
    isComplete() {
        return this.scrollProgress >= 1;
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.isAnimating = false;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        window.removeEventListener('resize', this.onResize);
        window.removeEventListener('scroll', this.onScroll);

        // Dispose of Three.js resources
        if (this.cloudGroup) {
            this.cloudGroup.children.forEach(cloud => {
                if (cloud.geometry) cloud.geometry.dispose();
                if (cloud.material) {
                    if (cloud.material.uniforms && cloud.material.uniforms.map && cloud.material.uniforms.map.value) {
                        cloud.material.uniforms.map.value.dispose();
                    }
                    cloud.material.dispose();
                }
            });
        }

        if (this.textMesh) {
            if (this.textMesh.geometry) this.textMesh.geometry.dispose();
            if (this.textMesh.material) {
                if (this.textMesh.material.map) this.textMesh.material.map.dispose();
                this.textMesh.material.dispose();
            }
        }

        if (this.renderer) {
            this.renderer.dispose();
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
    }
}

// Export for ES module usage
export { OptimizedCloudScene };
