import { Database } from "bun:sqlite";
import { Xorshift128 } from "./utils/prng";

/**
 * Represents the state of a client session.
 */
export interface SessionState {
    /** Unique session identifier. */
    id: string;
    /** Shared secret for session security. */
    secret: bigint;
    /** Transaction sequence number (outbound). */
    tx_seq: number;
    /** Reception sequence number (inbound). */
    rx_seq: number;
    /** Timestamp of the last activity. */
    last_active: number;
}

/**
 * Manages session persistence and content using SQLite.
 * Handles creation, retrieval, and updates of session states.
 */
export class SessionManager {
    private db: Database;

    /**
     * Initializes the SessionManager with a specific database path.
     * 
     * @param {string} [dbPath="sessions.sqlite"] - storage path for the SQLite database.
     */
    constructor(dbPath: string = "sessions.sqlite") {
        this.db = new Database(dbPath, { create: true });
        this.init();
    }

    /**
     * Initializes the database schema if it doesn't already exist.
     * Creates the 'sessions' table.
     */
    private init() {
        this.db.run(`
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                secret BIGINT,
                tx_seq INTEGER,
                rx_seq INTEGER,
                last_active INTEGER
            )
        `);
    }

    /**
     * Creates a new session or replaces an existing one with initial state.
     * 
     * @param {string} id - The unique session ID.
     * @param {bigint} secret - The shared secret for the session.
     * @returns {SessionState} The newly created session state object.
     */
    public createSession(id: string, secret: bigint): SessionState {
        const state: SessionState = {
            id,
            secret,
            tx_seq: 0,
            rx_seq: 0,
            last_active: Date.now()
        };

        this.db.run(`
            INSERT OR REPLACE INTO sessions (id, secret, tx_seq, rx_seq, last_active)
            VALUES ($id, $secret, $tx_seq, $rx_seq, $last_active)
        `, {
            $id: state.id,
            $secret: state.secret,
            $tx_seq: state.tx_seq,
            $rx_seq: state.rx_seq,
            $last_active: state.last_active
        });

        return state;
    }

    /**
     * Retrieves a session state by its ID.
     * 
     * @param {string} id - The session ID to look up.
     * @returns {SessionState | null} The session state if found, otherwise null.
     */
    public getSession(id: string): SessionState | null {
        const row = this.db.query("SELECT * FROM sessions WHERE id = $id").get({ $id: id }) as any;
        if (!row) return null;

        return {
            id: row.id,
            secret: BigInt(row.secret),
            tx_seq: row.tx_seq,
            rx_seq: row.rx_seq,
            last_active: row.last_active
        };
    }

    /**
     * Updates the sequence numbers and activity timestamp for a session.
     * 
     * @param {string} id - The session ID to update.
     * @param {number} tx - The new transaction sequence number.
     * @param {number} rx - The new reception sequence number.
     */
    public updateSession(id: string, tx: number, rx: number) {
        this.db.run(`
            UPDATE sessions 
            SET tx_seq = $tx, rx_seq = $rx, last_active = $active 
            WHERE id = $id
        `, {
            $id: id,
            $tx: tx,
            $rx: rx,
            $active: Date.now()
        });
    }
}
