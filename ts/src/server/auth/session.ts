import { randomBytes } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";

export type Session = {
    sessionId: string;
    playerId: string;
    expiresAt: string;
};

/**
 * Creates a new session for a player with the given duration.
 * Returns the session object including the generated token.
 */
export function createSession(
    db: DatabaseSync,
    playerId: string,
    durationMs: number,
): Session {
    const sessionId = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + durationMs).toISOString();

    db.prepare(
        "INSERT INTO sessions (session_id, player_id, expires_at) VALUES (?, ?, ?)",
    ).run(sessionId, playerId, expiresAt);

    return { sessionId, playerId, expiresAt };
}

/**
 * Validates a session token. Returns the session if valid and not expired,
 * or null otherwise.
 */
export function validateSession(
    db: DatabaseSync,
    sessionId: string,
): Session | null {
    const row = db
        .prepare(
            "SELECT session_id, player_id, expires_at FROM sessions WHERE session_id = ?",
        )
        .get(sessionId) as
        | { session_id: string; player_id: string; expires_at: string }
        | undefined;

    if (!row) {
        return null;
    }

    if (new Date(row.expires_at) <= new Date()) {
        // Session expired — clean it up
        db.prepare("DELETE FROM sessions WHERE session_id = ?").run(sessionId);
        return null;
    }

    return {
        sessionId: row.session_id,
        playerId: row.player_id,
        expiresAt: row.expires_at,
    };
}

/**
 * Deletes a specific session.
 */
export function deleteSession(db: DatabaseSync, sessionId: string): void {
    db.prepare("DELETE FROM sessions WHERE session_id = ?").run(sessionId);
}

/**
 * Removes all sessions that have passed their expiry time.
 */
export function cleanExpiredSessions(db: DatabaseSync): void {
    db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(
        new Date().toISOString(),
    );
}

/**
 * Parses a raw HTTP Cookie header string into key-value pairs.
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    for (const pair of cookieHeader.split(";")) {
        const eqIndex = pair.indexOf("=");
        if (eqIndex === -1) {
            continue;
        }
        const key = pair.substring(0, eqIndex).trim();
        const value = pair.substring(eqIndex + 1).trim();
        cookies[key] = value;
    }
    return cookies;
}
