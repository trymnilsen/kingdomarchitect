import { spriteRefs, type SpriteRef } from "../../../asset/sprite.ts";
import type { InventoryItem } from "../inventoryItem.ts";
import {
    woodResourceItem,
    stoneResource as stoneInventoryItem,
    berryItem,
    moonpetalItem,
    mushroomFoodItem,
} from "./resources.ts";

export const ResourceHarvestMode = {
    Chop: 0,
    Mine: 1,
    Cut: 2,
    Pick: 3,
} as const;

export type ResourceHarvestMode =
    (typeof ResourceHarvestMode)[keyof typeof ResourceHarvestMode];

export type ResourceLifecycle =
    | { type: "Finite" } // removed permanently (trees)
    | { type: "Infinite" } // infinite nodes that reset after harvest (stone)
    | { type: "Regrow"; time: number; sprite?: SpriteRef } // renewable nodes (berries, grass)
    | { type: "Remove" }; // removed once (flowers, mushrooms)

export type ResourceYield = {
    item: InventoryItem;
    amount: number;
};

/**
 * How a resource occupies its tile.
 * - "blocking" (default): adds path weight and blocks building placement.
 * - "decorative": adds no path weight, never blocks building placement, and is
 *   removed when a building is placed on its tile. Must have a passable
 *   lifecycle (Regrow/Remove), never Finite/Infinite.
 */
export type ResourceFootprint = "blocking" | "decorative";

type Resource = {
    asset: SpriteRef;
    id: string;
    name: string;
    harvestMode: ResourceHarvestMode | readonly ResourceHarvestMode[];
    lifecycle: ResourceLifecycle;
    yields: readonly ResourceYield[];
    /** Work duration in ticks for completing the harvest */
    workDuration?: number;
    footprint?: ResourceFootprint;
};

/**
 * The common tree, and the yardstick the wood economy is measured in. One of
 * every building costs roughly 1,700 wood once the plank, frame and joinery
 * chains are resolved, so this yield decides how much of a playthrough is spent
 * felling. It matches the swamp trees.
 */
export const treeResource = {
    asset: spriteRefs.tree_1,
    id: "tree1",
    name: "Tree",
    harvestMode: ResourceHarvestMode.Chop,
    lifecycle: { type: "Finite" },
    yields: [{ item: woodResourceItem, amount: 8 }],
    workDuration: 1,
} as const;

export const pineResource = {
    asset: spriteRefs.pine_tree,
    id: "pineTree",
    name: "Pine Tree",
    harvestMode: ResourceHarvestMode.Chop,
    lifecycle: { type: "Finite" },
    yields: [{ item: woodResourceItem, amount: 8 }],
    workDuration: 1,
} as const;

export const snowTreeResource = {
    asset: spriteRefs.pine_tree_winter,
    id: "pineTreeSnow",
    name: "Pine Tree",
    harvestMode: ResourceHarvestMode.Chop,
    lifecycle: { type: "Finite" },
    yields: [{ item: woodResourceItem, amount: 12 }],
    workDuration: 1,
} as const;

export const swampTreeResource = {
    asset: spriteRefs.swamp_tree5,
    id: "swampTree1",
    name: "Swamp Tree",
    harvestMode: ResourceHarvestMode.Chop,
    lifecycle: { type: "Finite" },
    yields: [{ item: woodResourceItem, amount: 8 }],
    workDuration: 1,
} as const;

export const swampTree2Resource = {
    asset: spriteRefs.swamp_tree7,
    id: "swampTree2",
    name: "Swamp tree",
    harvestMode: ResourceHarvestMode.Chop,
    lifecycle: { type: "Finite" },
    yields: [{ item: woodResourceItem, amount: 8 }],
    workDuration: 1,
} as const;

export const swampFlowerResource = {
    asset: spriteRefs.swamp_flower_duo,
    id: "swampFlower",
    name: "Swamp Flower",
    harvestMode: ResourceHarvestMode.Pick,
    lifecycle: { type: "Remove" },
    yields: [{ item: berryItem, amount: 1 }],
    workDuration: 1,
} as const;

export const grassResource = {
    asset: spriteRefs.nature_grass_leaves,
    id: "grass",
    name: "Grass leaves",
    harvestMode: ResourceHarvestMode.Cut,
    lifecycle: {
        type: "Regrow",
        time: 100,
        sprite: spriteRefs.nature_grass_leaves,
    },
    yields: [], // Define actual grass yield later
    workDuration: 1,
    footprint: "decorative",
} as const;

export const cactusResource = {
    asset: spriteRefs.desertCactus,
    id: "cactus1",
    name: "Cactus",
    harvestMode: ResourceHarvestMode.Chop,
    lifecycle: { type: "Finite" },
    yields: [{ item: woodResourceItem, amount: 2 }], // Cactus gives less wood
    workDuration: 1,
} as const;

export const cactusFlowerResource = {
    asset: spriteRefs.desertCactusFlower2,
    id: "cactusFlower",
    name: "Cactus Flower",
    harvestMode: ResourceHarvestMode.Pick,
    lifecycle: { type: "Remove" },
    yields: [{ item: berryItem, amount: 1 }],
    workDuration: 1,
} as const;

