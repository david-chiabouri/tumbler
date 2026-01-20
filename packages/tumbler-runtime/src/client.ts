import { TumblerEvent } from "../../tumbler-server/src/event";

/**
 * TumblerClient handles client-side event registration and the initial handshake.
 * It serves as the entry point for utilizing Tumbler's features in a client environment.
 */
export class TumblerClient {
    /**
     * A list of registered events that the client handles.
     */
    public static Events: TumblerEvent<Function>[] = [];


    /**
     * Initiates the handshake process with the server.
     * 
     * @returns {boolean} True if the handshake was successful, false otherwise.
     */
    public static handshake(): boolean {

    }
}