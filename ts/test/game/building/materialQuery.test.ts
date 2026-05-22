import assert from "node:assert";
import { describe, it } from "node:test";
import { getConstructionMaterialProgress } from "../../../src/game/building/materialQuery.ts";
import { createInventoryComponent } from "../../../src/game/component/inventoryComponent.ts";
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
