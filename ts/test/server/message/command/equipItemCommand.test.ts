import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    EquipItemCommand,
    EquipItemCommandId,
} from "../../../../src/server/message/command/equipItemCommand.ts";
import {
    swordItem,
    hammerItem,
} from "../../../../src/data/inventory/items/equipment.ts";

describe("EquipItemCommand", () => {
    it("creates command with correct id", () => {
        const entity = new Entity("player");

        const command = EquipItemCommand(
            entity,
            "stockpile-1",
            swordItem.id,
            "primary",
        );

        assert.strictEqual(command.id, EquipItemCommandId);
        assert.strictEqual(command.id, "equipItem");
    });

    it("captures source, item, slot and entity", () => {
        const entity = new Entity("warrior1");

        const command = EquipItemCommand(
            entity,
            "stockpile-7",
            swordItem.id,
            "primary",
        );

        assert.strictEqual(command.entity, "warrior1");
        assert.strictEqual(command.sourceEntityId, "stockpile-7");
        assert.strictEqual(command.itemId, swordItem.id);
        assert.strictEqual(command.slot, "primary");
    });

    it("supports both primary and secondary slots", () => {
        const entity = new Entity("player");

        const primaryCommand = EquipItemCommand(
            entity,
            "stockpile",
            swordItem.id,
            "primary",
        );
        const secondaryCommand = EquipItemCommand(
            entity,
            "stockpile",
            hammerItem.id,
            "secondary",
        );

        assert.strictEqual(primaryCommand.slot, "primary");
        assert.strictEqual(secondaryCommand.slot, "secondary");
        assert.strictEqual(primaryCommand.itemId, swordItem.id);
        assert.strictEqual(secondaryCommand.itemId, hammerItem.id);
    });
});
