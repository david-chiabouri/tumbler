// Generic Function Types
/**
 * A generic function type for Tumbler event handlers.
 * Can return a value of type T or a Promise resolving to T.
 */
export type TumblerFunction<T> = (...args: any[]) => T | Promise<T>;

/**
 * Represents a single event with a name and a handler function.
 * 
 * @template T The return type of the handler.
 */
export class TumblerEvent<T> {
    /**
     * Creates a new TumblerEvent.
     * 
     * @param {string} name - The unique name of the event.
     * @param {TumblerFunction<T>} handler - The function to be executed when the event is triggered.
     */
    constructor(
        public name: string,
        public handler: TumblerFunction<T>
    ) { }

    /**
     * Executes the event handler with the provided arguments.
     * 
     * @param {...any} args - Arguments to pass to the handler.
     * @returns {Promise<T>} The result of the handler execution.
     */
    public async execute(...args: any[]): Promise<T> {
        return await this.handler(...args);
    }
}

/**
 * Represents the state or result of an event execution.
 */
export type EventState<T> = {
    /** The return value of the event handler. */
    returns: T;
    /** Additional metadata associated with the event execution. */
    metadata: any;
};

/**
 * Manages a sequence of TumblerEvents that should be executed in order.
 */
export class ChainedTumblerEvent<T> {
    /**
     * Creates a new ChainedTumblerEvent.
     * 
     * @param {TumblerEvent<any>[]} handlers - An array of event handlers to execute sequentially.
     */
    constructor(public handlers: TumblerEvent<any>[]) { }

    /**
     * Runs all registered handlers in the chain sequentially.
     * 
     * @param {...any} args - Arguments to pass to each handler in the chain.
     */
    public async run(...args: any[]) {
        for (const handler of this.handlers) {
            await handler.execute(...args);
        }
    }
}