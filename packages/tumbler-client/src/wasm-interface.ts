import type { TumblerEvent, TumblerFunction } from "packages/tumbler-server/src/event";

export type ServerConfiguration = {
    network: {
        host: string;
        port: number;
    },
    keys: {
        [key: string]: string;
    },
    routes: {
        important: {
            [key: string]: string;
        },
        [key: string]: string | { [key: string]: string };
    }
}

// Declare the external Tumbler runtime that will be available in the environment
declare const Tumbler: {
    TriggerServerEvent: (event: string, data: any) => void;
    TriggerClientEvent: (event: string, data: any) => void;
    init: (seed: bigint) => void;
};

export interface IWASM {
    serverEvents: Record<string, TumblerEvent<TumblerFunction<any>>>;
    clientEvents: Record<string, TumblerEvent<TumblerFunction<any>>>;

    TriggerServerEvent: (event: string, data: any) => any;
    TriggerClientEvent: (event: string, data: any) => any;

    init: (seed: bigint) => void;
    unpack: (buffer: ArrayBuffer) => any;
    pack: (event: string, data: any) => ArrayBuffer;
    generateToken: () => bigint;
    encryptedEventEmitter: (event: string, data: any) => void;
}

export class TumblerWebAssemblyLibrary implements IWASM {
    public static readonly _SERVER: ServerConfiguration = {
        network: {
            host: "localhost",
            port: 8080,
        },
        keys: {},
        routes: {
            important: {}
        }
    };

    public serverEvents!: Record<string, TumblerEvent<TumblerFunction<any>>>;
    public clientEvents!: Record<string, TumblerEvent<TumblerFunction<any>>>;

    public TriggerServerEvent(event: string, data: any) {
        // Delegate to the global Tumbler runtime found in the environment
        if (typeof Tumbler !== 'undefined') {
            return Tumbler.TriggerServerEvent(event, data);
        } else {
            console.warn("Tumbler runtime not found.");
        }
    }

    public TriggerClientEvent(event: string, data: any) {
        if (typeof Tumbler !== 'undefined') {
            return Tumbler.TriggerClientEvent(event, data);
        }
    }

    public init(seed: bigint) {
        if (typeof Tumbler !== 'undefined') {
            Tumbler.init(seed);
        }
    }

    public unpack!: (buffer: ArrayBuffer) => any;
    public pack!: (event: string, data: any) => ArrayBuffer;
    public generateToken!: () => bigint;
    public encryptedEventEmitter!: (event: string, data: any) => void;
}