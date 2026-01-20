import { file } from "bun";

/**
 * Validates Tumbler sessions using a WebAssembly (WASM) module.
 * Manages the lifecycle of the WASM instance and session creation.
 */
export class TumblerValidator {
    private wasmBuffer: ArrayBuffer | null = null;

    /**
     * Creates a new TumblerValidator.
     * 
     * @param {string} wasmPath - The file path to the compiled WASM module.
     */
    constructor(private wasmPath: string) { }

    /**
     * Loads the WASM module from the file system.
     * 
     * @throws {Error} If the WASM file does not exist at the specified path.
     */
    async load() {
        if (!(await file(this.wasmPath).exists())) {
            throw new Error(`WASM not found at ${this.wasmPath}`);
        }
        this.wasmBuffer = await file(this.wasmPath).arrayBuffer();
    }

    /**
     * Creates a new validation session seeded with a random value.
     * Instantiates the WASM module and initializes the session.
     * 
     * @param {bigint} seed - The seed value for the session's PRNG.
     * @returns {Promise<any>} The initialized validator instance from the WASM exports.
     */
    async createSession(seed: bigint) {
        if (!this.wasmBuffer) await this.load();

        const { instance } = await WebAssembly.instantiate(this.wasmBuffer!, {
            env: { abort: () => { }, trace: () => { }, TriggerServerEvent: () => { }, TriggerClientEvent: () => { } }
        });

        const validator = instance.exports as any;
        validator.init(seed);
        return validator;
    }
}
