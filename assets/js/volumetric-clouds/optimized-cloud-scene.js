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
            cloudCount: options.cloudCount || 25,
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
        this.scene.fog = new THREE.FogExp2(0x0f3460, 0.05); // Lighter fog for depth

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        // Camera stays relatively static in Z, looking slightly down
        this.camera.position.set(0, 0, 12);

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
        directionalLight.position.set(5, 10, 10);
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
            // Use BoxGeometry to match raymarching volume
            // Scale it to be slightly flattened
            const width = 3 + Math.random() * 2;
            const height = 2 + Math.random() * 1.5;
            const depth = 2 + Math.random() * 2;
            const geometry = new THREE.BoxGeometry(1, 1, 1);

            // Create cloud material
            const material = new THREE.ShaderMaterial({
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                uniforms: {
                    map: { value: texture },
                    threshold: { value: 0.25 + Math.random() * 0.1 },
                    opacity: { value: this.config.cloudDensity * (0.3 + Math.random() * 0.5) },
                    steps: { value: 50.0 + Math.random() * 20.0 },
                    time: { value: Math.random() * 100 }
                },
                side: THREE.BackSide,
                transparent: true,
                depthWrite: false,
                blending: THREE.NormalBlending
            });

            const cloud = new THREE.Mesh(geometry, material);
            cloud.scale.set(width, height, depth);

            // Position clouds for falling effect
            // Spread widely on Y axis (vertical)
            // Z axis: some behind text (Z<5), some in front (Z>5)

            const xPos = (Math.random() - 0.5) * 15;

            // Initial Y position: spread from far below to far above
            // We will move them UP as we scroll
            const yPos = -20 + Math.random() * 40;

            // Z position: Layered depth
            // Text is at Z=5. Camera is at Z=12.
            // Clouds should be between Z=0 and Z=10 mostly
            const zPos = (Math.random() * 12) - 2;

            cloud.position.set(xPos, yPos, zPos);

            // Store original position and speed
            cloud.userData = {
                originalY: yPos,
                speed: 0.5 + Math.random() * 0.8, // Vertical speed
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.0005,
                    y: (Math.random() - 0.5) * 0.001,
                    z: (Math.random() - 0.5) * 0.0005
                },
                zDepth: zPos
            };

            this.cloudGroup.add(cloud);
        }

        this.scene.add(this.cloudGroup);
    }

    /**
     * Create 3D text using TextGeometry
     */
    async create3DText() {
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

            const textGeometry = new TextGeometry(this.config.textContent, {
                font: font,
                size: this.config.fontSize,
                height: 0.2,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelOffset: 0,
                bevelSegments: 5
            });

            textGeometry.computeBoundingBox();
            const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
            textGeometry.translate(-textWidth / 2, -this.config.fontSize / 2, 0);

            const textMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                metalness: 0.3,
                roughness: 0.4,
                emissive: 0x496BC1,
                emissiveIntensity: 0.2
            });

            this.textMesh = new THREE.Mesh(textGeometry, textMaterial);
            this.textMesh.position.set(0, 0, 5); // Fixed at Z=5

            this.textMesh.userData = {
                floatSpeed: 0.0005,
                floatAmount: 0.1,
                initialZ: 5
            };

            this.scene.add(this.textMesh);
        } catch (error) {
            console.warn('Failed to load font, using fallback:', error);
            this.createFallbackText();
        }
    }

    /**
     * Create fallback text if font loading fails
     */
    createFallbackText() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 2048;
        canvas.height = 512;

        context.fillStyle = '#ffffff';
        context.font = 'bold 160px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(this.config.textContent, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
        });

        const geometry = new THREE.PlaneGeometry(8, 2);
        this.textMesh = new THREE.Mesh(geometry, material);
        this.textMesh.position.set(0, 0, 5);
        this.scene.add(this.textMesh);
    }

    /**
     * Handle scroll events
     */
    onScroll() {
        const scrollY = window.scrollY || window.pageYOffset;
        this.scrollProgress = Math.min(scrollY / this.config.scrollDistance, 1);
    }

    /**
     * Animation loop
     */
    animate() {
        if (!this.isAnimating) return;

        this.animationId = requestAnimationFrame(this.animate);

        const time = Date.now() * 0.001;

        // Camera Movement
        // Camera moves slightly down to enhance falling sensation
        // But mostly static to let clouds do the work
        this.camera.position.y = -this.scrollProgress * 2;
        this.camera.lookAt(0, this.camera.position.y, 5);

        // Update clouds - The Core "Falling" Effect
        if (this.cloudGroup) {
            this.cloudGroup.children.forEach((cloud, index) => {
                // 1. Vertical Movement (Falling Effect)
                // Clouds move UP (positive Y) as scroll increases
                // Add base speed + scroll influence
                const scrollSpeed = 25; // How fast clouds rush up
                const baseMovement = time * cloud.userData.speed * 0.5; // Idle drift

                let newY = cloud.userData.originalY + (this.scrollProgress * scrollSpeed) + baseMovement;

                // Loop clouds: if they go too high, wrap them to bottom
                // This creates infinite falling illusion if needed, though we have a finite scroll
                if (newY > 20) {
                    newY = -20 + (newY % 40);
                }

                cloud.position.y = newY;

                // 2. Rotation
                if (cloud.userData.rotationSpeed) {
                    cloud.rotation.x += cloud.userData.rotationSpeed.x;
                    cloud.rotation.y += cloud.userData.rotationSpeed.y;
                    cloud.rotation.z += cloud.userData.rotationSpeed.z;
                }

                // 3. Shader Time Update
                if (cloud.material.uniforms.time) {
                    cloud.material.uniforms.time.value = time + index;
                }

                // 4. Opacity/Fade based on proximity to camera
                // Fade out if too close to camera to avoid clipping artifacts
                const distToCam = cloud.position.distanceTo(this.camera.position);
                if (cloud.material.uniforms.opacity) {
                    const baseOpacity = this.config.cloudDensity * (0.3 + Math.random() * 0.1); // reduced flicker
                    let fade = 1.0;
                    if (distToCam < 2.0) fade = smoothstep(0.0, 2.0, distToCam);
                    cloud.material.uniforms.opacity.value = baseOpacity * fade;
                }
            });
        }

        // Animate text
        if (this.textMesh) {
            // Float animation
            this.textMesh.position.y = (Math.sin(time * 1.5) * 0.1) - (this.scrollProgress * 2); // Match camera fall slightly

            // Text Emergence
            // Start slightly transparent/obscured, become clearer
            // Clouds passing in front handle the obscuring naturally

            // Glow increases as we "land"
            if (this.textMesh.material.emissiveIntensity !== undefined) {
                this.textMesh.material.emissiveIntensity = 0.2 + (this.scrollProgress * 0.3);
            }
        }

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
        this.camera.position.set(0, 0, 12);

        // Reset clouds handled by animate loop mostly, but can reset positions if needed
        // For now, just letting them drift is fine as they are procedural
    }

    /**
     * Get completion status
     */
    isComplete() {
        return this.scrollProgress >= 1;
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.isAnimating = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        window.removeEventListener('resize', this.onResize);
        window.removeEventListener('scroll', this.onScroll);

        // Dispose logic...
        if (this.renderer) this.renderer.dispose();
    }
}

// Export for ES module usage
export { OptimizedCloudScene };
