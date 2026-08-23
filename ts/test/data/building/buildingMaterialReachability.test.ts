import assert from "node:assert";
import { describe, it } from "node:test";
import type { Building } from "../../../src/data/building/building.ts";
import { buildings } from "../../../src/data/building/buildings.ts";
import { craftingStations } from "../../../src/data/crafting/craftingStations.ts";
import { inventoryItems } from "../../../src/data/inventory/inventoryItems.ts";
import {
    getItemSources,
    getObtainableItemIds,
} from "../../../src/data/inventory/itemSources.ts";
import {
    charcoalItem,
    gearsItem,
    ironBarsItem,
} from "../../../src/data/inventory/items/processedMaterials.ts";

/** Every material id named by any building's requirements, with its building. */
function requiredMaterials(): { buildingId: string; materialId: string }[] {
    const required: { buildingId: string; materialId: string }[] = [];
    for (const building of buildings as readonly Building[]) {
        const materials = building.requirements?.materials ?? {};
        for (const materialId of Object.keys(materials)) {
            required.push({ buildingId: building.id, materialId });
        }
    }
    return required;
}

describe("building material reachability", () => {
    it("every building material can be produced from gathered inputs", () => {
        const obtainable = getObtainableItemIds();
        const unreachable = requiredMaterials()
            .filter(({ materialId }) => !obtainable.has(materialId))
            .map(({ buildingId, materialId }) => `${buildingId}:${materialId}`);

        assert.deepStrictEqual(
            unreachable,
            [],
            `Buildings requiring materials with no production path: ${unreachable.join(", ")}`,
        );
    });

    it("reaches items that need several crafting steps stacked on each other", () => {
        // Gears sit three deep: ore and wood are gathered, charcoal and planks
        // are made from them, iron bars are smelted from ore plus charcoal, and
        // only then can gears be cut. A closure that stopped after one pass
        // would call gears unreachable and the first test would pass vacuously
        // for anything that far down a chain.
        const obtainable = getObtainableItemIds();

        for (const item of [charcoalItem, ironBarsItem, gearsItem]) {
            const onlyCraftable = getItemSources(item.id).every(
                (source) => source.kind === "recipe",
            );
            assert.ok(
                onlyCraftable,
                `${item.id} should have to be crafted, not gathered`,
            );
            assert.ok(
                obtainable.has(item.id),
                `${item.id} should be reachable through crafting`,
            );
        }
    });

    it("every building material has a source the player can look up", () => {
        const undiscoverable = requiredMaterials()
            .filter(({ materialId }) => getItemSources(materialId).length === 0)
            .map(({ buildingId, materialId }) => `${buildingId}:${materialId}`);

        assert.deepStrictEqual(
            undiscoverable,
            [],
            `Materials the item-source screen reports as having no source: ${undiscoverable.join(", ")}`,
        );
    });

    it("every item in the registry can actually be obtained", () => {
        // Stronger than the building-material check above: an item nothing can
        // produce is a dead end whether or not a building happens to ask for
        // it. Adding an item with no recipe, resource, crop or loot entry
        // fails here.
        const obtainable = getObtainableItemIds();
        const orphaned = inventoryItems
            .filter((item) => !obtainable.has(item.id))
            .map((item) => item.id);

        assert.deepStrictEqual(
            orphaned,
            [],
            `Items with no way to obtain them: ${orphaned.join(", ")}`,
        );
    });

    it("every crafting station is a building that exists", () => {
        const buildingIds = new Set(buildings.map((building) => building.id));
        for (const station of craftingStations) {
            assert.ok(
                buildingIds.has(station.building.id),
                `crafting station ${station.building.id} is not a placeable building`,
            );
        }
    });
});
