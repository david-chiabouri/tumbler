import { TumblerEvent } from "../../tumbler-server/src/event";


/**
 * TumblerServer manages server-side event registration and the WebSocket server lifecycle.
 * It provides a streamlined way to handle incoming client connections and events.
 */
export class TumblerServer {
    /**
     * A collection of registered server-side events.
     */
    public static Events: TumblerEvent<Function>[] = [];

    /**
     * Initializes a new instance of the TumblerServer and starts serving immediately.
     */
    constructor() {
        TumblerServer.serve();
    }

    /**
     * Registers a new event handler for a specific event name.
     * 
     * @template T The type of the handler function.
     * @param {string} name - The name of the event to register.
     * @param {T} handler - The function to execute when the event is triggered.
     */
    public static registerEvent<T extends Function>(name: string, handler: T) {
        TumblerServer.Events.push(new TumblerEvent<T>(name, handler));
    }

    /**
     * Starts the Bun server on the specified port.
     * Configures WebSocket handlers for connection, message, and closure events.
     * 
     * @param {number} [port=8080] - The port to listen on. Defaults to 8080.
     */
    public static serve(port: number = 8080) {
        Bun.serve({
            port: port,
            fetch(req) {
                return new Response("Hello World");
            },
            websocket: {
                open(ws) {
                    console.log("Client connected");
                },
                message(ws, message) {
                    console.log("Client sent: ", message);
                },
                close(ws) {
                    console.log("Client disconnected");
                },
            }
        });
    }
}