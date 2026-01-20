// TypeScript Implementation of Xorshift128
// Must match the AssemblyScript version EXACTLY.

export class Xorshift128 {
    private x: number;
    private y: number;
    private z: number;
    private w: number;

    constructor(seed: number) {
        // Initialize same as AS version
        this.x = seed;
        this.y = 362436069;
        this.z = 521288629;
        this.w = 88675123;
    }

    next(): number {
        // We must use >>> 0 to force unsigned 32-bit integer arithmetic in JS
        const t = this.x ^ (this.x << 11);
        this.x = this.y;
        this.y = this.z;
        this.z = this.w;
        this.w = (this.w ^ (this.w >>> 19) ^ (t ^ (t >>> 8))) >>> 0;

        return this.w;
    }
}
