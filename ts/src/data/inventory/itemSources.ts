import type { SpriteRef } from "../../asset/sprite.ts";
import type { CraftingRecipe } from "../crafting/craftingRecipe.ts";
import { craftingStations } from "../crafting/craftingStations.ts";
import { cropDefinitions } from "../crop/cropDefinitions.ts";
import { lootTables } from "../loot/lootTable.ts";
import { inventoryItems } from "./inventoryItems.ts";
import { NaturalResources } from "./items/naturalResource.ts";

export type ItemSourceRecipe = {
    kind: "recipe";
    recipe: CraftingRecipe;
    buildingName: string;
};

export type ItemSourceResource = {
    kind: "resource";
    resourceName: string;
    resourceAsset: SpriteRef;
    amount: number;
};

export type ItemSourceProduction = {
    kind: "production";
    productionName: string;
    buildingName: string;
    amount: number;
};

export type ItemSourceLoot = {
    kind: "loot";
    sourceName: string;
    amount: number;
};

export type ItemSource =
    | ItemSourceRecipe
    | ItemSourceResource
    | ItemSourceProduction
    | ItemSourceLoot;

/**
 * Returns all known ways to obtain an item: crafting recipes, natural
 * resources, farm crops, and loot.
 */
export function getItemSources(itemId: string): ItemSource[] {
    const sources: ItemSource[] = [];

    // Crafting recipes whose outputs include this item
    for (const station of craftingStations) {
        for (const recipe of station.recipes) {
            if (recipe.outputs.some((o) => o.item.id === itemId)) {
                sources.push({
                    kind: "recipe",
                    recipe,
                    buildingName: station.building.name,
                });
            }
        }
    }

    // Natural resources that yield this item
    for (const resource of NaturalResources) {
        for (const y of resource.yields) {
            if (y.item.id === itemId) {
                sources.push({
                    kind: "resource",
                    resourceName: resource.name,
                    resourceAsset: resource.asset,
                    amount: y.amount,
                });
            }
        }
    }

    // Crops a farm can be set to grow. Driven off the crop definitions so a new
    // crop is discoverable the moment it exists, rather than only wheat being
    // listed while flax and straw look unobtainable.
    for (const crop of cropDefinitions) {
        if (crop.itemId === itemId) {
            sources.push({
                kind: "production",
                productionName: `Grow ${crop.name}`,
                buildingName: "Farm",
                amount: crop.yieldAmount,
            });
        }
    }

    // Creatures that carry the item and leave it behind when killed
    for (const table of lootTables) {
        for (const drop of table.drops) {
            if (drop.item.id === itemId) {
                sources.push({
                    kind: "loot",
                    sourceName: table.sourceName,
                    amount: drop.amount,
                });
            }
        }
    }

    return sources;
}

/**
 * Every item a settlement can end up holding, worked out by taking what the
 * world hands over directly and then applying recipes until nothing new can be
 * made.
 *
 * Built on {@link getItemSources} rather than walking the recipe and resource
 * tables again, so there is one enumeration of where things come from and a new
 * kind of source is picked up here for free. Anything that is not a recipe
 * counts as directly obtainable.
 *
 * An item missing from the returned set is unreachable, which means it is
 * either content nobody can ever get or a dead end in a build order.
 */
export function getObtainableItemIds(): Set<string> {
    const obtainable = new Set<string>();
    const recipesByOutput = new Map<string, ItemSourceRecipe[]>();

    for (const item of inventoryItems) {
        const sources = getItemSources(item.id);
        const recipes = sources.filter(
            (source): source is ItemSourceRecipe => source.kind === "recipe",
        );
        if (recipes.length < sources.length) {
            obtainable.add(item.id);
        }
        if (recipes.length > 0) {
            recipesByOutput.set(item.id, recipes);
        }
    }

    let grew = true;
    while (grew) {
        grew = false;
        for (const [itemId, recipes] of recipesByOutput) {
            if (obtainable.has(itemId)) continue;
            const canBeMade = recipes.some((source) =>
                source.recipe.inputs.every((input) =>
                    obtainable.has(input.item.id),
                ),
            );
            if (canBeMade) {
                obtainable.add(itemId);
                grew = true;
            }
        }
    }

    return obtainable;
}
