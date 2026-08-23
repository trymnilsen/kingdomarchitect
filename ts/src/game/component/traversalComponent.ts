import { BuildingComponentId } from "./buildingComponent.ts";
import type { Entity } from "../entity/entity.ts";

export type TraversalComponent = {
    id: typeof TraversalComponentId;
    weight: number;
};

export const TraversalComponentId = "Traversal" as const;

/**
 * Tiles whose traversal weight is below this threshold are considered
 * passable by isTileAvailable and similar availability checks.
 * Weights at or above this value are treated as solid/impassable.
 */
export const TRAVERSAL_IMPASSABLE_THRESHOLD = 50;

export function createTraversalComponent(weight: number): TraversalComponent {
    return {
        id: TraversalComponentId,
        weight,
    };
}

/** Weight used for a building that declares no walkability at all. */
export const SOLID_BUILDING_WEIGHT = 100;

/**
 * What it costs to walk over a building entity, or undefined if it is not a
 * building.
 *
 * Two sources, in order. A TraversalComponent wins, because a value that changes
 * at runtime (a gate opening) has to live on the entity. Otherwise the building
 * definition's own `traversalWeight` applies, which is where static walkability
 * belongs: a road is cheap and a farm is grudging no matter who built it.
 * Declaring neither means solid.
 */
export function getBuildingTraversalWeight(entity: Entity): number | undefined {
    const building = entity.getEcsComponent(BuildingComponentId);
    if (!building) {
        return undefined;
    }
    const traversal = entity.getEcsComponent(TraversalComponentId);
    if (traversal) {
        return traversal.weight;
    }
    return building.building.traversalWeight ?? SOLID_BUILDING_WEIGHT;
}

/**
 * Whether a building entity is a solid obstacle that movement must route around,
 * as opposed to a tile that can be walked over (roads, farms, an open gate) at
 * increased cost.
 *
 * There is no per-building exception: a road is passable because its definition
 * gives it a low weight, and a gate opens by having its weight lowered.
 *
 * This is the single source of truth for every consumer: the pathfinding graph
 * (so routes may be planned through passable structures), the movement step
 * check (so the mover actually steps onto them instead of failing), and
 * displacement scoring (so a shoved worker uses the same rule). They must never
 * diverge, or A* will plan a path the mover then refuses to walk.
 */
export function isImpassableStructure(entity: Entity): boolean {
    const weight = getBuildingTraversalWeight(entity);
    if (weight === undefined) {
        return false;
    }
    return weight >= TRAVERSAL_IMPASSABLE_THRESHOLD;
}
