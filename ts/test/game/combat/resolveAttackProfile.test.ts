import assert from "node:assert";
import { describe, it } from "node:test";
import type { InventoryItem } from "../../../src/data/inventory/inventoryItem.ts";
import {
    bowItem,
    swordItem,
    torchItem,
} from "../../../src/data/inventory/items/equipment.ts";
import { resolveAttackProfile } from "../../../src/game/combat/resolveAttackProfile.ts";
import { createEquipmentComponent } from "../../../src/game/component/equipmentComponent.ts";
import { Entity } from "../../../src/game/entity/entity.ts";

function makeFighter(
    primary: InventoryItem | null = null,
    secondary: InventoryItem | null = null,
): Entity {
    const fighter = new Entity("fighter");
    const equipment = createEquipmentComponent();
    equipment.slots.primary = primary;
    equipment.slots.secondary = secondary;
    fighter.setEcsComponent(equipment);
    return fighter;
}

const brokenWeapon: InventoryItem = {
    id: "brokenWeapon",
    name: "Broken weapon",
    asset: swordItem.asset,
    attack: "noSuchProfile",
};

describe("resolveAttackProfile", () => {
    it("takes the profile of whatever weapon is equipped", () => {
        const archer = makeFighter(bowItem);

        assert.strictEqual(resolveAttackProfile(archer).id, "bow");
    });

    it("prefers the main hand when both hands hold a weapon", () => {
        const fighter = makeFighter(swordItem, bowItem);

        assert.strictEqual(
            resolveAttackProfile(fighter).id,
            "sword",
            "which hand holds the weapon is the player's choice about how to fight",
        );
    });

    it("falls through to the off hand when the main hand holds no weapon", () => {
        const fighter = makeFighter(torchItem, bowItem);

        assert.strictEqual(resolveAttackProfile(fighter).id, "bow");
    });

    it("skips past an unknown profile to a weapon that still resolves", () => {
        const fighter = makeFighter(brokenWeapon, bowItem);

        assert.strictEqual(resolveAttackProfile(fighter).id, "bow");
    });
});
