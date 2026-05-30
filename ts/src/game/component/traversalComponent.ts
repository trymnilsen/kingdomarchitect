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

/**
 * Whether a building entity is a solid obstacle that movement must route around,
 * as opposed to a tile that can be walked over (roads, farms) at increased cost.
 *
 * Roads are always passable. Any other building is passable only if it carries a
 * TraversalComponent whose weight is below the impassable threshold; without one,
 * or at/above the threshold, the building is treated as a wall.
 *
 * This is the single source of truth shared by the pathfinding graph (so routes
 * may be planned through passable structures) and the movement step check (so the
 * mover actually steps onto them instead of failing). The two must never diverge,
 * or A* will plan a path the mover then refuses to walk.
 */
export function isImpassableStructure(entity: Entity): boolean {
    const building = entity.getEcsComponent(BuildingComponentId);
    if (!building || building.building.id === "road") {
        return false;
    }
    const traversal = entity.getEcsComponent(TraversalComponentId);
    return !traversal || traversal.weight >= TRAVERSAL_IMPASSABLE_THRESHOLD;
}
