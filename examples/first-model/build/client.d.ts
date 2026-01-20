/** Exported memory */
export declare const memory: WebAssembly.Memory;
// Exported runtime interface
export declare function __new(size: number, id: number): number;
export declare function __pin(ptr: number): number;
export declare function __unpin(ptr: number): void;
export declare function __collect(): void;
export declare const __rtti_base: number;
/**
 * ../../packages/tumbler-runtime/assembly/template/init
 * @param seed `u64`
 */
export declare function init(seed: bigint): void;
/**
 * ../../packages/tumbler-runtime/assembly/template/generateToken
 * @returns `u64`
 */
export declare function generateToken(): bigint;
/**
 * ../../packages/tumbler-runtime/assembly/template/getSecret
 * @returns `u64`
 */
export declare function getSecret(): bigint;