export const mushroomResource = {
    asset: spriteRefs.nature_mushroom2,
    id: "mushroom2",
    name: "Mushroom",
    harvestMode: ResourceHarvestMode.Pick,
    lifecycle: { type: "Remove" },
    yields: [{ item: mushroomFoodItem, amount: 1 }],
    workDuration: 1,
} as const;

export const berryBushResource = {
    asset: spriteRefs.nature_berrybush,
    id: "berrybush",
    name: "Berry Bush",
    harvestMode: [ResourceHarvestMode.Pick, ResourceHarvestMode.Cut],
    lifecycle: {
        type: "Regrow",
        time: 200,
        sprite: spriteRefs.nature_berrybush_wo,
    },
    yields: [{ item: berryItem, amount: 2 }],
    workDuration: 1,
} as const;

export const flowerResource = {
    asset: spriteRefs.plainsFlower,
    id: "plainsFlower",
    name: "Flower",
    harvestMode: ResourceHarvestMode.Pick,
    lifecycle: { type: "Remove" },
    yields: [{ item: berryItem, amount: 1 }],
    workDuration: 1,
} as const;

export const snowFlowerResource = {
    asset: spriteRefs.snowFlower,
    id: "snowFlower",
    name: "Flower",
    harvestMode: ResourceHarvestMode.Pick,
    lifecycle: { type: "Remove" },
    yields: [], // Define actual flower yield later
    workDuration: 1,
} as const;

/**
 * The gathered half of the magic economy. Moonpetal regrows rather than being
 * consumed, so a settlement can keep an enchanter supplied without fighting for
 * it. The other half, gems, only comes off dead goblins.
 */
export const moonpetalResource = {
    asset: spriteRefs.plainsFlower2,
    // A node id names the node, not the item it yields, the way tree1 yields
    // wood.
    id: "moonpetal1",
    name: "Moonpetal",
    harvestMode: ResourceHarvestMode.Pick,
    lifecycle: {
        type: "Regrow",
        time: 150,
        sprite: spriteRefs.plainsFlower3,
    },
    yields: [{ item: moonpetalItem, amount: 2 }],
    workDuration: 2,
    footprint: "decorative",
} as const;

export const stoneResource = {
    asset: spriteRefs.stone,
    id: "stone1",
    name: "Stone",
    harvestMode: ResourceHarvestMode.Mine,
    lifecycle: { type: "Infinite" },
    yields: [{ item: stoneInventoryItem, amount: 10 }],
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
    moonpetalResource,
    grassResource,
    treeResource,
    pineResource,
    stoneResource,
    cactusResource,
] as const satisfies Resource[];

export type NaturalResource = (typeof NaturalResources)[number];

const resourceRegistry = new Map<string, NaturalResource>();

for (const resource of NaturalResources) {
    const definition: Resource = resource;
    if (
        definition.footprint === "decorative" &&
        (definition.lifecycle.type === "Finite" ||
            definition.lifecycle.type === "Infinite")
    ) {
        throw new Error(
            `Decorative resource "${definition.id}" must have a passable lifecycle (Regrow/Remove)`,
        );
    }
    resourceRegistry.set(resource.id, resource);
}

export function getResourceById(id: string): NaturalResource | undefined {
    return resourceRegistry.get(id);
}

/**
 * Returns true if the resource blocks movement: trees, stone, cacti, and similar
 * large objects. Lifecycle "Finite" (trees) and "Infinite" (stone) mark solid
 * obstacles. Regrowable and removable resources (grass, flowers, mushrooms) are
 * treated as passable.
 */
export function isImpassableResource(resourceId: string): boolean {
    const resource = getResourceById(resourceId);
    if (!resource) return false;
    const { type } = resource.lifecycle;
    return type === "Finite" || type === "Infinite";
}

/**
 * A clearable obstacle is an impassable resource that is removed from the world
 * when destroyed, meaning "Finite" nodes like trees. A worker may chop through one
 * to clear a path, after which the tile is permanently passable.
 */
export function isClearableObstacle(resourceId: string): boolean {
    if (!isImpassableResource(resourceId)) return false;
    const resource = getResourceById(resourceId)!;
    return resource.lifecycle.type === "Finite";
}

/**
 * A permanent obstacle is an impassable resource that is never removed by
 * clearing, meaning "Infinite" nodes like stone. Pathfinding must route around
 * these. A worker only ever approaches them to mine, never to pass through.
 */
export function isPermanentObstacle(resourceId: string): boolean {
    return isImpassableResource(resourceId) && !isClearableObstacle(resourceId);
}

/**
 * A decorative resource (grass and similar) adds no path weight, never blocks
 * building placement, and is removed when a building is placed on its tile.
 */
export function isDecorativeResource(resourceId: string): boolean {
    const resource: Resource | undefined = getResourceById(resourceId);
    return resource?.footprint === "decorative";
}

const BLOCKING_RESOURCE_PATH_WEIGHT = 30;

/** Extra path weight a resource adds to its tile. 0 = no contribution. */
export function getResourcePathWeight(resourceId: string): number {
    return isDecorativeResource(resourceId) ? 0 : BLOCKING_RESOURCE_PATH_WEIGHT;
}
