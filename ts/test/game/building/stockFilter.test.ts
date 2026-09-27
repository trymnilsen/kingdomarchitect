import assert from "node:assert";
import { describe, it } from "node:test";
import { equippablePredicate } from "../../../src/game/building/stockFilter.ts";
import type { StockEntry } from "../../../src/game/building/stockAggregate.ts";
import {
    type InventoryItem,
    ItemRarity,
} from "../../../src/data/inventory/inventoryItem.ts";
import { swordItem } from "../../../src/data/inventory/items/equipment.ts";
import {
    healthPotion,
    woodResourceItem,
} from "../../../src/data/inventory/items/resources.ts";

function makeEntry(item: InventoryItem): StockEntry {
    return {
        item,
        rarity: item.rarity ?? ItemRarity.Common,
        total: 1,
        sources: [],
    };
}

const sword = makeEntry(swordItem);
const wood = makeEntry(woodResourceItem);
const potion = makeEntry(healthPotion);

describe("equippablePredicate", () => {
    it("admits skill gear and consumables, rejects plain resources", () => {
        const predicate = equippablePredicate();
        assert.strictEqual(predicate.match(sword), true);
        assert.strictEqual(predicate.match(potion), true);
        assert.strictEqual(predicate.match(wood), false);
    });
});
