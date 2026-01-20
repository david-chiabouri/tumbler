// ../../packages/tumbler-client/src/index.ts
class TumblerClient {
  wasmUrl;
  wsUrl;
  ws = null;
  wasm = null;
  seed = 0n;
  lastBuffer = null;
  onReady;
  onError;
  constructor(wasmUrl, wsUrl) {
    this.wasmUrl = wasmUrl;
    this.wsUrl = wsUrl;
  }
  async connect() {
    console.log("[TumblerClient] Loading WASM:", this.wasmUrl);
    const response = await fetch(this.wasmUrl);
    const buffer = await response.arrayBuffer();
    const env = {
      abort: () => console.error("WASM Abort"),
      trace: (msg) => console.log("WASM Trace", msg),
      TriggerServerEvent: () => {},
      TriggerClientEvent: () => {}
    };
    const { instance } = await WebAssembly.instantiate(buffer, { env });
    this.wasm = instance.exports;
    console.log("[TumblerClient] Connecting to WebSocket:", this.wsUrl);
    this.ws = new WebSocket(this.wsUrl);
    this.ws.binaryType = "arraybuffer";
    this.ws.onopen = () => {
      console.log("[TumblerClient] WebSocket Connected");
    };
    this.ws.onmessage = (event) => this.handleMessage(event);
  }
  handleMessage(event) {
    if (typeof event.data === "string") {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "init") {
          this.handleHandshake(BigInt(msg.seed));
        } else if (msg.type === "ack") {
          console.log("[TumblerServer] Ack Token:", msg.token);
        } else if (msg.type === "error") {
          if (this.onError)
            this.onError(msg.msg);
          console.error("[TumblerServer] Error:", msg.msg);
        }
      } catch (e) {
        console.error("Failed to parse JSON message", e);
      }
    } else {
      console.log("Received Binary Message (Not implemented yet)");
    }
  }
  handleHandshake(seed) {
    console.log(`[TumblerClient] Received Seed: ${seed}`);
    this.seed = seed;
    this.wasm.init(seed);
    console.log("[TumblerClient] WASM Initialized with Seed");
    if (this.onReady)
      this.onReady();
  }
  triggerEvent(payload) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }
    const token = this.wasm.generateToken();
    const payloadBytes = new TextEncoder().encode(payload);
    const buffer = new ArrayBuffer(1 + 8 + payloadBytes.byteLength);
    const view = new DataView(buffer);
    view.setUint8(0, 1);
    view.setBigUint64(1, token, true);
    const payloadView = new Uint8Array(buffer, 9);
    payloadView.set(payloadBytes);
    this.lastBuffer = buffer;
    console.log(`[TumblerClient] Sending Event: Token=${token}, Payload="${payload}"`);
    this.ws.send(buffer);
  }
  replayLastEvent() {
    if (!this.ws || !this.lastBuffer) {
      console.warn("No previously sent packet to replay.");
      return;
    }
    console.warn("⚠️ ATTACK: Replaying last packet...");
    this.ws.send(this.lastBuffer);
  }
}

// app/main.ts
var client = new TumblerClient("/client.wasm", `ws://${location.host}/ws`);
client.onReady = () => {
  log("System", "Ready to trigger events.");
};
client.onError = (msg) => {
  log("Error", msg);
};
client.connect();
window.triggerEvent = () => {
  const input = document.getElementById("payloadInput");
  client.triggerEvent(input.value || "Default Payload");
};
window.replayEvent = () => {
  client.replayLastEvent();
};
function log(source, message) {
  const logEl = document.getElementById("log");
  if (logEl) {
    logEl.innerHTML += `<div><strong>${source}:</strong> ${message}</div>`;
    logEl.scrollTop = logEl.scrollHeight;
  }
}
