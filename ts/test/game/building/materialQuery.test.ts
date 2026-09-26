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
});

describe("getTotalItemInStockpiles", () => {
    function rootWithStockpile(): Entity {
        const root = new Entity("root");
        const stockpile = new Entity("stock");
        // The same item id held in two rarities gives separate stacks, as the
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
        stockpile.setEcsComponent(createStockpileComponent(200));
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
