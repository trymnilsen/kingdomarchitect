import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    AttackCommand,
    AttackCommandId,
} from "../../../../src/server/message/command/attackTargetCommand.ts";

describe("AttackCommand", () => {
    it("creates command with correct id", () => {
        const target = new Entity("target1");
        const attacker = new Entity("attacker1");

        const command = AttackCommand(target, attacker);

        assert.strictEqual(command.id, AttackCommandId);
        assert.strictEqual(command.id, "attack");
    });

    it("uses entity IDs for target and attacker", () => {
        const target = new Entity("goblin1");
        const attacker = new Entity("warrior1");

        const command = AttackCommand(target, attacker);

        assert.strictEqual(command.target, "goblin1");
        assert.strictEqual(command.attacker, "warrior1");
    });

    it("creates separate commands for different targets", () => {
        const target1 = new Entity("enemy1");
        const target2 = new Entity("enemy2");
        const attacker = new Entity("player");

        const command1 = AttackCommand(target1, attacker);
        const command2 = AttackCommand(target2, attacker);

        assert.strictEqual(command1.target, "enemy1");
        assert.strictEqual(command2.target, "enemy2");
        assert.strictEqual(command1.attacker, command2.attacker);
    });
});
