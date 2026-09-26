import assert from "node:assert";
import { describe, it } from "node:test";
import {
    goblinLootTable,
    rollLootDrops,
    type LootTable,
} from "../../../src/data/loot/lootTable.ts";
import {
    bagOfGlitter,
    gemResource,
    goldCoins,
} from "../../../src/data/inventory/items/resources.ts";

/** A roll sequence, consumed in order, so each drop's test is deterministic. */
function rollsOf(...values: number[]): () => number {
    let index = 0;
    return () => values[index++];
}

describe("loot rolls", () => {
    it("treats the chance as exclusive at its own value", () => {
        // A roll exactly equal to the chance must miss, otherwise a 0-chance
        // drop would land on a 0 roll.
        const table: LootTable = {
            id: "test",
            sourceName: "Test",
            drops: [{ item: bagOfGlitter, amount: 1, chance: 0.05 }],
        };

        assert.deepStrictEqual(rollLootDrops(table, rollsOf(0.05)), []);
        assert.strictEqual(rollLootDrops(table, rollsOf(0.049)).length, 1);
    });

    it("rolls each chance drop independently", () => {
        const landed = rollLootDrops(goblinLootTable, rollsOf(0.01, 0.01));
        assert.deepStrictEqual(
            landed.map((drop) => drop.item.id),
            [goldCoins.id, gemResource.id, bagOfGlitter.id],
        );
    });
});
