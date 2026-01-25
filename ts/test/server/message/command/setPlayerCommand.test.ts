import assert from "node:assert";
import { describe, it } from "node:test";
import {
    SetPlayerCommand,
    SetPlayerCommandId,
} from "../../../../src/server/message/command/setPlayerCommand.ts";

describe("SetPlayerCommand", () => {
    it("creates command with correct id", () => {
        const command = SetPlayerCommand("agent1", {
            action: "move",
            targetPosition: { x: 100, y: 200 },
        });

        assert.strictEqual(command.id, SetPlayerCommandId);
        assert.strictEqual(command.id, "setPlayerCommand");
    });

    it("stores agent id", () => {
        const command = SetPlayerCommand("warrior1", {
            action: "move",
            targetPosition: { x: 0, y: 0 },
        });

        assert.strictEqual(command.agentId, "warrior1");
    });

    it("stores move command", () => {
        const command = SetPlayerCommand("agent1", {
            action: "move",
            targetPosition: { x: 100, y: 200 },
        });

        assert.strictEqual(command.command.action, "move");
        assert.deepStrictEqual(
            (command.command as any).targetPosition,
            { x: 100, y: 200 },
        );
    });

    it("stores attack command", () => {
        const command = SetPlayerCommand("agent1", {
            action: "attack",
            targetEntityId: "enemy1",
        });

        assert.strictEqual(command.command.action, "attack");
        assert.strictEqual((command.command as any).targetEntityId, "enemy1");
    });

    it("stores pickup command", () => {
        const command = SetPlayerCommand("agent1", {
            action: "pickup",
            targetEntityId: "item1",
        });

        assert.strictEqual(command.command.action, "pickup");
        assert.strictEqual((command.command as any).targetEntityId, "item1");
    });

    it("stores interact command", () => {
        const command = SetPlayerCommand("agent1", {
            action: "interact",
            targetEntityId: "npc1",
        });

        assert.strictEqual(command.command.action, "interact");
        assert.strictEqual((command.command as any).targetEntityId, "npc1");
    });

    it("creates separate commands for different agents", () => {
        const command1 = SetPlayerCommand("agent1", {
            action: "move",
            targetPosition: { x: 100, y: 100 },
        });
        const command2 = SetPlayerCommand("agent2", {
            action: "move",
            targetPosition: { x: 200, y: 200 },
        });

        assert.strictEqual(command1.agentId, "agent1");
        assert.strictEqual(command2.agentId, "agent2");
    });
});
