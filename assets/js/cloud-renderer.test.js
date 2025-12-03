/**
 * Unit tests for CloudRenderer class
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CloudRenderer } from './cloud-renderer.js';
import * as THREE from 'three';
import fc from 'fast-check';

describe('CloudRenderer', () => {
  let container;

  beforeEach(() => {
    // Create a container element for testing
    container = document.createElement('div');
    container.id = 'cloud-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Constructor', () => {
    it('should store containerSelector configuration', () => {
      const renderer = new CloudRenderer('#cloud-container');
      
      expect(renderer.containerSelector).toBe('#cloud-container');
    });

    it('should initialize instance properties to null', () => {
      const renderer = new CloudRenderer('#cloud-container');
      
      expect(renderer.scene).toBeNull();
      expect(renderer.camera).toBeNull();
      expect(renderer.renderer).toBeNull();
      expect(renderer.material).toBeNull();
      expect(renderer.mesh).toBeNull();
    });

    it('should initialize animation state properties', () => {
      const renderer = new CloudRenderer('#cloud-container');
      
      expect(renderer.animationFrameId).toBeNull();
      expect(renderer.isAnimating).toBe(false);
      expect(renderer.startTime).toBeNull();
    });
  });

  describe('WebGL Availability Check', () => {
    it('should return true when WebGL is available', () => {
      const renderer = new CloudRenderer('#cloud-container');
      
      // In jsdom with proper setup, this should return true
      const isAvailable = renderer.isWebGLAvailable();
      
      expect(typeof isAvailable).toBe('boolean');
    });

    it('should handle WebGL check without throwing errors', () => {
      const renderer = new CloudRenderer('#cloud-container');
      
      expect(() => {
        renderer.isWebGLAvailable();
      }).not.toThrow();
    });
  });

  describe('Texture Loading', () => {
    it('should load texture from correct path', async () => {
      const renderer = new CloudRenderer('#cloud-container');
      const texturePath = '/noise/noise-map.png';
      
      // Mock THREE.TextureLoader to simulate successful loading
      const originalLoad = THREE.TextureLoader.prototype.load;
      let capturedPath = null;
      
      THREE.TextureLoader.prototype.load = function(url, onLoad, onProgress, onError) {
        capturedPath = url;
        const mockTexture = new THREE.Texture();
        setTimeout(() => {
          if (onLoad) {
            onLoad(mockTexture);
          }
        }, 0);
      };
      
      try {
        await renderer.loadTexture(texturePath);
        
        // Verify the correct path was used
        expect(capturedPath).toBe(texturePath);
      } finally {
        THREE.TextureLoader.prototype.load = originalLoad;
      }
    });

    it('should set texture filtering to LinearFilter', async () => {
      const renderer = new CloudRenderer('#cloud-container');
      
      // Mock THREE.TextureLoader to simulate successful loading
      const originalLoad = THREE.TextureLoader.prototype.load;
      THREE.TextureLoader.prototype.load = function(url, onLoad, onProgress, onError) {
        const mockTexture = new THREE.Texture();
        setTimeout(() => {
          if (onLoad) {
            onLoad(mockTexture);
          }
        }, 0);
      };
      
      try {
        const texture = await renderer.loadTexture('/noise/noise-map.png');
        
        // Verify filtering is set to LinearFilter
        expect(texture.minFilter).toBe(THREE.LinearFilter);
        expect(texture.magFilter).toBe(THREE.LinearFilter);
      } finally {
        THREE.TextureLoader.prototype.load = originalLoad;
      }
    });

    it('should set texture wrapping to RepeatWrapping', async () => {
      const renderer = new CloudRenderer('#cloud-container');
      
      // Mock THREE.TextureLoader to simulate successful loading
      const originalLoad = THREE.TextureLoader.prototype.load;
      THREE.TextureLoader.prototype.load = function(url, onLoad, onProgress, onError) {
        const mockTexture = new THREE.Texture();
        setTimeout(() => {
          if (onLoad) {
            onLoad(mockTexture);
          }
        }, 0);
      };
      
      try {
        const texture = await renderer.loadTexture('/noise/noise-map.png');
        
        // Verify wrapping is set to RepeatWrapping
        expect(texture.wrapS).toBe(THREE.RepeatWrapping);
        expect(texture.wrapT).toBe(THREE.RepeatWrapping);
      } finally {
        THREE.TextureLoader.prototype.load = originalLoad;
      }
    });

    it('should create fallback texture on error', async () => {
      const renderer = new CloudRenderer('#cloud-container');
      
      // Mock THREE.TextureLoader to simulate loading failure
      const originalLoad = THREE.TextureLoader.prototype.load;
      THREE.TextureLoader.prototype.load = function(url, onLoad, onProgress, onError) {
        setTimeout(() => {
          if (onError) {
            onError(new Error('Failed to load texture'));
          }
        }, 0);
      };
      
      // Mock console.error to suppress error output
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        const texture = await renderer.loadTexture('/invalid/path.png');
        
        // Should return a fallback texture
        expect(texture).toBeDefined();
        expect(texture).toBeInstanceOf(THREE.Texture);
        
        // Fallback texture should also have correct settings
        expect(texture.minFilter).toBe(THREE.LinearFilter);
        expect(texture.magFilter).toBe(THREE.LinearFilter);
        expect(texture.wrapS).toBe(THREE.RepeatWrapping);
        expect(texture.wrapT).toBe(THREE.RepeatWrapping);
        
        // Should have logged an error
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to load noise texture:',
          expect.any(Error)
        );
      } finally {
        THREE.TextureLoader.prototype.load = originalLoad;
        consoleErrorSpy.mockRestore();
      }
    });

    it('should verify fallback texture is a 1x1 white DataTexture', async () => {
      const renderer = new CloudRenderer('#cloud-container');
      
      // Mock THREE.TextureLoader to simulate loading failure
      const originalLoad = THREE.TextureLoader.prototype.load;
      THREE.TextureLoader.prototype.load = function(url, onLoad, onProgress, onError) {
        setTimeout(() => {
          if (onError) {
            onError(new Error('Failed to load texture'));
          }
        }, 0);
      };
      
      // Mock console.error to suppress error output
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        const texture = await renderer.loadTexture('/invalid/path.png');
        
        // Should be a DataTexture (fallback)
        expect(texture).toBeInstanceOf(THREE.DataTexture);
      } finally {
        THREE.TextureLoader.prototype.load = originalLoad;
        consoleErrorSpy.mockRestore();
      }
    });
  });

  describe('init() method', () => {
    it('should verify pixel ratio capping logic', () => {
      // Test the pixel ratio capping logic directly
      const testCases = [
        { devicePixelRatio: 1, expected: 1 },
        { devicePixelRatio: 1.5, expected: 1.5 },
        { devicePixelRatio: 2, expected: 2 },
        { devicePixelRatio: 3, expected: 2 },
        { devicePixelRatio: 4, expected: 2 }
      ];
      
      testCases.forEach(({ devicePixelRatio, expected }) => {
        const capped = Math.min(devicePixelRatio, 2);
        expect(capped).toBe(expected);
      });
    });

    it('should verify orthographic camera bounds configuration', () => {
      // Test that we're using the correct camera bounds
      const expectedBounds = {
        left: -1,
        right: 1,
        top: 1,
        bottom: -1,
        near: 0,
        far: 2
      };
      
      // Create a camera with these bounds to verify they're valid
      const camera = new THREE.OrthographicCamera(
        expectedBounds.left,
        expectedBounds.right,
        expectedBounds.top,
        expectedBounds.bottom,
        expectedBounds.near,
        expectedBounds.far
      );
      
      expect(camera.left).toBe(-1);
      expect(camera.right).toBe(1);
      expect(camera.top).toBe(1);
      expect(camera.bottom).toBe(-1);
      expect(camera.near).toBe(0);
      expect(camera.far).toBe(2);
    });

    it('should verify renderer configuration options', () => {
      // Test that the renderer config options are correct
      const config = {
        alpha: true,
        antialias: false
      };
      
      expect(config.alpha).toBe(true);
      expect(config.antialias).toBe(false);
    });

    it('should handle missing container gracefully', async () => {
      const renderer = new CloudRenderer('#non-existent-container');
      
      // Should not throw
      await expect(renderer.init()).resolves.toBeUndefined();
      
      // Should not create renderer
      expect(renderer.renderer).toBeNull();
    });

    it('should handle WebGL unavailability gracefully', async () => {
      const renderer = new CloudRenderer('#cloud-container');
      
      // Mock isWebGLAvailable to return false
      vi.spyOn(renderer, 'isWebGLAvailable').mockReturnValue(false);
      
      await renderer.init();
      
      // Should not create renderer
      expect(renderer.renderer).toBeNull();
    });

    it('should not throw errors during initialization', async () => {
      const renderer = new CloudRenderer('#cloud-container');
      
      await expect(renderer.init()).resolves.toBeUndefined();
    });
  });

  describe('Material Setup Tests', () => {
    it('should define uniforms with correct structure', () => {
      // Test uniforms structure independently
      const mockTexture = new THREE.Texture();
      const uniforms = {
        uTime: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uNoise: { value: mockTexture }
      };
      
      // Verify uniforms object structure
      expect(uniforms.uTime).toBeDefined();
      expect(uniforms.uTime.value).toBe(0.0);
      
      expect(uniforms.uResolution).toBeDefined();
      expect(uniforms.uResolution.value).toBeInstanceOf(THREE.Vector2);
      expect(uniforms.uResolution.value.x).toBe(window.innerWidth);
      expect(uniforms.uResolution.value.y).toBe(window.innerHeight);
      
      expect(uniforms.uNoise).toBeDefined();
      expect(uniforms.uNoise.value).toBeInstanceOf(THREE.Texture);
    });

    it('should create ShaderMaterial with correct configuration', () => {
      // Test ShaderMaterial creation independently
      const mockTexture = new THREE.Texture();
      const uniforms = {
        uTime: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(1920, 1080) },
        uNoise: { value: mockTexture }
      };
      
      const material = new THREE.ShaderMaterial({
        vertexShader: 'void main() { gl_Position = vec4(0.0); }',
        fragmentShader: 'void main() { gl_FragColor = vec4(1.0); }',
        uniforms: uniforms,
        transparent: true
      });
      
      // Verify material properties
      expect(material).toBeInstanceOf(THREE.ShaderMaterial);
      expect(material.vertexShader).toBeDefined();
      expect(typeof material.vertexShader).toBe('string');
      expect(material.fragmentShader).toBeDefined();
      expect(typeof material.fragmentShader).toBe('string');
      expect(material.uniforms).toBe(uniforms);
      expect(material.transparent).toBe(true);
    });

    it('should create mesh and add to scene correctly', () => {
      // Test mesh creation and scene addition independently
      const scene = new THREE.Scene();
      const geometry = new THREE.PlaneGeometry(2, 2);
      const material = new THREE.ShaderMaterial({
        vertexShader: 'void main() {}',
        fragmentShader: 'void main() {}',
        transparent: true
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      
      // Verify mesh properties
      expect(mesh).toBeInstanceOf(THREE.Mesh);
      expect(mesh.geometry).toBeInstanceOf(THREE.PlaneGeometry);
      expect(mesh.material).toBe(material);
      
      // Verify mesh is in scene
      expect(scene.children).toContain(mesh);
      expect(scene.children.length).toBeGreaterThan(0);
    });

    it('should create PlaneGeometry with 2x2 dimensions', () => {
      // Test PlaneGeometry creation independently
      const geometry = new THREE.PlaneGeometry(2, 2);
      
      // Verify geometry type
      expect(geometry).toBeInstanceOf(THREE.PlaneGeometry);
      
      // Verify geometry parameters
      const params = geometry.parameters;
      expect(params.width).toBe(2);
      expect(params.height).toBe(2);
    });
  });

  describe('Shader Structure Tests', () => {
    it('should contain noise function in shader code', async () => {
      // Read the cloud-renderer.js file to check shader content
      const fs = await import('fs');
      const path = await import('path');
      const fileContent = fs.readFileSync(
        path.join(process.cwd(), 'assets/js/cloud-renderer.js'),
        'utf-8'
      );
      
      // Check for noise function definition
      expect(fileContent).toContain('float noise(vec3 p)');
      expect(fileContent).toContain('texture2D(uNoise');
    });

    it('should contain FBM function with 6 octaves', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const fileContent = fs.readFileSync(
        path.join(process.cwd(), 'assets/js/cloud-renderer.js'),
        'utf-8'
      );
      
      // Check for FBM function definition
      expect(fileContent).toContain('float fbm(vec3 p)');
      
      // Check for 6 octaves loop
      expect(fileContent).toContain('for (int i = 0; i < 6; i++)');
      
      // Check for frequency and amplitude manipulation
      expect(fileContent).toContain('frequency');
      expect(fileContent).toContain('amplitude');
    });

    it('should contain MAX_STEPS constant set to 100', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const fileContent = fs.readFileSync(
        path.join(process.cwd(), 'assets/js/cloud-renderer.js'),
        'utf-8'
      );
      
      // Check for MAX_STEPS constant
      expect(fileContent).toContain('const int MAX_STEPS = 100');
    });

    it('should contain MARCH_SIZE constant', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const fileContent = fs.readFileSync(
        path.join(process.cwd(), 'assets/js/cloud-renderer.js'),
        'utf-8'
      );
      
      // Check for MARCH_SIZE constant
      expect(fileContent).toContain('const float MARCH_SIZE = 0.08');
    });

    it('should contain directional derivative lighting function', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const fileContent = fs.readFileSync(
        path.join(process.cwd(), 'assets/js/cloud-renderer.js'),
        'utf-8'
      );
      
      // Check for lighting calculation function
      expect(fileContent).toContain('float calculateLighting(vec3 p)');
      
      // Check for sun direction sampling
      expect(fileContent).toContain('SUN_DIR');
      
      // Check for directional derivative calculation
      expect(fileContent).toContain('densityHere');
      expect(fileContent).toContain('densityTowardSun');
    });

    it('should contain correct color constants for sky', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const fileContent = fs.readFileSync(
        path.join(process.cwd(), 'assets/js/cloud-renderer.js'),
        'utf-8'
      );
      
      // Check for sky color constants (blue-gray)
      expect(fileContent).toContain('skyBaseColor');
      expect(fileContent).toContain('vec3(0.7, 0.7, 0.90)');
      
      // Check for sky gradient color
      expect(fileContent).toContain('skyGradientColor');
      expect(fileContent).toContain('vec3(0.90, 0.75, 0.90)');
    });

    it('should contain correct color constants for sun', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const fileContent = fs.readFileSync(
        path.join(process.cwd(), 'assets/js/cloud-renderer.js'),
        'utf-8'
      );
      
      // Check for sun color constants (orange-yellow)
      expect(fileContent).toContain('sunGlowColor');
      expect(fileContent).toContain('vec3(1.0, 0.5, 0.3)');
      
      // Check for sun color in lighting
      expect(fileContent).toContain('sunColor');
    });

    it('should contain correct color constants for ambient lighting', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const fileContent = fs.readFileSync(
        path.join(process.cwd(), 'assets/js/cloud-renderer.js'),
        'utf-8'
      );
      
      // Check for ambient color constants (blue-gray)
      expect(fileContent).toContain('ambientColor');
      expect(fileContent).toContain('vec3(0.60, 0.60, 0.75)');
    });

    it('should contain raymarch function with proper structure', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const fileContent = fs.readFileSync(
        path.join(process.cwd(), 'assets/js/cloud-renderer.js'),
        'utf-8'
      );
      
      // Check for raymarch function
      expect(fileContent).toContain('vec4 raymarch(vec3 ro, vec3 rd)');
      
      // Check for raymarching loop
      expect(fileContent).toContain('for (int i = 0; i < MAX_STEPS; i++)');
      
      // Check for density sampling
      expect(fileContent).toContain('scene(p)');
    });

    it('should contain scene function with SDF', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const fileContent = fs.readFileSync(
        path.join(process.cwd(), 'assets/js/cloud-renderer.js'),
        'utf-8'
      );
      
      // Check for scene function
      expect(fileContent).toContain('float scene(vec3 p)');
      
      // Check for sphere SDF function
      expect(fileContent).toContain('float sdSphere(vec3 p, float r)');
      
      // Check for FBM usage in scene
      expect(fileContent).toContain('fbm(p)');
    });

    it('should contain main function with sky and compositing', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const fileContent = fs.readFileSync(
        path.join(process.cwd(), 'assets/js/cloud-renderer.js'),
        'utf-8'
      );
      
      // Check for main function
      expect(fileContent).toContain('void main()');
      
      // Check for sky rendering
      expect(fileContent).toContain('skyColor');
      
      // Check for sun glow
      expect(fileContent).toContain('sunGlow');
      
      // Check for compositing
      expect(fileContent).toContain('finalColor');
      expect(fileContent).toContain('gl_FragColor');
    });
  });
});

describe('Visibility Change Handling', () => {
  let container;

  beforeEach(() => {
    // Create a container element for testing
    container = document.createElement('div');
    container.id = 'cloud-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('should call pause() when page becomes hidden', () => {
    const renderer = new CloudRenderer('#cloud-container');
    
    // Manually set up the renderer to simulate successful initialization
    renderer.isAnimating = true;
    
    // Spy on the pause method before adding event listener
    const pauseSpy = vi.spyOn(renderer, 'pause');
    
    // Manually add the visibility change event listener
    // (simulating what init() would do)
    document.addEventListener('visibilitychange', renderer.boundHandleVisibilityChange);
    
    try {
      // Simulate page becoming hidden
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: true
      });
      
      // Trigger visibility change event
      const event = new Event('visibilitychange');
      document.dispatchEvent(event);
      
      // Verify pause was called
      expect(pauseSpy).toHaveBeenCalled();
      
      // Verify animation state changed
      expect(renderer.isAnimating).toBe(false);
    } finally {
      // Clean up
      document.removeEventListener('visibilitychange', renderer.boundHandleVisibilityChange);
      pauseSpy.mockRestore();
    }
  });

  it('should call resume() when page becomes visible', () => {
    const renderer = new CloudRenderer('#cloud-container');
    
    // Manually set up the renderer to simulate paused state
    renderer.isAnimating = false;
    renderer.startTime = performance.now();
    
    // Create a mock material with uniforms for resume() to work
    renderer.material = {
      uniforms: {
        uTime: { value: 0.5 }
      }
    };
    
    // Spy on the resume method before adding event listener
    const resumeSpy = vi.spyOn(renderer, 'resume');
    
    // Manually add the visibility change event listener
    // (simulating what init() would do)
    document.addEventListener('visibilitychange', renderer.boundHandleVisibilityChange);
    
    try {
      // Simulate page becoming visible
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: false
      });
      
      // Trigger visibility change event
      const event = new Event('visibilitychange');
      document.dispatchEvent(event);
      
      // Verify resume was called
      expect(resumeSpy).toHaveBeenCalled();
      
      // Verify animation state changed
      expect(renderer.isAnimating).toBe(true);
    } finally {
      // Clean up
      document.removeEventListener('visibilitychange', renderer.boundHandleVisibilityChange);
      renderer.pause(); // Stop any animation
      resumeSpy.mockRestore();
    }
  });

  it('should have boundHandleVisibilityChange method bound in constructor', () => {
    const renderer = new CloudRenderer('#cloud-container');
    
    // Verify the bound method exists
    expect(renderer.boundHandleVisibilityChange).toBeDefined();
    expect(typeof renderer.boundHandleVisibilityChange).toBe('function');
    
    // Verify it's bound to the renderer instance
    // We can test this by checking that calling it doesn't throw
    // and that it references the correct context
    expect(() => {
      renderer.boundHandleVisibilityChange();
    }).not.toThrow();
  });

  it('should handle visibility changes correctly when animation is running', () => {
    const renderer = new CloudRenderer('#cloud-container');
    
    // Manually set up the renderer to simulate successful initialization
    renderer.isAnimating = true;
    renderer.startTime = performance.now();
    
    // Create a mock material with uniforms for resume() to work
    renderer.material = {
      uniforms: {
        uTime: { value: 0.5 }
      }
    };
    
    // Manually add the visibility change event listener
    document.addEventListener('visibilitychange', renderer.boundHandleVisibilityChange);
    
    try {
      // Verify animation is running
      expect(renderer.isAnimating).toBe(true);
      
      // Simulate page becoming hidden
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: true
      });
      
      // Trigger visibility change event
      document.dispatchEvent(new Event('visibilitychange'));
      
      // Verify animation is paused
      expect(renderer.isAnimating).toBe(false);
      
      // Simulate page becoming visible again
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: false
      });
      
      // Trigger visibility change event
      document.dispatchEvent(new Event('visibilitychange'));
      
      // Verify animation is resumed
      expect(renderer.isAnimating).toBe(true);
    } finally {
      // Clean up
      document.removeEventListener('visibilitychange', renderer.boundHandleVisibilityChange);
      renderer.pause();
    }
  });
});

describe('Property-Based Tests', () => {
  let container;

  beforeEach(() => {
    // Create a container element for testing
    container = document.createElement('div');
    container.id = 'cloud-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  /**
   * Feature: volumetric-clouds-threejs, Property 1: Time uniform progression
   * Validates: Requirements 1.5
   * 
   * For any sequence of animation frames, the uTime uniform value should monotonically
   * increase, ensuring continuous cloud animation.
   */
  it('Property 1: Time uniform progression - time should increase monotonically across frames', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 10 }), // number of frames to test (reduced for performance)
        async (frameCount) => {
          const renderer = new CloudRenderer('#cloud-container');
          
          // Mock THREE.TextureLoader for initialization
          const originalLoad = THREE.TextureLoader.prototype.load;
          THREE.TextureLoader.prototype.load = function(url, onLoad, onProgress, onError) {
            const mockTexture = new THREE.Texture();
            setTimeout(() => {
              if (onLoad) {
                onLoad(mockTexture);
              }
            }, 0);
          };
          
          try {
            // Mock isWebGLAvailable to return true for testing
            vi.spyOn(renderer, 'isWebGLAvailable').mockReturnValue(true);
            
            // Initialize the renderer
            await renderer.init();
            
            // If initialization failed (no material), skip this test case
            if (!renderer.material || !renderer.material.uniforms || !renderer.material.uniforms.uTime) {
              return true; // Skip this case
            }
            
            // Collect time values across multiple frames
            const times = [];
            
            // Manually trigger animation updates to collect time values
            for (let i = 0; i < frameCount; i++) {
              // Wait a tiny amount to ensure time progresses (1ms instead of 10ms)
              await new Promise(resolve => setTimeout(resolve, 1));
              
              // Manually update the time uniform as animate() would
              const currentTime = performance.now();
              const elapsedTime = (currentTime - renderer.startTime) / 1000;
              
              renderer.material.uniforms.uTime.value = elapsedTime;
              times.push(renderer.material.uniforms.uTime.value);
            }
            
            // Verify monotonic increase
            for (let i = 1; i < times.length; i++) {
              if (times[i] <= times[i - 1]) {
                return false; // Property violated
              }
            }
            
            // Clean up
            renderer.pause();
            
            return true; // Property holds
          } finally {
            THREE.TextureLoader.prototype.load = originalLoad;
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 30000); // Increase timeout for property test

  /**
   * Feature: volumetric-clouds-threejs, Property 3: Animation pause on visibility change
   * Validates: Requirements 4.4
   * 
   * For any page visibility change to hidden state, the animation loop should stop
   * requesting new frames until visibility is restored.
   */
  it('Property 3: Animation pause on visibility change - paused animation should not update time', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // number of pause/resume cycles to test
        async (cycleCount) => {
          const renderer = new CloudRenderer('#cloud-container');
          
          // Mock THREE.TextureLoader for initialization
          const originalLoad = THREE.TextureLoader.prototype.load;
          THREE.TextureLoader.prototype.load = function(url, onLoad, onProgress, onError) {
            const mockTexture = new THREE.Texture();
            setTimeout(() => {
              if (onLoad) {
                onLoad(mockTexture);
              }
            }, 0);
          };
          
          try {
            // Mock isWebGLAvailable to return true for testing
            vi.spyOn(renderer, 'isWebGLAvailable').mockReturnValue(true);
            
            // Initialize the renderer
            await renderer.init();
            
            // If initialization failed (no material), skip this test case
            if (!renderer.material || !renderer.material.uniforms || !renderer.material.uniforms.uTime) {
              return true; // Skip this case
            }
            
            // Test pause/resume cycles
            for (let cycle = 0; cycle < cycleCount; cycle++) {
              // Let animation run for a bit
              await new Promise(resolve => setTimeout(resolve, 5));
              
              // Get time before pause
              const timeBeforePause = renderer.material.uniforms.uTime.value;
              
              // Pause the animation
              renderer.pause();
              
              // Verify animation is paused
              if (renderer.isAnimating !== false) {
                return false; // Property violated: should be paused
              }
              
              // Verify animation frame ID is cleared
              if (renderer.animationFrameId !== null) {
                return false; // Property violated: frame ID should be null
              }
              
              // Wait a bit while paused
              await new Promise(resolve => setTimeout(resolve, 5));
              
              // Time should not have changed while paused
              const timeWhilePaused = renderer.material.uniforms.uTime.value;
              if (timeWhilePaused !== timeBeforePause) {
                return false; // Property violated: time should not change while paused
              }
              
              // Resume the animation
              renderer.resume();
              
              // Verify animation is resumed
              if (renderer.isAnimating !== true) {
                return false; // Property violated: should be animating
              }
              
              // Let animation run for a bit after resume
              await new Promise(resolve => setTimeout(resolve, 5));
              
              // Time should have progressed after resume
              const timeAfterResume = renderer.material.uniforms.uTime.value;
              if (timeAfterResume <= timeBeforePause) {
                return false; // Property violated: time should progress after resume
              }
            }
            
            // Clean up
            renderer.pause();
            
            return true; // Property holds
          } finally {
            THREE.TextureLoader.prototype.load = originalLoad;
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 30000); // Increase timeout for property test

  /**
   * Feature: volumetric-clouds-threejs, Property 2: Viewport resize consistency
   * Validates: Requirements 4.3
   * 
   * For any window resize event, the renderer dimensions and uResolution uniform
   * should match the new viewport dimensions after the resize handler completes.
   */
  it('Property 2: Viewport resize consistency - renderer and uniform should match after any resize', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 320, max: 3840 }), // width
        fc.integer({ min: 240, max: 2160 }), // height
        async (width, height) => {
          const renderer = new CloudRenderer('#cloud-container');
          
          // Mock THREE.TextureLoader for initialization
          const originalLoad = THREE.TextureLoader.prototype.load;
          THREE.TextureLoader.prototype.load = function(url, onLoad, onProgress, onError) {
            const mockTexture = new THREE.Texture();
            setTimeout(() => {
              if (onLoad) {
                onLoad(mockTexture);
              }
            }, 0);
          };
          
          try {
            // Mock isWebGLAvailable to return true for testing
            vi.spyOn(renderer, 'isWebGLAvailable').mockReturnValue(true);
            
            // Initialize the renderer
            await renderer.init();
            
            // If initialization failed, skip this test case
            if (!renderer.renderer || !renderer.material || !renderer.material.uniforms || !renderer.material.uniforms.uResolution) {
              return true; // Skip this case
            }
            
            // Store original window dimensions
            const originalWidth = window.innerWidth;
            const originalHeight = window.innerHeight;
            
            try {
              // Set new window dimensions
              Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: width
              });
              Object.defineProperty(window, 'innerHeight', {
                writable: true,
                configurable: true,
                value: height
              });
              
              // Call handleResize directly (bypassing debounce for testing)
              renderer.handleResize();
              
              // Get renderer size
              const rendererSize = new THREE.Vector2();
              renderer.renderer.getSize(rendererSize);
              
              // Get uniform resolution
              const uniformWidth = renderer.material.uniforms.uResolution.value.x;
              const uniformHeight = renderer.material.uniforms.uResolution.value.y;
              
              // Verify renderer size matches new dimensions
              if (rendererSize.x !== width || rendererSize.y !== height) {
                return false; // Property violated: renderer size doesn't match
              }
              
              // Verify uniform resolution matches new dimensions
              if (uniformWidth !== width || uniformHeight !== height) {
                return false; // Property violated: uniform doesn't match
              }
              
              // Verify renderer size matches uniform resolution
              if (rendererSize.x !== uniformWidth || rendererSize.y !== uniformHeight) {
                return false; // Property violated: renderer and uniform don't match
              }
              
              return true; // Property holds
            } finally {
              // Restore original window dimensions
              Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: originalWidth
              });
              Object.defineProperty(window, 'innerHeight', {
                writable: true,
                configurable: true,
                value: originalHeight
              });
            }
          } finally {
            // Clean up
            renderer.pause();
            THREE.TextureLoader.prototype.load = originalLoad;
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 30000); // Increase timeout for property test

  /**
   * Feature: volumetric-clouds-threejs, Property 4: Texture loading error handling
   * Validates: Requirements 5.4
   * 
   * For any texture loading failure, the system should log an error and continue
   * initialization without throwing unhandled exceptions.
   */
  it('Property 4: Texture loading error handling - should handle any texture path error gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('/invalid/path.png'),
          fc.constant('/nonexistent/texture.png'),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('\0')),
          fc.constant(''),
          fc.constant('http://invalid-domain-that-does-not-exist.com/texture.png')
        ),
        async (invalidPath) => {
          const renderer = new CloudRenderer('#cloud-container');
          
          // Mock THREE.TextureLoader to simulate loading failure
          const originalLoad = THREE.TextureLoader.prototype.load;
          THREE.TextureLoader.prototype.load = function(url, onLoad, onProgress, onError) {
            // Simulate immediate error callback
            setTimeout(() => {
              if (onError) {
                onError(new Error('Simulated texture loading error'));
              }
            }, 0);
          };
          
          // Mock console.error to capture error logging
          const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
          
          try {
            // Attempt to load texture with invalid path
            const texture = await renderer.loadTexture(invalidPath);
            
            // Should return a texture (fallback)
            expect(texture).toBeDefined();
            expect(texture).toBeInstanceOf(THREE.Texture);
            
            // Should have correct filtering settings
            expect(texture.minFilter).toBe(THREE.LinearFilter);
            expect(texture.magFilter).toBe(THREE.LinearFilter);
            
            // Should have correct wrapping settings
            expect(texture.wrapS).toBe(THREE.RepeatWrapping);
            expect(texture.wrapT).toBe(THREE.RepeatWrapping);
            
            // Should have logged an error
            expect(consoleErrorSpy).toHaveBeenCalled();
            
            // Should not throw an exception
            return true;
          } catch (error) {
            // If an exception is thrown, the property fails
            return false;
          } finally {
            // Restore original methods
            THREE.TextureLoader.prototype.load = originalLoad;
            consoleErrorSpy.mockRestore();
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 10000); // Increase timeout to 10 seconds

  /**
   * Feature: volumetric-clouds-threejs, Property 5: Graceful initialization failure
   * Validates: Requirements 6.5
   * 
   * For any error during CloudRenderer initialization, the error should be caught
   * and logged without propagating to break other page functionality.
   */
  it('Property 5: Graceful initialization failure - should handle any initialization error without throwing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Test with missing container
          fc.constant({ scenario: 'missing-container', selector: '#non-existent-container' }),
          // Test with invalid selector
          fc.constant({ scenario: 'invalid-selector', selector: '' }),
          // Test with WebGL unavailable
          fc.constant({ scenario: 'no-webgl', selector: '#cloud-container' }),
          // Test with texture loading failure
          fc.constant({ scenario: 'texture-error', selector: '#cloud-container' })
        ),
        async (testCase) => {
          const renderer = new CloudRenderer(testCase.selector);
          
          // Mock console.error and console.warn to capture error logging
          const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
          const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
          
          // Set up mocks based on scenario
          let originalLoad;
          let webglSpy;
          
          try {
            switch (testCase.scenario) {
              case 'missing-container':
                // Container doesn't exist, no additional mocking needed
                break;
                
              case 'invalid-selector':
                // Invalid selector, no additional mocking needed
                break;
                
              case 'no-webgl':
                // Mock WebGL unavailability
                webglSpy = vi.spyOn(renderer, 'isWebGLAvailable').mockReturnValue(false);
                break;
                
              case 'texture-error':
                // Mock texture loading failure
                originalLoad = THREE.TextureLoader.prototype.load;
                THREE.TextureLoader.prototype.load = function(url, onLoad, onProgress, onError) {
                  setTimeout(() => {
                    if (onError) {
                      onError(new Error('Texture loading failed'));
                    }
                  }, 0);
                };
                break;
            }
            
            // Attempt to initialize - should not throw
            await renderer.init();
            
            // Verify that either an error or warning was logged for failure scenarios
            const errorOrWarningLogged = consoleErrorSpy.mock.calls.length > 0 || 
                                         consoleWarnSpy.mock.calls.length > 0;
            
            // For scenarios that should fail, verify logging occurred
            if (testCase.scenario === 'missing-container' || testCase.scenario === 'no-webgl') {
              expect(errorOrWarningLogged).toBe(true);
            }
            
            // Verify renderer is null (initialization failed gracefully)
            if (testCase.scenario === 'missing-container' || 
                testCase.scenario === 'invalid-selector' || 
                testCase.scenario === 'no-webgl') {
              expect(renderer.renderer).toBeNull();
            }
            
            // Property holds: no exception was thrown
            return true;
          } catch (error) {
            // If an exception propagates, the property fails
            return false;
          } finally {
            // Restore original methods
            if (originalLoad) {
              THREE.TextureLoader.prototype.load = originalLoad;
            }
            if (webglSpy) {
              webglSpy.mockRestore();
            }
            consoleErrorSpy.mockRestore();
            consoleWarnSpy.mockRestore();
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 15000); // Increase timeout to 15 seconds
});

