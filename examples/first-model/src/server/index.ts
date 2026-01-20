import { join } from "path";
import { file } from "bun";
import { TumblerServer } from "@tumbler/server/src/server"; // Import from the file we just made

const BUILD_DIR = join(import.meta.dir, "../../build");
const APP_DIR = join(import.meta.dir, "../../app");
const WASM_PATH = join(BUILD_DIR, "client.wasm");
const PUBLIC_DIR = join(import.meta.dir, "../../public");

async function main() {
    console.log("🚀 Starting Seamless Server...");

    // 1. Build Client JS (Helper logic, normally in CLI)
    console.log("📦 Bundling Client JS...");
    await Bun.build({
        entrypoints: [join(APP_DIR, "main.ts")],
        outdir: PUBLIC_DIR,
        naming: "[name].js"
    });

    // 2. Initialize Tumbler Server
    const server = new TumblerServer({
        wasmPath: WASM_PATH,
        port: 8080,
        staticHandler: (req) => {
            const url = new URL(req.url);
            if (url.pathname === "/") return new Response(file(join(APP_DIR, "index.html")));
            if (url.pathname === "/main.js") return new Response(file(join(PUBLIC_DIR, "main.js")));
            if (url.pathname === "/client.wasm") return new Response(file(WASM_PATH));
            return new Response("Not Found", { status: 404 });
        }
    });

    // 3. Register Events
    server.on("hello", (data, session) => {
        console.log("✨ Received 'hello' event:", data);
    });

    server.on("hello", (data) => {
        console.log("🔗 Chained handler also ran!");
    });

    // 4. Start
    // Note: We need to handle static files too. 
    // The current TumblerServer implementation (Step 1) hardcoded /ws path but didn't expose custom fetch handler for static files easily.
    // I should have allowed a custom fetch handler in config.
    // For now, let's just make sure the Refactoring step supported it or I edit it now.
    // ... Actually the previous tool call replaced `Bun.serve` entirely inside `listen()`. 
    // And it returned "Tumbler Server Running" for non-ws paths. 
    // This breaks static file serving!
    // I must fix TumblerServer to allow static file serving or just duplicate the logic for this prototype.
    // Let's modify TumblerServer in the next step to allow a fallback fetch handler.

    await server.listen();
}

main();
