import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    EquipItemCommand,
    EquipItemCommandId,
} from "../../../../src/server/message/command/equipItemCommand.ts";
import { swordItem, hammerItem } from "../../../../src/data/inventory/items/equipment.ts";

describe("EquipItemCommand", () => {
    it("creates command with correct id", () => {
        const entity = new Entity("player");

        const command = EquipItemCommand(swordItem, entity, "main");

        assert.strictEqual(command.id, EquipItemCommandId);
        assert.strictEqual(command.id, "equipItem");
    });

    it("uses item id from item object", () => {
        const entity = new Entity("player");

        const command = EquipItemCommand(swordItem, entity, "main");

        assert.strictEqual(command.itemId, swordItem.id);
    });

    it("uses entity id from entity object", () => {
        const entity = new Entity("warrior1");

        const command = EquipItemCommand(swordItem, entity, "main");

        assert.strictEqual(command.entity, "warrior1");
    });

    it("stores slot type", () => {
        const entity = new Entity("player");

        const mainCommand = EquipItemCommand(swordItem, entity, "main");
        const otherCommand = EquipItemCommand(hammerItem, entity, "other");

        assert.strictEqual(mainCommand.slot, "main");
        assert.strictEqual(otherCommand.slot, "other");
    });

    it("handles null item for unequip", () => {
        const entity = new Entity("player");

        const command = EquipItemCommand(null, entity, "main");

        assert.strictEqual(command.itemId, null);
        assert.strictEqual(command.slot, "main");
        assert.strictEqual(command.entity, "player");
    });

    it("creates separate commands for different slots", () => {
        const entity = new Entity("player");

        const command1 = EquipItemCommand(swordItem, entity, "main");
        const command2 = EquipItemCommand(hammerItem, entity, "other");

        assert.strictEqual(command1.slot, "main");
        assert.strictEqual(command2.slot, "other");
        assert.strictEqual(command1.itemId, swordItem.id);
        assert.strictEqual(command2.itemId, hammerItem.id);
    });
});
