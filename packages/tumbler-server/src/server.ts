import { file } from "bun";
import { TumblerEvent, type TumblerFunction } from "./event";
import { TumblerValidator } from "./validator";

/**
 * The main server class for the Tumbler framework.
 * Handles WebSocket connections, event dispatching, and security validation via WASM.
 */
export class TumblerServer {
    // Registry now supports arrays of handlers for chaining
    private serverEvents: Map<string, TumblerFunction<any>[]> = new Map();
    private validatorFactory: TumblerValidator | null = null;

    /**
     * Creates a new TumblerServer instance.
     * 
     * @param config - The server configuration object.
     * @param config.wasmPath - Path to the compiled WASM module for validation.
     * @param config.port - The port number to listen on.
     * @param {Function} [config.staticHandler] - Optional handler for HTTP requests not matching the WebSocket path.
     */
    constructor(private config: {
        wasmPath: string,
        port: number,
        staticHandler?: (req: Request) => Response | Promise<Response>
    }) { }

    /**
     * Registers an event handler for a specific event name.
     * Supports chaining: calling on() multiple times adds multiple handlers.
     * 
     * @template T - The type of the handler's return value.
     * @param {string} name - The name of the event to listen for.
     * @param {TumblerFunction<T>} handler - The function to execute when the event is triggered.
     */
    public on<T>(name: string, handler: TumblerFunction<T>) {
        if (!this.serverEvents.has(name)) {
            this.serverEvents.set(name, []);
        }
        this.serverEvents.get(name)!.push(handler);
    }

    /**
     * Starts the server.
     * Initializes the WASM validator and sets up the Bun server for WebSocket and HTTP handling.
     */
    public async listen() {
        console.log(`[TumblerServer] Starting on port ${this.config.port}...`);

        // Initialize WASM Validator
        this.validatorFactory = new TumblerValidator(this.config.wasmPath);
        await this.validatorFactory.load();

        Bun.serve({
            port: this.config.port,
            fetch: async (req, server) => {
                const url = new URL(req.url);
                if (url.pathname === "/ws") {
                    const seed = BigInt(Math.floor(Math.random() * 1000000));
                    const validator = await this.validatorFactory!.createSession(seed);

                    if (server.upgrade(req, { data: { seed, validator } })) {
                        return;
                    }
                    return new Response("Upgrade failed", { status: 500 });
                }

                // Static Fallback
                if (this.config.staticHandler) {
                    return this.config.staticHandler(req);
                }

                return new Response("Tumbler Server Running", { status: 200 });
            },
            websocket: {
                open: (ws) => {
                    const { seed } = ws.data as any;
                    ws.send(JSON.stringify({ type: "init", seed: seed.toString() }));
                },
                message: async (ws, message) => {
                    if (message instanceof ArrayBuffer || message instanceof Buffer) {
                        await this.handlePacket(ws, message instanceof Buffer ? message.buffer : message as ArrayBuffer);
                    }
                }
            }
        });
    }

    /**
     * Handles incoming binary packets from the WebSocket.
     * Decodes the packet, validates the session token, and triggers the appropriate event.
     * 
     * @param {any} ws - The WebSocket connection instance.
     * @param {ArrayBuffer} buffer - The raw binary data received.
     */
    private async handlePacket(ws: any, buffer: ArrayBuffer) {
        const view = new DataView(buffer);
        // Protocol: [Type(1)][Token(8)][Payload(...)]
        const type = view.getUint8(0);

        if (type === 1) { // Event
            const token = view.getBigUint64(1, true); // Little Endian
            const validator = ws.data.validator;
            const expectedToken = validator.generateToken();

            if (token === expectedToken) {
                // Decode Payload (JSON for seamless API)
                const payloadBytes = new Uint8Array(buffer, 9);
                const payloadStr = new TextDecoder().decode(payloadBytes);

                try {
                    const { event, data } = JSON.parse(payloadStr);
                    await this.trigger(event, ws, data);

                    // Ack
                    ws.send(JSON.stringify({ type: "ack", status: "ok", token: token.toString() }));
                } catch (e) {
                    console.error("Failed to parse event payload", e);
                }
            } else {
                console.error(`[Security] Invalid Token! Expected ${expectedToken}, got ${token}.`);
                ws.send(JSON.stringify({ type: "error", msg: "Invalid Token" }));
                ws.close();
            }
        }
    }

    /**
     * Triggers registered handlers for a given event.
     * 
     * @param {string} eventName - The name of the event to trigger.
     * @param {any} session - The client session associated with the event.
     * @param {any} data - The data payload accompanying the event.
     */
    private async trigger(eventName: string, session: any, data: any) {
        const handlers = this.serverEvents.get(eventName);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    // We pass session and data. 
                    // To be seamless, handler definition should probably be (data, session).
                    await handler(data, session);
                } catch (e) {
                    console.error(`Error in handler for ${eventName}:`, e);
                }
            }
        } else {
            console.warn(`No handler for event: ${eventName}`);
        }
    }
}