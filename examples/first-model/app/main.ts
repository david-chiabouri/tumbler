import { TumblerClient } from "@tumbler/client";

// Initialize Client
const client = new TumblerClient("/client.wasm", `ws://${location.host}/ws`);

client.onReady = () => {
    log("System", "Ready to trigger events.");
};

client.onError = (msg) => {
    log("Error", msg);
};

client.connect();

// UI Exports
(window as any).triggerEvent = () => {
    const input = document.getElementById("payloadInput") as HTMLInputElement;
    client.triggerEvent(input.value || "Default Payload");
};

(window as any).replayEvent = () => {
    client.replayLastEvent();
};

function log(source: string, message: string) {
    const logEl = document.getElementById("log");
    if (logEl) {
        logEl.innerHTML += `<div><strong>${source}:</strong> ${message}</div>`;
        logEl.scrollTop = logEl.scrollHeight;
    }
}
