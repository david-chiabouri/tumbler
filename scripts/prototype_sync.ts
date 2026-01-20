import { file, resolve } from "bun";
import { join } from "path";
import { Xorshift128 } from "../packages/tumbler-runtime/src/utils/prng";

const RUNTIME_PKG = join(import.meta.dir, "../packages/tumbler-runtime");
const AS_SOURCE = join(RUNTIME_PKG, "assembly/sync_test.ts");
const WASM_OUT = join(RUNTIME_PKG, "build/sync_test.wasm");

async function main() {
    console.log("🧪 Starting Prototype-2: PRNG Sync Test");

    // 1. Compile AS
    console.log("⚙️  Compiling WASM PRNG...");
    const compileCmd = [
        "bun", "run", "asc",
        AS_SOURCE,
        "--target", "release",
        "--outFile", WASM_OUT,
        "--bindings", "esm"
    ];

    const proc = Bun.spawn(compileCmd, {
        cwd: RUNTIME_PKG,
        stdout: "ignore", // reduce noise
        stderr: "inherit"
    });
    if ((await proc.exited) !== 0) {
        console.error("❌ Compilation Failed");
        process.exit(1);
    }

    // 2. Initialize
    const SEED = 12345;

    // Setup Node/TS PRNG
    const serverPRNG = new Xorshift128(SEED);

    // Setup WASM PRNG
    const wasmBuffer = await file(WASM_OUT).arrayBuffer();
    const { instance } = await WebAssembly.instantiate(wasmBuffer, {
        env: { abort: () => console.log("Abort!") }
    });

    const wasmInit = instance.exports.init as (s: number) => void;
    const wasmNext = instance.exports.next as () => number;

    wasmInit(SEED);

    // 3. Compare 1 Million Iterations
    console.log("🔄 Running 1,000,000 iterations...");
    const ITERATIONS = 1_000_000;
    let mismatched = false;

    for (let i = 0; i < ITERATIONS; i++) {
        const serverVal = serverPRNG.next();
        const clientVal = wasmNext() >>> 0; // Force unsigned comparison

        if (serverVal !== clientVal) {
            console.error(`❌ Mismatch at index ${i}`);
            console.error(`   Server: ${serverVal} (0x${serverVal.toString(16)})`);
            console.error(`   Client: ${clientVal} (0x${clientVal.toString(16)})`);
            mismatched = true;
            break;
        }
    }

    if (!mismatched) {
        console.log(`✅ SUCCESS: 1,000,000 iterations matched perfectly.`);
        console.log(`   Final Value: ${serverPRNG.next()}`);
    } else {
        process.exit(1);
    }
}

main();