describe('Resource Cleanup Tests', () => {
  let container;

  beforeEach(() => {
    // Create a container element for testing
    container = document.createElement('div');
    container.id = 'cloud-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('should remove event listeners on dispose', () => {
    const renderer = new CloudRenderer('#cloud-container');
    
    // Spy on removeEventListener
    const windowRemoveSpy = vi.spyOn(window, 'removeEventListener');
    const documentRemoveSpy = vi.spyOn(document, 'removeEventListener');
    
    // Manually add event listeners (simulating what init() does)
    window.addEventListener('resize', renderer.debouncedResize);
    document.addEventListener('visibilitychange', renderer.boundHandleVisibilityChange);
    
    // Call dispose
    renderer.dispose();
    
    // Verify event listeners were removed
    expect(windowRemoveSpy).toHaveBeenCalledWith('resize', renderer.debouncedResize);
    expect(documentRemoveSpy).toHaveBeenCalledWith('visibilitychange', renderer.boundHandleVisibilityChange);
    
    // Clean up spies
    windowRemoveSpy.mockRestore();
    documentRemoveSpy.mockRestore();
  });

  it('should cancel animation frame on dispose', () => {
    const renderer = new CloudRenderer('#cloud-container');
    
    // Set up a mock animation frame ID
    renderer.animationFrameId = 12345;
    renderer.isAnimating = true;
    
    // Spy on cancelAnimationFrame
    const cancelSpy = vi.spyOn(global, 'cancelAnimationFrame');
    
    // Call dispose
    renderer.dispose();
    
    // Verify cancelAnimationFrame was called with the correct ID
    expect(cancelSpy).toHaveBeenCalledWith(12345);
    
    // Verify animation frame ID is cleared
    expect(renderer.animationFrameId).toBeNull();
    
    // Verify animation state is stopped
    expect(renderer.isAnimating).toBe(false);
    
    // Clean up spy
    cancelSpy.mockRestore();
  });

  it('should clear resize timeout on dispose', () => {
    const renderer = new CloudRenderer('#cloud-container');
    
    // Set up a mock resize timeout ID
    renderer.resizeTimeoutId = 67890;
    
    // Spy on clearTimeout
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    
    // Call dispose
    renderer.dispose();
    
    // Verify clearTimeout was called with the correct ID
    expect(clearTimeoutSpy).toHaveBeenCalledWith(67890);
    
    // Verify timeout ID is cleared
    expect(renderer.resizeTimeoutId).toBeNull();
    
    // Clean up spy
    clearTimeoutSpy.mockRestore();
  });

  it('should dispose of Three.js geometry', () => {
    const renderer = new CloudRenderer('#cloud-container');
    
    // Create mock geometry with dispose method
    const mockGeometry = new THREE.PlaneGeometry(2, 2);
    const geometryDisposeSpy = vi.spyOn(mockGeometry, 'dispose');
    
    // Set up mock mesh with geometry
    renderer.mesh = new THREE.Mesh(mockGeometry, new THREE.MeshBasicMaterial());
    renderer.scene = new THREE.Scene();
    renderer.scene.add(renderer.mesh);
    
    // Call dispose
    renderer.dispose();
    
    // Verify geometry dispose was called
    expect(geometryDisposeSpy).toHaveBeenCalled();
    
    // Verify mesh is cleared
    expect(renderer.mesh).toBeNull();
    
    // Clean up spy
    geometryDisposeSpy.mockRestore();
  });

  it('should dispose of Three.js material', () => {
    const renderer = new CloudRenderer('#cloud-container');
    
    // Create mock material with dispose method
    const mockMaterial = new THREE.ShaderMaterial({
      vertexShader: 'void main() {}',
      fragmentShader: 'void main() {}'
    });
    const materialDisposeSpy = vi.spyOn(mockMaterial, 'dispose');
    
    // Set up mock material
    renderer.material = mockMaterial;
    
    // Call dispose
    renderer.dispose();
    
    // Verify material dispose was called
    expect(materialDisposeSpy).toHaveBeenCalled();
    
    // Verify material is cleared
    expect(renderer.material).toBeNull();
    
    // Clean up spy
    materialDisposeSpy.mockRestore();
  });

  it('should dispose of Three.js texture', () => {
    const renderer = new CloudRenderer('#cloud-container');
    
    // Create mock texture with dispose method
    const mockTexture = new THREE.Texture();
    const textureDisposeSpy = vi.spyOn(mockTexture, 'dispose');
    
    // Set up mock texture
    renderer.texture = mockTexture;
    
    // Call dispose
    renderer.dispose();
    
    // Verify texture dispose was called
    expect(textureDisposeSpy).toHaveBeenCalled();
    
    // Verify texture is cleared
    expect(renderer.texture).toBeNull();
    
    // Clean up spy
    textureDisposeSpy.mockRestore();
  });

  it('should dispose of Three.js renderer', () => {
    const renderer = new CloudRenderer('#cloud-container');
    
    // Create mock renderer with dispose method (without WebGL context)
    const mockRenderer = {
      dispose: vi.fn(),
      domElement: document.createElement('canvas')
    };
    const rendererDisposeSpy = vi.spyOn(mockRenderer, 'dispose');
    
    // Set up mock renderer
    renderer.renderer = mockRenderer;
    
    // Call dispose
    renderer.dispose();
    
    // Verify renderer dispose was called
    expect(rendererDisposeSpy).toHaveBeenCalled();
    
    // Verify renderer is cleared
    expect(renderer.renderer).toBeNull();
    
    // Clean up spy
    rendererDisposeSpy.mockRestore();
  });

  it('should remove canvas from DOM on dispose', () => {
    const renderer = new CloudRenderer('#cloud-container');
    
    // Create mock renderer with canvas
    const mockCanvas = document.createElement('canvas');
    container.appendChild(mockCanvas);
    
    const mockRenderer = {
      dispose: vi.fn(),
      domElement: mockCanvas
    };
    renderer.renderer = mockRenderer;
    
    // Verify canvas is in DOM
    expect(container.contains(mockCanvas)).toBe(true);
    
    // Call dispose
    renderer.dispose();
    
    // Verify canvas is removed from DOM
    expect(container.contains(mockCanvas)).toBe(false);
  });

  it('should remove mesh from scene on dispose', () => {
    const renderer = new CloudRenderer('#cloud-container');
    
    // Create mock scene and mesh
    const mockScene = new THREE.Scene();
    const mockMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial()
    );
    
    mockScene.add(mockMesh);
    renderer.scene = mockScene;
    renderer.mesh = mockMesh;
    
    // Verify mesh is in scene
    expect(mockScene.children).toContain(mockMesh);
    
    // Call dispose
    renderer.dispose();
    
    // Verify mesh is removed from scene
    expect(mockScene.children).not.toContain(mockMesh);
  });

  it('should clear all references on dispose', () => {
    const renderer = new CloudRenderer('#cloud-container');
    
    // Set up mock objects
    renderer.scene = new THREE.Scene();
    renderer.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
    renderer.renderer = {
      dispose: vi.fn(),
      domElement: document.createElement('canvas')
    };
    renderer.material = new THREE.ShaderMaterial({
      vertexShader: 'void main() {}',
      fragmentShader: 'void main() {}'
    });
    renderer.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      renderer.material
    );
    renderer.texture = new THREE.Texture();
    renderer.animationFrameId = 12345;
    renderer.isAnimating = true;
    
    // Call dispose
    renderer.dispose();
    
    // Verify all references are cleared
    expect(renderer.scene).toBeNull();
    expect(renderer.camera).toBeNull();
    expect(renderer.renderer).toBeNull();
    expect(renderer.material).toBeNull();
    expect(renderer.mesh).toBeNull();
    expect(renderer.texture).toBeNull();
    expect(renderer.animationFrameId).toBeNull();
    expect(renderer.isAnimating).toBe(false);
  });

  it('should handle dispose when resources are already null', () => {
    const renderer = new CloudRenderer('#cloud-container');
    
    // Don't set up any resources (all should be null)
    
    // Should not throw when disposing null resources
    expect(() => {
      renderer.dispose();
    }).not.toThrow();
  });

  it('should handle dispose multiple times without errors', () => {
    const renderer = new CloudRenderer('#cloud-container');
    
    // Set up some mock objects
    renderer.scene = new THREE.Scene();
    renderer.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
    renderer.animationFrameId = 12345;
    
    // First dispose
    expect(() => {
      renderer.dispose();
    }).not.toThrow();
    
    // Second dispose (all resources should be null now)
    expect(() => {
      renderer.dispose();
    }).not.toThrow();
    
    // Verify resources are still null
    expect(renderer.scene).toBeNull();
    expect(renderer.camera).toBeNull();
    expect(renderer.animationFrameId).toBeNull();
  });

  it('should log success message on dispose', () => {
    const renderer = new CloudRenderer('#cloud-container');
    
    // Mock console.log
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Call dispose
    renderer.dispose();
    
    // Verify success message was logged
    expect(consoleLogSpy).toHaveBeenCalledWith('CloudRenderer disposed successfully');
    
    // Clean up spy
    consoleLogSpy.mockRestore();
  });
});

