/** Exported memory */
export declare const memory: WebAssembly.Memory;
/**
 * assembly/generated_client/TriggerServerEvent
 * @param name `~lib/string/String`
 */
export declare function TriggerServerEvent(name: string): void;
/**
 * assembly/generated_client/TriggerClientEvent
 * @param name `~lib/string/String`
 */
export declare function TriggerClientEvent(name: string): void;
/**
 * assembly/generated_client/getSecret
 * @returns `u64`
 */
export declare function getSecret(): bigint;
/**
 * assembly/generated_client/roll
 * @param input `u64`
 * @returns `u64`
 */
export declare function roll(input: bigint): bigint;
/**
 * assembly/generated_client/testEvents
 */
export declare function testEvents(): void;
