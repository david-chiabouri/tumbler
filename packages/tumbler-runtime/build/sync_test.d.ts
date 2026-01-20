/** Exported memory */
export declare const memory: WebAssembly.Memory;
/**
 * assembly/sync_test/init
 * @param seed `u32`
 */
export declare function init(seed: number): void;
/**
 * assembly/sync_test/next
 * @returns `u32`
 */
export declare function next(): number;
