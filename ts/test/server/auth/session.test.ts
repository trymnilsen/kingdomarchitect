import assert from "node:assert";
import { describe, it, beforeEach } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { applySQLiteMigrations } from "../../../src/server/persistence/sqliteMigrationCompiler.ts";
import { gameMigrations } from "../../../src/server/persistence/migration.ts";
import { authMigrations } from "../../../src/server/auth/authSchema.ts";
import {
    createSession,
    validateSession,
    deleteSession,
    cleanExpiredSessions,
    parseCookies,
} from "../../../src/server/auth/session.ts";

function createTestDb(): DatabaseSync {
    const db = new DatabaseSync(":memory:");
    applySQLiteMigrations(db, [...gameMigrations, ...authMigrations]);
    return db;
}

describe("Session Management", () => {
    let db: DatabaseSync;

    beforeEach(() => {
        db = createTestDb();
    });

    describe("createSession", () => {
        it("creates a session with a unique token", () => {
            const session = createSession(db, "player1", 3600_000);
            assert.ok(session.sessionId, "Session should have an ID");
            assert.strictEqual(session.playerId, "player1");
            assert.ok(session.expiresAt, "Session should have an expiry");
            assert.strictEqual(
                session.sessionId.length,
                64,
                "Token should be 32 bytes hex-encoded",
            );
        });

        it("creates distinct sessions for same player", () => {
            const s1 = createSession(db, "player1", 3600_000);
            const s2 = createSession(db, "player1", 3600_000);
            assert.notStrictEqual(s1.sessionId, s2.sessionId);
        });
    });

    describe("validateSession", () => {
        it("returns session for valid token", () => {
            const created = createSession(db, "player1", 3600_000);
            const validated = validateSession(db, created.sessionId);
            assert.ok(validated, "Session should be valid");
            assert.strictEqual(validated!.playerId, "player1");
        });

        it("returns null for unknown token", () => {
            const result = validateSession(db, "nonexistent-token");
            assert.strictEqual(result, null);
        });

        it("returns null for expired session", () => {
            // Create session that expires immediately
            const created = createSession(db, "player1", -1000);
            const result = validateSession(db, created.sessionId);
            assert.strictEqual(result, null);
        });
    });

    describe("deleteSession", () => {
        it("removes a session", () => {
            const created = createSession(db, "player1", 3600_000);
            deleteSession(db, created.sessionId);
            const result = validateSession(db, created.sessionId);
            assert.strictEqual(result, null);
        });
    });

    describe("cleanExpiredSessions", () => {
        it("removes expired sessions and keeps valid ones", () => {
            createSession(db, "expired-player", -1000);
            const valid = createSession(db, "valid-player", 3600_000);

            cleanExpiredSessions(db);

            // Valid session should still work
            const result = validateSession(db, valid.sessionId);
            assert.ok(result, "Valid session should survive cleanup");
            assert.strictEqual(result!.playerId, "valid-player");

            // Count remaining sessions
            const count = db
                .prepare("SELECT COUNT(*) as cnt FROM sessions")
                .get() as { cnt: number };
            assert.strictEqual(
                count.cnt,
                1,
                "Only the valid session should remain",
            );
        });
    });
});

describe("parseCookies", () => {
    it("parses simple cookie header", () => {
        const cookies = parseCookies("session=abc123; theme=dark");
        assert.strictEqual(cookies["session"], "abc123");
        assert.strictEqual(cookies["theme"], "dark");
    });

    it("handles empty string", () => {
        const cookies = parseCookies("");
        assert.deepStrictEqual(cookies, {});
    });

    it("handles cookie values with equals signs", () => {
        const cookies = parseCookies("token=abc=def=ghi");
        assert.strictEqual(cookies["token"], "abc=def=ghi");
    });

    it("trims whitespace", () => {
        const cookies = parseCookies("  session = abc123 ; theme = dark ");
        assert.strictEqual(cookies["session"], "abc123");
        assert.strictEqual(cookies["theme"], "dark");
    });
});
