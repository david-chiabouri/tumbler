import { TumblerEvent } from "../../tumbler-server/src/event";

/**
 * Definition for a registered event, mapping a name to a specific TumblerEvent instance.
 */
export type EventRegister = {
    /** The unique name of the event. */
    name: string;
    /** The actual event instance containing the handler. */
    event: TumblerEvent<any>;
}

/**
 * Central event bus for the Tumbler runtime.
 * Facilitates the triggering of events between server and client contexts.
 */
export class Tumbler {
    private static ServerEvents: EventRegister[] = [];
    private static ClientEvents: EventRegister[] = [];

    /**
     * Triggers a specific server-side event with a payload.
     * 
     * @param {string} name - The name of the server event to trigger.
     * @param {...any} payload - Arguments to be passed to the event handler.
     */
    public static TriggerServerEvent(name: string, ...payload: any) {
        const event = Tumbler.ServerEvents.find(e => e.name === name);
        if (event) {
            event.event.handler(...payload);
        }
    }

    /**
     * Triggers a specific client-side event with a payload.
     * 
     * @param {string} name - The name of the client event to trigger.
     * @param {...any} payload - Arguments to be passed to the event handler.
     */
    public static TriggerClientEvent(name: string, ...payload: any) {
        const event = Tumbler.ClientEvents.find(e => e.name === name);
        if (event) {
            event.event.handler(...payload);
        }
    }

}