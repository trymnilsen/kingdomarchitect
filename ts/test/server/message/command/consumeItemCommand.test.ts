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

        const command = ConsumeItemCommand("primary", entity);

        assert.strictEqual(command.id, ConsumeItemCommandId);
        assert.strictEqual(command.id, "consumeItem");
    });

    it("stores slot type", () => {
        const entity = new Entity("player");

        const primaryCommand = ConsumeItemCommand("primary", entity);
        const secondaryCommand = ConsumeItemCommand("secondary", entity);

        assert.strictEqual(primaryCommand.slot, "primary");
        assert.strictEqual(secondaryCommand.slot, "secondary");
    });

    it("uses entity id from entity object", () => {
        const entity = new Entity("warrior1");

        const command = ConsumeItemCommand("primary", entity);

        assert.strictEqual(command.entity, "warrior1");
    });

    it("creates separate commands for different entities", () => {
        const entity1 = new Entity("player1");
        const entity2 = new Entity("player2");

        const command1 = ConsumeItemCommand("primary", entity1);
        const command2 = ConsumeItemCommand("primary", entity2);

        assert.strictEqual(command1.entity, "player1");
        assert.strictEqual(command2.entity, "player2");
    });
});
