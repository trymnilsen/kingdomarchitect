import assert from "node:assert";
import { describe, it } from "node:test";
import {
    applyStockPredicates,
    equipmentPredicate,
    equippablePredicate,
    type StockPredicate,
} from "../../../src/game/building/stockFilter.ts";
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

describe("equipmentPredicate", () => {
    it("admits SkillGear items and rejects plain resources", () => {
        const predicate = equipmentPredicate();
        assert.strictEqual(predicate.match(sword), true);
        assert.strictEqual(predicate.match(wood), false);
    });
});

describe("equippablePredicate", () => {
    it("admits skill gear and consumables, rejects plain resources", () => {
        const predicate = equippablePredicate();
        assert.strictEqual(predicate.match(sword), true);
        assert.strictEqual(predicate.match(potion), true);
        assert.strictEqual(predicate.match(wood), false);
    });
});

describe("applyStockPredicates", () => {
    it("returns every entry when there are no predicates", () => {
        assert.deepStrictEqual(applyStockPredicates([sword, wood], []), [
            sword,
            wood,
        ]);
    });

    it("keeps only entries satisfying every predicate", () => {
        const onlyWood: StockPredicate = {
            id: "id:wood",
            label: "Wood",
            dismissable: true,
            match: (entry) => entry.item.id === woodResourceItem.id,
        };

        // Equipment AND wood is unsatisfiable — no entry is both.
        assert.deepStrictEqual(
            applyStockPredicates(
                [sword, wood],
                [equipmentPredicate(), onlyWood],
            ),
            [],
        );
        assert.deepStrictEqual(
            applyStockPredicates([sword, wood], [equipmentPredicate()]),
            [sword],
        );
    });
});
