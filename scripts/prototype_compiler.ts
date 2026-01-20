import { file, write } from "bun";
import { join } from "path";
import { unlinkSync, existsSync } from "node:fs";

// 1. Setup Paths
const RUNTIME_PKG = join(import.meta.dir, "../packages/tumbler-runtime");
const TEMPLATE_PATH = join(RUNTIME_PKG, "assembly/template.ts");
const OUTPUT_SRC_PATH = join(RUNTIME_PKG, "assembly/generated_client.ts");
const WASM_OUT_PATH = join(RUNTIME_PKG, "build/gen_client.wasm");

async function main() {
    console.log("🧪 Starting Prototype-1: Polymorphic Compilation");

    // 2. Generate a random "Game Secret"
    const secretKey = BigInt(Math.floor(Math.random() * 1_000_000));
    console.log(`🔑 Generated Secret: ${secretKey}`);

    // 3. Read Template & Inject
    const template = await file(TEMPLATE_PATH).text();
    // Use the valid placeholder: 0; // {{ SECRET_KEY }}
    const sourceCode = template.replace(/0;\s*\/\/\s*\{\{\s*SECRET_KEY\s*\}\}/, `${secretKey}; // Injected`);

    await write(OUTPUT_SRC_PATH, sourceCode);
    console.log(`📝 Wrote generated source to: ${OUTPUT_SRC_PATH}`);

    // 4. Compile using 'asc' (AssemblyScript Compiler)
    // We use the CLI via Bun.spawn
    const compileCmd = [
        "bun", "run", "asc",
        OUTPUT_SRC_PATH,
        "--target", "release",
        "--outFile", WASM_OUT_PATH,
        "--bindings", "esm"
    ];

    console.log(`⚙️  Compiling WASM...`);
    const proc = Bun.spawn(compileCmd, {
        cwd: RUNTIME_PKG,
        stdout: "inherit",
        stderr: "inherit"
    });

    const exitCode = await proc.exited;

    if (exitCode !== 0) {
        console.error("❌ Compilation Failed!");
        process.exit(1);
    }

    console.log(`✅ Compilation Success! WASM at: ${WASM_OUT_PATH}`);

    // 5. Validation: Load the WASM and check the secret
    console.log("🕵️  Verifying Binary...");
    const wasmBuffer = await file(WASM_OUT_PATH).arrayBuffer();

    let instanceRef: WebAssembly.Instance | null = null;

    const readString = (ptr: number) => {
        if (!instanceRef) return "Error: Instance not ready";
        const memory = instanceRef.exports.memory as WebAssembly.Memory;
        const view = new DataView(memory.buffer);
        // AS header: [ length (4 bytes) ] [ payload ... ]
        // ptr points to payload. Length is at ptr - 4.
        const length = view.getUint32(ptr - 4, true);
        const bytes = new Uint8Array(memory.buffer, ptr, length);
        return new TextDecoder("utf-16").decode(bytes);
    };

    const env = {
        abort: () => console.log("Abort!"),
        TriggerServerEvent: (ptr: number) => {
            console.log(`📡 [Server Event] ${readString(ptr)}`);
        },
        TriggerClientEvent: (ptr: number) => {
            console.log(`💻 [Client Event] ${readString(ptr)}`);
        }
    };

    // Instantiate
    const { instance } = await WebAssembly.instantiate(wasmBuffer, { env });
    instanceRef = instance;

    // Check exports
    const getSecret = instance.exports.getSecret as () => bigint;
    const roll = instance.exports.roll as (n: bigint) => bigint;
    const testEvents = instance.exports.testEvents as () => void;

    const actualSecret = getSecret();
    console.log(`🔍 WASM returned Secret: ${actualSecret}`);

    if (actualSecret === secretKey) {
        console.log("🎉 SUCCESS: Secret matches hardcoded value!");
    } else {
        console.error(`❌ FAILURE: Expected ${secretKey}, got ${actualSecret}`);
        process.exit(1);
    }

    const rolled = roll(100n);
    console.log(`🎲 Test Roll (100 ^ Key): ${rolled}`);

    console.log("📢 Testing Events...");
    testEvents();
}

main();
