/**
 * Optimized Cloud Scene - Single Volume Approach
 * 
 * Instead of many small spheres ("blobs"), we use one massive BoxGeometry
 * that the camera flies through. This creates a continuous cloud field.
 */

import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { generate3DTexture } from './texture-generator.js';
import { vertexShader, fragmentShader } from './shaders.js';

export class OptimizedCloudScene {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas with id "${canvasId}" not found`);
            return;
        }

        this.config = {
            cloudDensity: options.cloudDensity || 0.4,
            scrollDistance: options.scrollDistance || 800,
            textContent: options.textContent || 'BASEET STUDIO',
            fontSize: options.fontSize || 1.5,
            ...options
        };

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cloudMesh = null;
        this.textMesh = null;
        
        this.scrollProgress = 0;
        this.isAnimating = true;
        
        this.init();
    }

    async init() {
        // 1. Scene Setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0f3460, 0.02);

        // 2. Camera Setup
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        // Start position: In front of the text
        this.camera.position.set(0, 0, 20);

        // 3. Renderer Setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x0f3460, 0);

        // 4. Lighting (Standard lights for Text, Shader handles clouds)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0x496BC1, 1.5);
        dirLight.position.set(5, 10, 10);
        this.scene.add(dirLight);

        // 5. Create Single Volumetric Cloud Box
        this.createCloudVolume();

        // 6. Create Text
        await this.create3DText();

        // 7. Events
        window.addEventListener('resize', this.onResize.bind(this));
        window.addEventListener('scroll', this.onScroll.bind(this));
        
        this.animate();
    }

    createCloudVolume() {
        // A single HUGE box that covers the entire scroll path
        // Width: 60, Height: 40, Depth: 120
        const geometry = new THREE.BoxGeometry(60, 40, 120);
        
        // Generate texture
        const texture = generate3DTexture(128);

        const material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                map: { value: texture },
                threshold: { value: 0.45 }, // Higher threshold = fewer clouds (more empty space)
                opacity: { value: this.config.cloudDensity },
                steps: { value: 64.0 }, // High quality steps
                time: { value: 0 },
                lightDirection: { value: new THREE.Vector3(0.5, 1.0, 0.5).normalize() },
                cloudColor: { value: new THREE.Vector3(1.0, 1.0, 1.0) }
            },
            side: THREE.BackSide, // Render on inside of box
            transparent: true,
            depthWrite: false,
            blending: THREE.NormalBlending
        });

        this.cloudMesh = new THREE.Mesh(geometry, material);
        // Position box so it covers Z=20 to Z=-100
        // Center at Z = -40
        this.cloudMesh.position.set(0, 0, -40);
        this.scene.add(this.cloudMesh);
    }

    async create3DText() {
        const loader = new FontLoader();
        try {
            const font = await new Promise((resolve, reject) => 
                loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', resolve, null, reject)
            );

            const geometry = new TextGeometry(this.config.textContent, {
                font: font,
                size: this.config.fontSize,
                height: 0.2,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelSegments: 5
            });

            geometry.computeBoundingBox();
            const centerOffset = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
            geometry.translate(centerOffset, -this.config.fontSize/2, 0);

            const material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                metalness: 0.3,
                roughness: 0.4,
                emissive: 0x496BC1,
                emissiveIntensity: 0.2
            });

            this.textMesh = new THREE.Mesh(geometry, material);
            this.textMesh.position.set(0, 0, 0); // Text at Z=0
            this.scene.add(this.textMesh);

        } catch (e) {
            console.error("Font load failed", e);
        }
    }

    onScroll() {
        const scrollY = window.scrollY || window.pageYOffset;
        this.scrollProgress = Math.min(scrollY / this.config.scrollDistance, 1);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        if (!this.isAnimating) return;
        requestAnimationFrame(this.animate.bind(this));

        const time = Date.now() * 0.001;

        // Update Shader Time
        if (this.cloudMesh) {
            this.cloudMesh.material.uniforms.time.value = time;
        }

        // Camera Movement Logic (The "Scroll Through" Effect)
        // Start at Z=20
        // End at Z=-20 (Pass through text at Z=0)
        const startZ = 20;
        const endZ = -20;
        
        const currentZ = startZ + (endZ - startZ) * this.scrollProgress;
        this.camera.position.z = currentZ;
        
        // Slight Y movement for "floating" feel
        this.camera.position.y = Math.sin(time * 0.5) * 0.5;

        // Text Animation
        if (this.textMesh) {
            // Text floats slightly
            this.textMesh.position.y = Math.sin(time) * 0.2;
            
            // Text fades out as we get too close? Or stays?
            // Let's keep it solid.
        }

        this.renderer.render(this.scene, this.camera);
    }
    
    isComplete() {
        return this.scrollProgress >= 1;
    }
    
    destroy() {
        this.isAnimating = false;
        // Cleanup...
    }
}
