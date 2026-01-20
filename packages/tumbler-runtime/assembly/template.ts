// The Template for the polymorphic client
// "Constants" below will be replaced by the Tumbler Compiler


@global const HARDCODED_SECRET: u64 = 0; // {{ SECRET_KEY }}

// PRNG State
let x: u64 = 0;
let y: u64 = 0;
let z: u64 = 0;
let w: u64 = 0;

/**
 * Initializes the Pseudo-Random Number Generator (PRNG) with a seed.
 * Uses a Xorshift128 algorithm.
 * 
 * @param {u64} seed - The initial seed value.
 */
export function init(seed: u64): void {
    x = seed;
    y = 362436069;
    z = 521288629;
    w = 88675123;
}

/**
 * Generates the next random number in the sequence.
 * 
 * @returns {u64} The next pseudo-random 64-bit unsigned integer.
 */
function next(): u64 {
    let t: u64 = x ^ (x << 11);
    x = y;
    y = z;
    z = w;
    w = w ^ (w >> 19) ^ (t ^ (t >> 8));
    return w;
}

/**
 * Generates a security token by XORing the next random number with the hardcoded secret.
 * This token validates the integrity of the client session.
 * 
 * @returns {u64} The generated security token.
 */
export function generateToken(): u64 {
    return next() ^ HARDCODED_SECRET;
}

/**
 * Retrieves the compiled-in secret key.
 * 
 * @returns {u64} The hardcoded secret key.
 */
export function getSecret(): u64 {
    return HARDCODED_SECRET;
}

// Keep trace for debugging
@external("env", "trace")
export declare function trace(msg: string): void;

@external("env", "abort")
export declare function abort(msg: string, file: string, line: u32, column: u32): void;
