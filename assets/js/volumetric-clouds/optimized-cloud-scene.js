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

// Helper function for smooth interpolation
function smoothstep(min, max, value) {
    var x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
}

class OptimizedCloudScene {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas with id "${canvasId}" not found`);
            return;
        }

        // Configuration
        this.config = {
            cloudCount: options.cloudCount || 40,

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
            // Create a cluster of spheres for a "cloudy" shape
            const clusterGroup = new THREE.Group();
            const puffs = 3 + Math.floor(Math.random() * 3); // 3-5 puffs per cloud

            for (let j = 0; j < puffs; j++) {
                const geometry = new THREE.SphereGeometry(1, 32, 32);

                // Create cloud material
                const material = new THREE.ShaderMaterial({
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                    uniforms: {
                        map: { value: texture },
                        threshold: { value: 0.25 + Math.random() * 0.1 },
                        opacity: { value: this.config.cloudDensity * (0.3 + Math.random() * 0.5) },
                        steps: { value: 40.0 + Math.random() * 20.0 },
                        time: { value: Math.random() * 100 }
                    },
                    side: THREE.BackSide,
                    transparent: true,
                    depthWrite: false,
                    blending: THREE.NormalBlending
                });

                const puff = new THREE.Mesh(geometry, material);

                // Randomize puff size and offset within cluster
                const pScale = 1.5 + Math.random() * 1.5;
                puff.scale.set(pScale, pScale * 0.8, pScale);

                puff.position.set(
                    (Math.random() - 0.5) * 2.0,
                    (Math.random() - 0.5) * 1.0,
                    (Math.random() - 0.5) * 1.5
                );

                // Store rotation speed on individual puffs for internal turbulence
                puff.userData = {
                    rotationSpeed: {
                        x: (Math.random() - 0.5) * 0.001,
                        y: (Math.random() - 0.5) * 0.002,
                        z: (Math.random() - 0.5) * 0.001
                    }
                };

                clusterGroup.add(puff);
            }

            // Position the entire cluster
            const xPos = (Math.random() - 0.5) * 15;
            const yPos = -20 + Math.random() * 40;
            const zPos = (Math.random() * 12) - 2;

            clusterGroup.position.set(xPos, yPos, zPos);

            // Store movement data on the group
            clusterGroup.userData = {
                originalY: yPos,
                speed: 0.5 + Math.random() * 0.8,
                zDepth: zPos
            };

            this.cloudGroup.add(clusterGroup);
        }


        this.scene.add(this.cloudGroup);

        // Create background cloud layer (larger, further back)
        this.createBackgroundClouds(texture);
    }

    /**
     * Create background layer of large clouds
     */
    createBackgroundClouds(texture) {
        const bgCount = 20; // Increased background clouds


        for (let i = 0; i < bgCount; i++) {
            const geometry = new THREE.SphereGeometry(1, 24, 24); // Lower poly for background

            const material = new THREE.ShaderMaterial({
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                uniforms: {
                    map: { value: texture },
                    threshold: { value: 0.3 + Math.random() * 0.1 },
                    opacity: { value: this.config.cloudDensity * 0.4 }, // More transparent
                    steps: { value: 30.0 }, // Lower quality for background
                    time: { value: Math.random() * 100 }
                },
                side: THREE.BackSide,
                transparent: true,
                depthWrite: false,
                blending: THREE.NormalBlending
            });

            const cloud = new THREE.Mesh(geometry, material);

            // Make them huge
            const scale = 8 + Math.random() * 5;
            cloud.scale.set(scale, scale * 0.6, scale);

            // Position far back
            const xPos = (Math.random() - 0.5) * 40;
            const yPos = -10 + Math.random() * 30;
            const zPos = -15 - Math.random() * 10; // Behind everything

            cloud.position.set(xPos, yPos, zPos);

            cloud.userData = {
                originalY: yPos,
                speed: 0.2, // Slower movement
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.0002,
                    y: (Math.random() - 0.5) * 0.0005,
                    z: 0
                }
            };

            this.cloudGroup.add(cloud);
        }
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
        console.log(`Cloud Scroll Progress: ${Math.round(this.scrollProgress * 100)}%`);

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
            this.cloudGroup.children.forEach((item, index) => {
                // Handle both single meshes (background) and clusters (foreground)
                const isCluster = item.type === 'Group';

                // 1. Vertical Movement (Falling Effect) - Applied to the parent object (cluster or mesh)
                const scrollSpeed = 25;
                const baseMovement = time * item.userData.speed * 0.5;

                let newY = item.userData.originalY + (this.scrollProgress * scrollSpeed) + baseMovement;

                if (newY > 20) {
                    newY = -20 + (newY % 40);
                }

                item.position.y = newY;

                // Helper to update a single cloud mesh
                const updateCloudMesh = (mesh, idx) => {
                    // Rotation
                    if (mesh.userData.rotationSpeed) {
                        mesh.rotation.x += mesh.userData.rotationSpeed.x;
                        mesh.rotation.y += mesh.userData.rotationSpeed.y;
                        mesh.rotation.z += mesh.userData.rotationSpeed.z;
                    }

                    // Shader Time
                    if (mesh.material.uniforms.time) {
                        mesh.material.uniforms.time.value = time + idx;
                    }

                    // Opacity Fade
                    // Calculate distance from camera to the mesh's world position
                    const worldPos = new THREE.Vector3();
                    mesh.getWorldPosition(worldPos);
                    const distToCam = worldPos.distanceTo(this.camera.position);

                    if (mesh.material.uniforms.opacity) {
                        const baseOpacity = this.config.cloudDensity * (0.3 + Math.random() * 0.1);
                        let fade = 1.0;
                        if (distToCam < 2.0) fade = smoothstep(0.0, 2.0, distToCam);
                        mesh.material.uniforms.opacity.value = baseOpacity * fade;
                    }
                };

                if (isCluster) {
                    // Update all puffs in the cluster
                    item.children.forEach((puff, pIdx) => {
                        updateCloudMesh(puff, index + pIdx);
                    });
                } else {
                    // It's a single mesh (background cloud)
                    updateCloudMesh(item, index);
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
