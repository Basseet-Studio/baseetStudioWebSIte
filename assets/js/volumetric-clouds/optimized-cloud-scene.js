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
            cloudCount: options.cloudCount || 80, // Increased from 40

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
            // CREATE CLUSTER of deformed spheres for maximum organic variation!
            const clusterGroup = new THREE.Group();
            
            // Random number of puffs per cloud (3-8 for variety)
            const puffCount = 3 + Math.floor(Math.random() * 6);
            
            for (let j = 0; j < puffCount; j++) {
                // SPHERE GEOMETRY - low poly for performance
                const geometry = new THREE.SphereGeometry(0.5, 16, 12);

                // Vary cloud density parameters for each puff
                const material = new THREE.ShaderMaterial({
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                    uniforms: {
                        map: { value: texture },
                        threshold: { value: 0.15 + Math.random() * 0.25 }, // Wide range
                        opacity: { value: this.config.cloudDensity * (0.25 + Math.random() * 0.6) }, // Big variation
                        steps: { value: 35.0 + Math.random() * 30.0 },
                        time: { value: Math.random() * 100 }
                    },
                    side: THREE.BackSide,
                    transparent: true,
                    depthWrite: false,
                    blending: THREE.NormalBlending
                });

                const puff = new THREE.Mesh(geometry, material);

                // EXTREME RANDOM DEFORMATION - each puff unique!
                const scaleX = 2 + Math.random() * 5;  // 2-7
                const scaleY = 1.5 + Math.random() * 4; // 1.5-5.5 (some very flat)
                const scaleZ = 2 + Math.random() * 5;  // 2-7
                
                puff.scale.set(scaleX, scaleY, scaleZ);

                // Random rotation per puff
                puff.rotation.set(
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2
                );

                // Position within cluster - some overlap, some cut off!
                const offsetX = (Math.random() - 0.5) * 3.5; // Wider spread
                const offsetY = (Math.random() - 0.5) * 2.5;
                const offsetZ = (Math.random() - 0.5) * 3.5;
                
                puff.position.set(offsetX, offsetY, offsetZ);

                // Store rotation speed for animation
                puff.userData = {
                    rotationSpeed: {
                        x: (Math.random() - 0.5) * 0.0008,
                        y: (Math.random() - 0.5) * 0.0015,
                        z: (Math.random() - 0.5) * 0.0008
                    }
                };

                clusterGroup.add(puff);
            }

            // Position the entire cluster in 3D space
            const xPos = (Math.random() - 0.5) * 35; // Wide spread
            const yPos = -30 + Math.random() * 60;   // Vertical range
            const zPos = -5 + Math.random() * 15;    // Depth layers

            clusterGroup.position.set(xPos, yPos, zPos);
            
            // Random rotation for entire cluster - more chaos!
            clusterGroup.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            // Store movement data
            clusterGroup.userData = {
                originalY: yPos,
                speed: 0.3 + Math.random() * 0.8,
                zDepth: zPos,
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.0003,
                    y: (Math.random() - 0.5) * 0.0005,
                    z: (Math.random() - 0.5) * 0.0003
                }
            };

            this.cloudGroup.add(clusterGroup);
        }


        this.scene.add(this.cloudGroup);

        // Create background cloud layer (larger, further back)
        this.createBackgroundClouds(texture);
    }

    /**
     * Create background layer of large cloud clusters
     */
    createBackgroundClouds(texture) {
        const bgClusterCount = 20; // Background cluster count

        for (let i = 0; i < bgClusterCount; i++) {
            const clusterGroup = new THREE.Group();
            
            // Fewer, larger puffs for background (2-5)
            const puffCount = 2 + Math.floor(Math.random() * 4);
            
            for (let j = 0; j < puffCount; j++) {
                const geometry = new THREE.SphereGeometry(0.5, 16, 12);

                const material = new THREE.ShaderMaterial({
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                    uniforms: {
                        map: { value: texture },
                        threshold: { value: 0.2 + Math.random() * 0.25 },
                        opacity: { value: this.config.cloudDensity * (0.15 + Math.random() * 0.3) }, // Very transparent
                        steps: { value: 25.0 }, // Lower quality for performance
                        time: { value: Math.random() * 100 }
                    },
                    side: THREE.BackSide,
                    transparent: true,
                    depthWrite: false,
                    blending: THREE.NormalBlending
                });

                const puff = new THREE.Mesh(geometry, material);

                // HUGE deformations for background
                const scaleX = 8 + Math.random() * 10;   // 8-18
                const scaleY = 5 + Math.random() * 6;    // 5-11 (flatter)
                const scaleZ = 8 + Math.random() * 10;   // 8-18
                
                puff.scale.set(scaleX, scaleY, scaleZ);

                // Random rotation
                puff.rotation.set(
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2
                );

                // Position within cluster - lots of overlap
                puff.position.set(
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 5
                );

                puff.userData = {
                    rotationSpeed: {
                        x: (Math.random() - 0.5) * 0.0002,
                        y: (Math.random() - 0.5) * 0.0004,
                        z: 0
                    }
                };

                clusterGroup.add(puff);
            }

            // Position far back
            const xPos = (Math.random() - 0.5) * 90;  // Very wide
            const yPos = -20 + Math.random() * 50;
            const zPos = -15 - Math.random() * 12;    // Behind everything

            clusterGroup.position.set(xPos, yPos, zPos);
            
            clusterGroup.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            clusterGroup.userData = {
                originalY: yPos,
                speed: 0.1 + Math.random() * 0.15, // Slower
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.0001,
                    y: (Math.random() - 0.5) * 0.0003,
                    z: 0
                }
            };

            this.cloudGroup.add(clusterGroup);
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

        // NOTE: The transition to the hero section is NOT handled here.
        // It is handled in layouts/home.html which watches window.cloudScene.isComplete().
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
            this.cloudGroup.children.forEach((cluster, index) => {
                // Each cloud is now a cluster group containing multiple puffs
                
                // 1. Vertical Movement (Falling Effect) - move entire cluster
                const scrollSpeed = 25;
                const baseMovement = time * cluster.userData.speed * 0.5;

                let newY = cluster.userData.originalY + (this.scrollProgress * scrollSpeed) + baseMovement;

                // Loop logic
                const loopHeight = 60;
                const resetThreshold = 30;

                if (newY > resetThreshold) {
                    newY = -30 + (newY % loopHeight);
                }

                cluster.position.y = newY;

                // 2. Rotation of entire cluster
                if (cluster.userData.rotationSpeed) {
                    cluster.rotation.x += cluster.userData.rotationSpeed.x;
                    cluster.rotation.y += cluster.userData.rotationSpeed.y;
                    cluster.rotation.z += cluster.userData.rotationSpeed.z;
                }

                // 3. Update each puff in the cluster
                cluster.children.forEach((puff, puffIndex) => {
                    // Individual puff rotation
                    if (puff.userData.rotationSpeed) {
                        puff.rotation.x += puff.userData.rotationSpeed.x;
                        puff.rotation.y += puff.userData.rotationSpeed.y;
                        puff.rotation.z += puff.userData.rotationSpeed.z;
                    }

                    // Update shader time
                    if (puff.material && puff.material.uniforms && puff.material.uniforms.time) {
                        puff.material.uniforms.time.value = time + index + puffIndex * 0.1;
                    }

                    // 4. Opacity fade for smooth appearance/disappearance
                    if (puff.material && puff.material.uniforms && puff.material.uniforms.opacity) {
                        const baseOpacity = this.config.cloudDensity * (0.3 + Math.random() * 0.2);
                        let fade = 1.0;

                        // Distance fade (close to camera)
                        const worldPos = new THREE.Vector3();
                        puff.getWorldPosition(worldPos);
                        const distToCam = worldPos.distanceTo(this.camera.position);
                        if (distToCam < 3.0) fade *= smoothstep(0.0, 3.0, distToCam);

                        // Edge fade (top/bottom of scene)
                        const distToTop = resetThreshold - cluster.position.y;
                        if (distToTop < 10.0) fade *= smoothstep(0.0, 10.0, distToTop);

                        const distToBottom = cluster.position.y - (-30);
                        if (distToBottom < 10.0) fade *= smoothstep(0.0, 10.0, distToBottom);

                        puff.material.uniforms.opacity.value = baseOpacity * fade;
                    }
                });
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
