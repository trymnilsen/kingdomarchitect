import assert from "node:assert";
import { describe, it } from "node:test";
import { EventEmitter } from "node:events";
import { ConnectionManager } from "../../src/server/connectionManager.ts";
import type { GameMessage } from "../../src/server/message/gameMessage.ts";

// Mock WebSocket that satisfies the subset of the ws interface we use
class MockWebSocket extends EventEmitter {
    readonly OPEN = 1;
    readonly CONNECTING = 0;
    readyState = 1; // OPEN
    sentMessages: string[] = [];
    closed = false;

    send(data: string) {
        this.sentMessages.push(data);
    }

    close() {
        this.closed = true;
        this.readyState = 3; // CLOSED
    }
}

// We need to cast because our mock doesn't implement the full WebSocket type,
// but it covers the methods and properties that ConnectionManager uses.
function mockSocket(): MockWebSocket {
    return new MockWebSocket();
}

describe("ConnectionManager", () => {
    it("adds and retrieves a connection", () => {
        const cm = new ConnectionManager();
        const ws = mockSocket();
        cm.addConnection("player1", ws as any);

        assert.strictEqual(cm.getConnection("player1"), ws);
        assert.deepStrictEqual(cm.getConnectedPlayerIds(), ["player1"]);
    });

    it("returns null for unknown player", () => {
        const cm = new ConnectionManager();
        assert.strictEqual(cm.getConnection("unknown"), null);
    });

    it("removes a connection and closes the socket", () => {
        const cm = new ConnectionManager();
        const ws = mockSocket();
        cm.addConnection("player1", ws as any);
        cm.removeConnection("player1");

        assert.strictEqual(cm.getConnection("player1"), null);
        assert.strictEqual(ws.closed, true);
    });

    it("replaces existing connection for same player", () => {
        const cm = new ConnectionManager();
        const ws1 = mockSocket();
        const ws2 = mockSocket();

        cm.addConnection("player1", ws1 as any);
        cm.addConnection("player1", ws2 as any);

        assert.strictEqual(cm.getConnection("player1"), ws2);
        assert.strictEqual(ws1.closed, true);
    });

    it("sends to a specific player", () => {
        const cm = new ConnectionManager();
        const ws = mockSocket();
        cm.addConnection("player1", ws as any);

        const message: GameMessage = {
            type: "transform",
            entity: "e1",
            position: { x: 10, y: 20 },
            oldPosition: { x: 5, y: 5 },
        };

        cm.sendTo("player1", message);

        assert.strictEqual(ws.sentMessages.length, 1);
        assert.deepStrictEqual(JSON.parse(ws.sentMessages[0]), message);
    });

    it("does not throw when sending to unknown player", () => {
        const cm = new ConnectionManager();
        const message: GameMessage = {
            type: "removeEntity",
            entity: "e1",
        };
        // Should not throw
        cm.sendTo("unknown", message);
    });

    it("broadcasts to all connected players", () => {
        const cm = new ConnectionManager();
        const ws1 = mockSocket();
        const ws2 = mockSocket();
        const ws3 = mockSocket();

        cm.addConnection("player1", ws1 as any);
        cm.addConnection("player2", ws2 as any);
        cm.addConnection("player3", ws3 as any);

        const message: GameMessage = {
            type: "removeEntity",
            entity: "e1",
        };

        cm.broadcast(message);

        const expected = JSON.stringify(message);
        assert.strictEqual(ws1.sentMessages.length, 1);
        assert.strictEqual(ws1.sentMessages[0], expected);
        assert.strictEqual(ws2.sentMessages.length, 1);
        assert.strictEqual(ws2.sentMessages[0], expected);
        assert.strictEqual(ws3.sentMessages.length, 1);
        assert.strictEqual(ws3.sentMessages[0], expected);
    });

    it("skips closed sockets during broadcast", () => {
        const cm = new ConnectionManager();
        const ws1 = mockSocket();
        const ws2 = mockSocket();
        ws2.readyState = 3; // CLOSED

        cm.addConnection("player1", ws1 as any);
        cm.addConnection("player2", ws2 as any);

        const message: GameMessage = {
            type: "removeEntity",
            entity: "e1",
        };

        cm.broadcast(message);

        assert.strictEqual(ws1.sentMessages.length, 1);
        assert.strictEqual(ws2.sentMessages.length, 0);
    });

    it("auto-removes connection on socket close event", () => {
        const cm = new ConnectionManager();
        const ws = mockSocket();
        cm.addConnection("player1", ws as any);

        // Simulate socket close
        ws.emit("close");

        assert.strictEqual(cm.getConnection("player1"), null);
        assert.deepStrictEqual(cm.getConnectedPlayerIds(), []);
    });
});
