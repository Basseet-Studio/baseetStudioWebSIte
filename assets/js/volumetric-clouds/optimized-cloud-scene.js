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
            cloudCount: options.cloudCount || 80, // Reduced count, higher quality per cloud
            cloudDensity: options.cloudDensity || 0.5,
            scrollDistance: options.scrollDistance || 600, // Pixels to scroll through clouds
            textContent: options.textContent || 'BASEET STUDIO',
            fontSize: options.fontSize || 1.2,
            cloudColor: new THREE.Vector3(1.0, 1.0, 1.0),
            lightDirection: new THREE.Vector3(0.5, 1.0, 0.5).normalize(),
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
        // Darker blue fog for better contrast with white clouds
        this.scene.fog = new THREE.FogExp2(0x0f3460, 0.02); 

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
        directionalLight.position.copy(this.config.lightDirection).multiplyScalar(10);
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

        // Generate 3D noise texture (Perlin-Worley)
        const texture = generate3DTexture(128);

        for (let i = 0; i < this.config.cloudCount; i++) {
            // CREATE CLUSTER of deformed spheres for maximum organic variation!
            const clusterGroup = new THREE.Group();
            
            // Random number of puffs per cloud - SMALLER, MORE VARIED CLUSTERS (2-5)
            const puffCount = 2 + Math.floor(Math.random() * 4);
            
            for (let j = 0; j < puffCount; j++) {
                // SPHERE GEOMETRY - low poly for performance
                const geometry = new THREE.SphereGeometry(0.5, 16, 12);

                // Vary cloud density parameters for each puff
                const material = new THREE.ShaderMaterial({
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                    uniforms: {
                        map: { value: texture },
                        threshold: { value: 0.25 + Math.random() * 0.3 }, // Higher threshold for Perlin-Worley
                        opacity: { value: this.config.cloudDensity * (0.5 + Math.random() * 0.5) },
                        steps: { value: 32.0 }, // Fixed steps for consistency, jitter handles the rest
                        time: { value: Math.random() * 100 },
                        lightDirection: { value: this.config.lightDirection },
                        cloudColor: { value: this.config.cloudColor }
                    },
                    side: THREE.BackSide,
                    transparent: true,
                    depthWrite: false,
                    blending: THREE.NormalBlending
                });

                const puff = new THREE.Mesh(geometry, material);

                // EXTREME RANDOM DEFORMATION - each puff unique!
                const isDeformed = Math.random() > 0.6;
                
                let scaleX, scaleY, scaleZ;
                
                if (isDeformed) {
                    // Weird shapes
                    scaleX = 2 + Math.random() * 4;
                    scaleY = 1 + Math.random() * 2;
                    scaleZ = 2 + Math.random() * 4;
                } else {
                    // Normal blobby shapes
                    scaleX = 2 + Math.random() * 3;
                    scaleY = 2 + Math.random() * 3;
                    scaleZ = 2 + Math.random() * 3;
                }
                
                puff.scale.set(scaleX, scaleY, scaleZ);

                // Random rotation per puff
                puff.rotation.set(
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2
                );

                // Position within cluster
                const offsetX = (Math.random() - 0.5) * 3;
                const offsetY = (Math.random() - 0.5) * 2;
                const offsetZ = (Math.random() - 0.5) * 3;
                
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
            // Spread them out but keep some near the center (where text is)
            const xPos = (Math.random() - 0.5) * 40;
            const yPos = -40 + Math.random() * 80;   // Vertical range
            const zPos = -20 + Math.random() * 30;    // Depth layers (-20 to 10)

            clusterGroup.position.set(xPos, yPos, zPos);
            
            // Random rotation for entire cluster
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
        const bgClusterCount = 12;

        for (let i = 0; i < bgClusterCount; i++) {
            const clusterGroup = new THREE.Group();
            
            const puffCount = 2 + Math.floor(Math.random() * 3);
            
            for (let j = 0; j < puffCount; j++) {
                const geometry = new THREE.SphereGeometry(0.5, 16, 12);

                const material = new THREE.ShaderMaterial({
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                    uniforms: {
                        map: { value: texture },
                        threshold: { value: 0.3 + Math.random() * 0.2 },
                        opacity: { value: this.config.cloudDensity * 0.4 }, // More transparent
                        steps: { value: 24.0 }, // Lower quality for background
                        time: { value: Math.random() * 100 },
                        lightDirection: { value: this.config.lightDirection },
                        cloudColor: { value: this.config.cloudColor }
                    },
                    side: THREE.BackSide,
                    transparent: true,
                    depthWrite: false,
                    blending: THREE.NormalBlending
                });

                const puff = new THREE.Mesh(geometry, material);

                // HUGE deformations for background
                const scaleX = 30 + Math.random() * 30;
                const scaleY = 15 + Math.random() * 15;
                const scaleZ = 30 + Math.random() * 30;
                
                puff.scale.set(scaleX, scaleY, scaleZ);

                puff.rotation.set(
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2
                );

                puff.position.set(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 10
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

            // Position MUCH FURTHER BACK
            const xPos = (Math.random() - 0.5) * 200;
            const yPos = -50 + Math.random() * 100;
            const zPos = -80 - Math.random() * 100;

            clusterGroup.position.set(xPos, yPos, zPos);
            
            clusterGroup.userData = {
                originalY: yPos,
                speed: 0.02 + Math.random() * 0.05,
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
        // console.log(`Cloud Scroll Progress: ${Math.round(this.scrollProgress * 100)}%`);

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
