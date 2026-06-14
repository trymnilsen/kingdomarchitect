import assert from "node:assert";
import { describe, it } from "node:test";
import {
    aggregateStock,
    entryFor,
    sourcesForId,
    stockEntries,
    totalForId,
} from "../../../src/game/building/stockAggregate.ts";
import { createInventoryComponent } from "../../../src/game/component/inventoryComponent.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import {
    type InventoryItem,
    ItemRarity,
} from "../../../src/data/inventory/inventoryItem.ts";
import type { InventoryItemQuantity } from "../../../src/data/inventory/inventoryItemQuantity.ts";
import {
    stoneResource,
    woodResourceItem,
} from "../../../src/data/inventory/items/resources.ts";

const commonWood: InventoryItem = woodResourceItem;
const rareWood: InventoryItem = {
    ...woodResourceItem,
    rarity: ItemRarity.Rare,
};

function stockpile(id: string, items: InventoryItemQuantity[]): Entity {
    const entity = new Entity(id);
    entity.setEcsComponent(createInventoryComponent(items));
    return entity;
}

describe("aggregateStock", () => {
    it("sums one item across stockpiles and records each source", () => {
        const a = stockpile("a", [{ item: commonWood, amount: 4 }]);
        const b = stockpile("b", [{ item: commonWood, amount: 6 }]);

        const aggregate = aggregateStock([a, b]);
        const entry = entryFor(aggregate, "wood", ItemRarity.Common)!;

        assert.strictEqual(entry.total, 10);
        assert.strictEqual(entry.sources.length, 2);
        const fromSources = entry.sources.reduce((s, src) => s + src.amount, 0);
        assert.strictEqual(fromSources, entry.total);
        assert.deepStrictEqual(
            entry.sources.map((src) => [src.entity.id, src.amount]).sort(),
            [
                ["a", 4],
                ["b", 6],
            ],
        );
    });

    it("keeps different rarities of the same id as separate entries", () => {
        const a = stockpile("a", [
            { item: commonWood, amount: 5 },
            { item: rareWood, amount: 3 },
        ]);

        const aggregate = aggregateStock([a]);

        assert.strictEqual(stockEntries(aggregate).length, 2);
        assert.strictEqual(
            entryFor(aggregate, "wood", ItemRarity.Common)!.total,
            5,
        );
        assert.strictEqual(
            entryFor(aggregate, "wood", ItemRarity.Rare)!.total,
            3,
        );
    });

    it("totalForId sums across rarities", () => {
        const a = stockpile("a", [
            { item: commonWood, amount: 5 },
            { item: rareWood, amount: 3 },
        ]);

        assert.strictEqual(totalForId(aggregateStock([a]), "wood"), 8);
    });

    it("sourcesForId merges a stockpile that holds several rarities", () => {
        const a = stockpile("a", [
            { item: commonWood, amount: 5 },
            { item: rareWood, amount: 3 },
        ]);
        const b = stockpile("b", [{ item: commonWood, amount: 2 }]);

        const sources = sourcesForId(aggregateStock([a, b]), "wood");

        assert.deepStrictEqual(
            sources.map((src) => [src.entity.id, src.amount]).sort(),
            [
                ["a", 8],
                ["b", 2],
            ],
        );
    });

    it("ignores empty stacks and stockpiles without an inventory", () => {
        const a = stockpile("a", [
            { item: commonWood, amount: 0 },
            { item: stoneResource, amount: 7 },
        ]);
        const b = new Entity("b");

        const aggregate = aggregateStock([a, b]);

        assert.strictEqual(
            entryFor(aggregate, "wood", ItemRarity.Common),
            undefined,
        );
        assert.strictEqual(
            entryFor(aggregate, "stone", ItemRarity.Common)!.total,
            7,
        );
        assert.strictEqual(stockEntries(aggregate).length, 1);
    });
});
