import assert from "node:assert";
import { describe, it } from "node:test";
import { isEquippableItem } from "../../../src/data/inventory/inventoryItemHelpers.ts";
import {
    ItemTag,
    type InventoryItem,
} from "../../../src/data/inventory/inventoryItem.ts";
import { torchItem } from "../../../src/data/inventory/items/equipment.ts";

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
});
