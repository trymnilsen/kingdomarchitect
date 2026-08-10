import assert from "node:assert";
import { describe, it } from "node:test";
import {
    getInventoryItemById,
    isEquippableItem,
} from "../../../src/data/inventory/inventoryItemHelpers.ts";
import {
    ItemTag,
    type InventoryItem,
} from "../../../src/data/inventory/inventoryItem.ts";
import {
    swordItem,
    torchItem,
} from "../../../src/data/inventory/items/equipment.ts";
import { woodResourceItem } from "../../../src/data/inventory/items/resources.ts";

describe("getInventoryItemById", () => {
    it("finds a raw resource", () => {
        const item = getInventoryItemById("wood");
        assert.strictEqual(item?.id, "wood");
    });

    it("finds a processed material", () => {
        // Regression: building materials like planks live outside `resources`,
        // so dismantle refunds silently dropped them when only resources were
        // searched.
        const item = getInventoryItemById("planks");
        assert.strictEqual(item?.id, "planks");
    });

    it("returns undefined for an unknown id", () => {
        assert.strictEqual(getInventoryItemById("does-not-exist"), undefined);
    });
});

describe("isEquippableItem", () => {
    it("accepts a light-granting item that is not skill gear", () => {
        // The torch is equippable because it grants light, not because it is
        // tagged as gear. Tagging it SkillGear to slip past a tag check would
        // make it teachable equipment it is not, so the rule keys off the
        // `light` field. Narrowing this back to a tag check silently breaks
        // equipping torches.
        const torch: InventoryItem = torchItem;
        assert.ok(
            !torch.tag?.includes(ItemTag.SkillGear),
            "torch is not skill gear",
        );
        assert.strictEqual(isEquippableItem(torch), true);
    });

    it("accepts ordinary skill gear", () => {
        assert.strictEqual(isEquippableItem(swordItem), true);
    });

    it("rejects a plain resource", () => {
        assert.strictEqual(isEquippableItem(woodResourceItem), false);
    });
});
