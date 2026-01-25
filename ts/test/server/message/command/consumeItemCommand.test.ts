import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    ConsumeItemCommand,
    ConsumeItemCommandId,
} from "../../../../src/server/message/command/consumeItemCommand.ts";

describe("ConsumeItemCommand", () => {
    it("creates command with correct id", () => {
        const entity = new Entity("player");

        const command = ConsumeItemCommand("main", entity);

        assert.strictEqual(command.id, ConsumeItemCommandId);
        assert.strictEqual(command.id, "consumeItem");
    });

    it("stores slot type", () => {
        const entity = new Entity("player");

        const mainCommand = ConsumeItemCommand("main", entity);
        const otherCommand = ConsumeItemCommand("other", entity);

        assert.strictEqual(mainCommand.slot, "main");
        assert.strictEqual(otherCommand.slot, "other");
    });

    it("uses entity id from entity object", () => {
        const entity = new Entity("warrior1");

        const command = ConsumeItemCommand("main", entity);

        assert.strictEqual(command.entity, "warrior1");
    });

    it("creates separate commands for different entities", () => {
        const entity1 = new Entity("player1");
        const entity2 = new Entity("player2");

        const command1 = ConsumeItemCommand("main", entity1);
        const command2 = ConsumeItemCommand("main", entity2);

        assert.strictEqual(command1.entity, "player1");
        assert.strictEqual(command2.entity, "player2");
    });
});
