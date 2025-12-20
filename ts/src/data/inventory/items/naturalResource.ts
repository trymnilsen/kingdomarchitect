import { sprites2, type Sprite2 } from "../../../asset/sprite.js";
import type { InventoryItem } from "../inventoryItem.js";
import {
    woodResourceItem,
    stoneResource as stoneInventoryItem,
} from "./resources.js";

export enum ResourceHarvestMode {
    Chop,
    Mine,
    Cut,
    Pick,
}

export type ResourceLifecycle =
    | { type: "Finite" } // removed permanently (trees)
    | { type: "Infinite" } // infinite nodes that reset after harvest (stone)
    | { type: "Regrow"; time: number; sprite?: Sprite2 } // renewable nodes (berries, grass)
    | { type: "Remove" }; // removed once (flowers, mushrooms)

export type ResourceYield = {
    item: InventoryItem;
    amount: number;
};

type Resource = {
    asset: Sprite2;
    id: string;
    name: string;
    harvestMode: ResourceHarvestMode | readonly ResourceHarvestMode[];
    lifecycle: ResourceLifecycle;
    yields: readonly ResourceYield[];
    /** Work duration in ticks for completing the harvest */
    workDuration?: number;
};

export const treeResource = {
    asset: sprites2.tree_1,
    id: "tree1",
    name: "Tree",
    harvestMode: ResourceHarvestMode.Chop,
    lifecycle: { type: "Finite" },
    yields: [{ item: woodResourceItem, amount: 4 }],
    workDuration: 1,
} as const;

export const pineResource = {
    asset: sprites2.pine_tree,
    id: "pineTree",
    name: "Pine Tree",
    harvestMode: ResourceHarvestMode.Chop,
    lifecycle: { type: "Finite" },
    yields: [{ item: woodResourceItem, amount: 4 }],
    workDuration: 1,
} as const;

export const snowTreeResource = {
    asset: sprites2.pine_tree_winter,
    id: "pineTreeSnow",
    name: "Pine Tree",
    harvestMode: ResourceHarvestMode.Chop,
    lifecycle: { type: "Finite" },
    yields: [{ item: woodResourceItem, amount: 4 }],
    workDuration: 1,
} as const;

export const swampTreeResource = {
    asset: sprites2.swamp_tree5,
    id: "swampTree1",
    name: "Swamp Tree",
    harvestMode: ResourceHarvestMode.Chop,
    lifecycle: { type: "Finite" },
    yields: [{ item: woodResourceItem, amount: 4 }],
    workDuration: 1,
} as const;

export const swampTree2Resource = {
    asset: sprites2.swamp_tree7,
    id: "swampTree2",
    name: "Swamp tree",
    harvestMode: ResourceHarvestMode.Chop,
    lifecycle: { type: "Finite" },
    yields: [{ item: woodResourceItem, amount: 4 }],
    workDuration: 1,
} as const;

export const swampFlowerResource = {
    asset: sprites2.swamp_flower_duo,
    id: "swampFlower",
    name: "Swamp Flower",
    harvestMode: ResourceHarvestMode.Pick,
    lifecycle: { type: "Remove" },
    yields: [], // Define actual flower yield later
    workDuration: 1,
} as const;

export const grassResource = {
    asset: sprites2.nature_grass_leaves,
    id: "grass",
    name: "Grass leaves",
    harvestMode: ResourceHarvestMode.Cut,
    lifecycle: {
        type: "Regrow",
        time: 100,
        sprite: sprites2.nature_grass_leaves,
    },
    yields: [], // Define actual grass yield later
    workDuration: 1,
} as const;

export const cactusResource = {
    asset: sprites2.desertCactus,
    id: "cactus1",
    name: "Cactus",
    harvestMode: ResourceHarvestMode.Chop,
    lifecycle: { type: "Finite" },
    yields: [{ item: woodResourceItem, amount: 2 }], // Cactus gives less wood
    workDuration: 1,
} as const;

export const cactusFlowerResource = {
    asset: sprites2.desertCactusFlower2,
    id: "cactusFlower",
    name: "Cactus Flower",
    harvestMode: ResourceHarvestMode.Pick,
    lifecycle: { type: "Remove" },
    yields: [], // Define actual flower yield later
    workDuration: 1,
} as const;

export const mushroomResource = {
    asset: sprites2.nature_mushroom2,
    id: "mushroom2",
    name: "Mushroom",
    harvestMode: ResourceHarvestMode.Pick,
    lifecycle: { type: "Remove" },
    yields: [], // Define actual mushroom yield later
    workDuration: 1,
} as const;

export const berryBushResource = {
    asset: sprites2.nature_berrybush,
    id: "berrybush",
    name: "Berry Bush",
    harvestMode: [ResourceHarvestMode.Pick, ResourceHarvestMode.Cut],
    lifecycle: {
        type: "Regrow",
        time: 200,
        sprite: sprites2.nature_berrybush_wo,
    },
    yields: [], // Define actual berry yield later
    workDuration: 1,
} as const;

export const flowerResource = {
    asset: sprites2.plainsFlower,
    id: "plainsFlower",
    name: "Flower",
    harvestMode: ResourceHarvestMode.Pick,
    lifecycle: { type: "Remove" },
    yields: [], // Define actual flower yield later
    workDuration: 1,
} as const;

export const snowFlowerResource = {
    asset: sprites2.snowFlower,
    id: "snowFlower",
    name: "Flower",
    harvestMode: ResourceHarvestMode.Pick,
    lifecycle: { type: "Remove" },
    yields: [], // Define actual flower yield later
    workDuration: 1,
} as const;

export const stoneResource = {
    asset: sprites2.stone,
    id: "stone1",
    name: "Stone",
    harvestMode: ResourceHarvestMode.Mine,
    lifecycle: { type: "Infinite" },
    yields: [{ item: stoneInventoryItem, amount: 2 }],
    workDuration: 3, // Mining takes longer
} as const;

export const NaturalResources = [
    swampTreeResource,
    swampTree2Resource,
    swampFlowerResource,
    snowFlowerResource,
    snowTreeResource,
    flowerResource,
    cactusFlowerResource,
    berryBushResource,
    mushroomResource,
    grassResource,
    treeResource,
    pineResource,
    stoneResource,
    cactusResource,
] as const satisfies Resource[];

export type NaturalResource = (typeof NaturalResources)[number];

// Resource registry for efficient lookup
const resourceRegistry = new Map<string, NaturalResource>();

// Initialize registry
for (const resource of NaturalResources) {
    resourceRegistry.set(resource.id, resource);
}

/**
 * Get a natural resource by its ID
 * @param id The resource ID (e.g., "tree1", "stone1")
 * @returns The resource definition or undefined if not found
 */
export function getResourceById(id: string): NaturalResource | undefined {
    return resourceRegistry.get(id);
}

/**
 * Check if a resource ID exists in the registry
 */
export function hasResource(id: string): boolean {
    return resourceRegistry.has(id);
}
