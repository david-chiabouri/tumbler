import { join, resolve } from "path";
import { file } from "bun";

/**
 * Compiles the client interface into WebAssembly (WASM).
 * 
 * This function locates the client entry point, sets up the build directory,
 * and executes the AssemblyScript compiler (asc) via Bun.
 * 
 * @param {string} [projectRoot=process.cwd()] - The root directory of the project.
 */
export async function build(projectRoot: string = process.cwd()) {
    const PROJECT_ROOT = resolve(projectRoot);
    const CLIENT_ENTRY = join(PROJECT_ROOT, "src/client/index.ts");
    const BUILD_DIR = join(PROJECT_ROOT, "build");
    const WASM_OUT = join(BUILD_DIR, "client.wasm");

    console.log(`🏗️  Building Client WASM for ${PROJECT_ROOT}...`);

    // Ensure build dir exists
    // Creates a .gitkeep file to ensure the directory is tracked/created
    if (!(await file(BUILD_DIR).exists())) {
        await Bun.write(join(BUILD_DIR, ".gitkeep"), "");
    }

    // Construct the compilation command for AssemblyScript
    const compileCmd = [
        "bun", "run", "asc",
        CLIENT_ENTRY,
        "--target", "release",
        "--outFile", WASM_OUT,
        "--bindings", "esm",
        "--exportRuntime"
    ];

    // Spawn the compiler process
    const proc = Bun.spawn(compileCmd, {
        cwd: PROJECT_ROOT,
        stdout: "inherit",
        stderr: "inherit"
    });

    const exitCode = await proc.exited;
    if (exitCode !== 0) {
        console.error("❌ Build Failed");
        process.exit(1);
    }
    console.log(`✅ Build Success: ${WASM_OUT}`);
}