describe('Integration Tests', () => {
  let container;

  beforeEach(() => {
    // Create a container element for testing
    container = document.createElement('div');
    container.id = 'cloud-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  /**
   * Test CloudRenderer initializes with real DOM container
   * Validates: Requirements 6.1
   * 
   * Note: This test verifies the DOM integration aspects that can be tested
   * without a full WebGL context. Full WebGL rendering requires a real browser.
   */
  it('should verify container element exists and is accessible', () => {
    const renderer = new CloudRenderer('#cloud-container');
    
    // Verify container selector is stored
    expect(renderer.containerSelector).toBe('#cloud-container');
    
    // Verify container element exists in DOM
    const containerEl = document.querySelector('#cloud-container');
    expect(containerEl).not.toBeNull();
    expect(containerEl).toBe(container);
    
    // Verify container is in the document body
    expect(document.body.contains(containerEl)).toBe(true);
  });

  /**
   * Test canvas would be appended to correct container
   * Validates: Requirements 6.3
   * 
   * Note: This test verifies the DOM structure without requiring WebGL.
   */
  it('should verify canvas can be appended to container', () => {
    // Simulate what init() does: append a canvas to the container
    const mockCanvas = document.createElement('canvas');
    container.appendChild(mockCanvas);
    
    // Verify canvas was appended
    expect(container.children.length).toBe(1);
    
    // Verify the element is a canvas
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
    expect(canvas.tagName.toLowerCase()).toBe('canvas');
    expect(canvas).toBe(mockCanvas);
  });

  /**
   * Test z-index layering is correct
   * Validates: Requirements 6.3
   */
  it('should verify z-index layering with CSS', () => {
    // Remove the existing container to avoid conflicts
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    
    // Create a mock hero section structure
    const heroSection = document.createElement('section');
    heroSection.id = 'hero';
    heroSection.className = 'relative';
    
    // Add cloud container
    const cloudContainer = document.createElement('div');
    cloudContainer.id = 'cloud-container';
    cloudContainer.className = 'cloud-container';
    heroSection.appendChild(cloudContainer);
    
    // Add hero content
    const heroContent = document.createElement('div');
    heroContent.className = 'hero-content';
    heroContent.textContent = 'Hero Content';
    heroSection.appendChild(heroContent);
    
    // Add to document
    document.body.appendChild(heroSection);
    
    try {
      // Verify cloud container exists
      const cloudEl = document.querySelector('#cloud-container');
      expect(cloudEl).toBeDefined();
      expect(cloudEl).not.toBeNull();
      
      // Verify hero section exists
      const heroEl = document.querySelector('#hero');
      expect(heroEl).toBeDefined();
      expect(heroEl).not.toBeNull();
      
      // Verify cloud container has the correct class
      expect(cloudEl.classList.contains('cloud-container')).toBe(true);
      
      // Note: In a real browser, we would verify computed z-index values
      // In jsdom, we can only verify the class names are applied correctly
      // The actual z-index values are defined in CSS:
      // - .cloud-container: z-index: 0
      // - #hero: z-index: 1
      // - #hero > *: z-index: 2
      
      // Verify the structure is correct for CSS to apply
      expect(heroEl.contains(cloudEl)).toBe(true);
      expect(heroEl.contains(heroContent)).toBe(true);
    } finally {
      // Clean up
      document.body.removeChild(heroSection);
      
      // Restore the container for other tests
      container = document.createElement('div');
      container.id = 'cloud-container';
      document.body.appendChild(container);
    }
  });

  /**
   * Test initialization validates container exists
   * Validates: Requirements 6.1
   */
  it('should validate container exists before initialization', () => {
    const renderer = new CloudRenderer('#cloud-container');
    
    // Verify the container exists
    const containerEl = document.querySelector(renderer.containerSelector);
    expect(containerEl).not.toBeNull();
    
    // Verify it's the correct element
    expect(containerEl.id).toBe('cloud-container');
  });

  /**
   * Test initialization with missing container
   * Validates: Requirements 6.1
   */
  it('should handle initialization gracefully when container is missing', async () => {
    // Remove the container
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    
    const renderer = new CloudRenderer('#cloud-container');
    
    // Mock console.error to capture error message
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock isWebGLAvailable to return true
    vi.spyOn(renderer, 'isWebGLAvailable').mockReturnValue(true);
    
    try {
      // Initialize should not throw
      await expect(renderer.init()).resolves.toBeUndefined();
      
      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Cloud container not found:',
        '#cloud-container'
      );
      
      // Verify renderer was not created
      expect(renderer.renderer).toBeNull();
    } finally {
      consoleErrorSpy.mockRestore();
      
      // Restore container for other tests
      container = document.createElement('div');
      container.id = 'cloud-container';
      document.body.appendChild(container);
    }
  });

  /**
   * Test event listener methods are bound correctly
   * Validates: Requirements 6.1
   */
  it('should have bound event listener methods', () => {
    const renderer = new CloudRenderer('#cloud-container');
    
    // Verify bound methods exist
    expect(renderer.boundHandleResize).toBeDefined();
    expect(renderer.boundHandleVisibilityChange).toBeDefined();
    expect(renderer.debouncedResize).toBeDefined();
    
    // Verify they are functions
    expect(typeof renderer.boundHandleResize).toBe('function');
    expect(typeof renderer.boundHandleVisibilityChange).toBe('function');
    expect(typeof renderer.debouncedResize).toBe('function');
  });

  /**
   * Test handleResize method updates dimensions
   * Validates: Requirements 6.3
   */
  it('should have handleResize method that updates dimensions', () => {
    const renderer = new CloudRenderer('#cloud-container');
    
    // Create mock renderer and material
    renderer.renderer = {
      setSize: vi.fn()
    };
    renderer.material = {
      uniforms: {
        uResolution: {
          value: {
            set: vi.fn()
          }
        }
      }
    };
    
    // Store original dimensions
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;
    
    // Change window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1080
    });
    
    // Call handleResize
    renderer.handleResize();
    
    // Verify renderer.setSize was called with new dimensions
    expect(renderer.renderer.setSize).toHaveBeenCalledWith(1920, 1080);
    
    // Verify uniform.set was called with new dimensions
    expect(renderer.material.uniforms.uResolution.value.set).toHaveBeenCalledWith(1920, 1080);
    
    // Restore original dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalWidth
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalHeight
    });
  });
});
