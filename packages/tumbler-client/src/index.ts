/**
 * The client-side library for Tumbler.
 * Handles WASM loading, WebSocket connection, and secure event emission.
 */
export class TumblerClient {
    private ws: WebSocket | null = null;
    private wasm: any = null;
    private seed: bigint = 0n;
    private lastBuffer: ArrayBuffer | null = null;

    // Public Events
    /** Optional callback invoked when the client is fully initialized and ready. */
    public onReady?: () => void;
    /** Optional callback invoked when an error occurs. */
    public onError?: (msg: string) => void;

    /**
     * Creates an instance of TumblerClient.
     * 
     * @param {string} wasmUrl - URL to the compiled .wasm file.
     * @param {string} wasmWsUrl - URL to the WebSocket endpoint (e.g., ws://localhost:8080/ws).
     */
    constructor(private wasmUrl: string, private wasmWsUrl: string) { }

    /**
     * Connects to the server.
     * Loads the WASM module and establishes the WebSocket connection.
     * 
     * @returns {Promise<void>} Resolves when the connection process initiates.
     */
    async connect() {
        console.log("[TumblerClient] Loading WASM:", this.wasmUrl);
        const response = await fetch(this.wasmUrl);
        const buffer = await response.arrayBuffer();

        const env = {
            abort: () => console.error("WASM Abort"),
            trace: (msg: number) => console.log("WASM Trace", msg),
            // Mock legacy imports
            TriggerServerEvent: () => { },
            TriggerClientEvent: () => { }
        };

        const { instance } = await WebAssembly.instantiate(buffer, { env });
        this.wasm = instance.exports;

        console.log("[TumblerClient] Connecting to WebSocket:", this.wasmWsUrl);
        this.ws = new WebSocket(this.wasmWsUrl);
        this.ws.binaryType = "arraybuffer";

        this.ws.onopen = () => {
            console.log("[TumblerClient] WebSocket Connected");
        };

        this.ws.onmessage = (event) => this.handleMessage(event);
    }

    /**
     * Handles incoming WebSocket messages.
     * Parses JSON messages for initialization and acknowledgments.
     * 
     * @param {MessageEvent} event - The message event received from the WebSocket.
     */
    private handleMessage(event: MessageEvent) {
        if (typeof event.data === "string") {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === "init") {
                    this.handleHandshake(BigInt(msg.seed));
                } else if (msg.type === "ack") {
                    console.log("[TumblerServer] Ack Token:", msg.token);
                } else if (msg.type === "error") {
                    if (this.onError) this.onError(msg.msg);
                    console.error("[TumblerServer] Error:", msg.msg);
                }
            } catch (e) {
                console.error("Failed to parse JSON message", e);
            }
        } else {
            console.log("Received Binary Message (Not implemented yet)");
        }
    }

    /**
     * Processes the handshake message from the server.
     * Initializes the WASM module with the received seed.
     * 
     * @param {bigint} seed - The seed provided by the server.
     */
    private handleHandshake(seed: bigint) {
        console.log(`[TumblerClient] Received Seed: ${seed}`);
        this.seed = seed;
        this.wasm.init(seed);
        console.log("[TumblerClient] WASM Initialized with Seed");
        if (this.onReady) this.onReady();
    }

    /**
     * Emits a secure event to the server.
     * Encapsulates data in a binary packet with a WASM-generated token.
     * 
     * @param {string} event - The name of the event to emit.
     * @param {any} data - The data payload to send.
     */
    public emit(event: string, data: any) {
        this.sendInternal(event, data);
    }

    /**
     * A helper method to trigger a test event.
     * 
     * @param {string} payload - The payload string to send.
     */
    public triggerEvent(payload: string) {
        // Backward compatibility / simplified testing
        this.emit("hello", payload);
    }

    /**
     * Internal method to construct and send the binary packet.
     * 
     * @param {string} event - The event name.
     * @param {any} data - The data payload.
     */
    private sendInternal(event: string, data: any) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error("WebSocket not connected");
            return;
        }

        const token = this.wasm.generateToken();

        // Wrap in JSON
        const payloadStr = JSON.stringify({ event, data });
        const payloadBytes = new TextEncoder().encode(payloadStr);

        // Protocol: [Type (1b)] [Token (8b)] [Payload (N)]
        const buffer = new ArrayBuffer(1 + 8 + payloadBytes.byteLength);
        const view = new DataView(buffer);

        view.setUint8(0, 1); // Type 1 = Event
        view.setBigUint64(1, token, true); // Little Endian

        const payloadView = new Uint8Array(buffer, 9);
        payloadView.set(payloadBytes);

        this.lastBuffer = buffer; // Capture for replay attack
        console.log(`[TumblerClient] Emitting '${event}': Token=${token}, Payload=${payloadStr}`);
        this.ws.send(buffer);
    }

    /**
     * Replays the last sent packet.
     * Intended for testing security mechanisms (replay attack detection).
     */
    public replayLastEvent() {
        if (!this.ws || !this.lastBuffer) {
            console.warn("No previously sent packet to replay.");
            return;
        }
        console.warn("⚠️ ATTACK: Replaying last packet...");
        this.ws.send(this.lastBuffer);
    }
}
