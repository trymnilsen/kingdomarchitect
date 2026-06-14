import assert from "node:assert";
import { describe, it } from "node:test";
import {
    getConstructionMaterialProgress,
    getTotalItemInStockpiles,
} from "../../../src/game/building/materialQuery.ts";
import { createInventoryComponent } from "../../../src/game/component/inventoryComponent.ts";
import { createStockpileComponent } from "../../../src/game/component/stockpileComponent.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { ItemRarity } from "../../../src/data/inventory/inventoryItem.ts";
import type { BuildingRequirements } from "../../../src/data/building/building.ts";
import {
    goldCoins,
    stoneResource,
    woodResourceItem,
} from "../../../src/data/inventory/items/resources.ts";
import { timberFramesItem } from "../../../src/data/inventory/items/processedMaterials.ts";

const requirements: BuildingRequirements = {
    materials: {
        [woodResourceItem.id]: 40,
        [stoneResource.id]: 60,
        [goldCoins.id]: 2,
        [timberFramesItem.id]: 20,
    },
};

describe("getConstructionMaterialProgress", () => {
    it("pairs delivered amounts with their requirement", () => {
        const inventory = createInventoryComponent([
            { item: woodResourceItem, amount: 40 },
            { item: stoneResource, amount: 12 },
            { item: timberFramesItem, amount: 1 },
        ]);

        const progress = getConstructionMaterialProgress(
            inventory,
            requirements,
        );

        const byId = new Map(progress.map((p) => [p.item.id, p]));
        assert.deepStrictEqual(
            { provided: byId.get(woodResourceItem.id)!.provided, required: 40 },
            { provided: 40, required: 40 },
        );
        assert.deepStrictEqual(
            { provided: byId.get(stoneResource.id)!.provided, required: 60 },
            { provided: 12, required: 60 },
        );
        assert.strictEqual(byId.get(goldCoins.id)!.provided, 0);
        assert.strictEqual(byId.get(timberFramesItem.id)!.provided, 1);
    });

    it("clamps the delivered amount to the requirement", () => {
        const inventory = createInventoryComponent([
            { item: goldCoins, amount: 9 },
        ]);

        const progress = getConstructionMaterialProgress(
            inventory,
            requirements,
        );
        const gold = progress.find((p) => p.item.id === goldCoins.id)!;

        assert.strictEqual(gold.provided, 2);
        assert.strictEqual(gold.required, 2);
    });

    it("treats a missing inventory as zero delivered for every material", () => {
        const progress = getConstructionMaterialProgress(
            undefined,
            requirements,
        );

        assert.strictEqual(progress.length, 4);
        assert.ok(progress.every((p) => p.provided === 0));
    });

    it("skips requirements with a non-positive amount", () => {
        const progress = getConstructionMaterialProgress(undefined, {
            materials: {
                [woodResourceItem.id]: 40,
                [stoneResource.id]: 0,
            },
        });

        assert.strictEqual(progress.length, 1);
        assert.strictEqual(progress[0].item.id, woodResourceItem.id);
    });

    it("skips unknown item ids", () => {
        const progress = getConstructionMaterialProgress(undefined, {
            materials: {
                [woodResourceItem.id]: 40,
                ["not_a_real_item" as never]: 5,
            },
        });

        assert.strictEqual(progress.length, 1);
        assert.strictEqual(progress[0].item.id, woodResourceItem.id);
    });

    it("returns an empty list when there are no material requirements", () => {
        assert.deepStrictEqual(
            getConstructionMaterialProgress(undefined, undefined),
            [],
        );
        assert.deepStrictEqual(
            getConstructionMaterialProgress(undefined, { materials: {} }),
            [],
        );
    });
});

describe("getTotalItemInStockpiles", () => {
    function rootWithStockpile(): Entity {
        const root = new Entity("root");
        const stockpile = new Entity("stock");
        // The same item id held in two rarities — separate stacks, as the
        // inventory stacks by (id, rarity).
        stockpile.setEcsComponent(
            createInventoryComponent([
                { item: woodResourceItem, amount: 5 },
                {
                    item: { ...woodResourceItem, rarity: ItemRarity.Rare },
                    amount: 3,
                },
            ]),
        );
        stockpile.setEcsComponent(createStockpileComponent());
        root.addChild(stockpile);
        return root;
    }

    it("sums an item across rarities when no rarity is given", () => {
        // Regression guard for the under-count bug: reading a single stack
        // would have returned 5, not the full 8.
        assert.strictEqual(
            getTotalItemInStockpiles(rootWithStockpile(), woodResourceItem.id),
            8,
        );
    });

    it("counts only the requested rarity when one is given", () => {
        assert.strictEqual(
            getTotalItemInStockpiles(
                rootWithStockpile(),
                woodResourceItem.id,
                ItemRarity.Rare,
            ),
            3,
        );
    });
});
