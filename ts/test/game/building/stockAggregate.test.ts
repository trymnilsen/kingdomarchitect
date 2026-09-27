import assert from "node:assert";
import { describe, it } from "node:test";
import {
    aggregateStock,
    entryFor,
    sourcesForId,
    stockEntries,
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
