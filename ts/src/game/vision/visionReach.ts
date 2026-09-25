import type { Entity } from "../entity/entity.ts";
import { BuildingComponentId } from "../component/buildingComponent.ts";
import { belongsToPlayerKingdom } from "../component/kingdomComponent.ts";
import { VisibilityComponentId } from "../component/visibilityComponent.ts";

/** How far a manned watchtower's searchlight reaches, in tiles */
export const STATION_MANNED_REACH = 8;

/**
 * How far a worker sees around itself, in tiles. Carrying a light does not
 * change this, the light adds its own footprint on top
 */
export const WORKER_VISION_REACH = 2;

/**
 * How far a building sees on its own, in tiles. A building holds a place and
 * does not survey the land around it like a worker does
 */
export const BUILDING_VISION_REACH = 1;

/**
 * Whether an entity reveals the map for the player right now. It needs vision,
 * can't be a scaffold and has to belong to the player, since goblin buildings
 * use the same prefab and would otherwise reveal land too
 */
export function canReveal(entity: Entity): boolean {
    if (!entity.hasComponent(VisibilityComponentId)) {
        return false;
    }
    if (entity.getEcsComponent(BuildingComponentId)?.scaffolded) {
        return false;
    }
    return belongsToPlayerKingdom(entity);
}

export function visionReachRadius(entity: Entity): number {
    const visibility = entity.getEcsComponent(VisibilityComponentId);
    if (!visibility) {
        return 0;
    }
    return visibility.baseReach;
}
