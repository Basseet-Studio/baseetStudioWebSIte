/**
 * ImprovedNoise - 3D Perlin Noise Implementation
 * Based on Ken Perlin's improved noise algorithm
 */
class ImprovedNoise {
    constructor() {
        // Initialize permutation table with 256 values
        const p = [];
        for (let i = 0; i < 256; i++) {
            p[i] = Math.floor(Math.random() * 256);
        }
        
        // Duplicate the permutation table to avoid overflow
        this.perm = new Array(512);
        for (let i = 0; i < 512; i++) {
            this.perm[i] = p[i & 255];
        }
    }
    
    /**
     * Fade function for smooth interpolation
     * Uses 6t^5 - 15t^4 + 10t^3 for smooth curve
     */
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    /**
     * Linear interpolation
     */
    lerp(t, a, b) {
        return a + t * (b - a);
    }
    
    /**
     * Gradient function - converts hash to gradient direction
     */
    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
    
    /**
     * 3D Perlin noise function
     * Returns a value between -1 and 1
     */
    noise(x, y, z) {
        // Find unit cube that contains point
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;
        
        // Find relative x, y, z of point in cube
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        
        // Compute fade curves for x, y, z
        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);
        
        // Hash coordinates of the 8 cube corners
        const A = this.perm[X] + Y;
        const AA = this.perm[A] + Z;
        const AB = this.perm[A + 1] + Z;
        const B = this.perm[X + 1] + Y;
        const BA = this.perm[B] + Z;
        const BB = this.perm[B + 1] + Z;
        
        // Blend results from 8 corners of cube
        return this.lerp(
            w,
            this.lerp(
                v,
                this.lerp(
                    u,
                    this.grad(this.perm[AA], x, y, z),
                    this.grad(this.perm[BA], x - 1, y, z)
                ),
                this.lerp(
                    u,
                    this.grad(this.perm[AB], x, y - 1, z),
                    this.grad(this.perm[BB], x - 1, y - 1, z)
                )
            ),
            this.lerp(
                v,
                this.lerp(
                    u,
                    this.grad(this.perm[AA + 1], x, y, z - 1),
                    this.grad(this.perm[BA + 1], x - 1, y, z - 1)
                ),
                this.lerp(
                    u,
                    this.grad(this.perm[AB + 1], x, y - 1, z - 1),
                    this.grad(this.perm[BB + 1], x - 1, y - 1, z - 1)
                )
            )
        );
    }
}

// Make class globally available
window.ImprovedNoise = ImprovedNoise;
