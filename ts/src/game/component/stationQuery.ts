import { pointEquals } from "../../common/point.ts";
import type { Entity } from "../entity/entity.ts";
import { StationComponentId, StationPriority } from "./stationComponent.ts";
import { WorkerRole } from "./worker/roleComponent.ts";
import { getRoleRank } from "./worker/rolePriority.ts";
import { PlayerUnitComponentId } from "./playerUnitComponent.ts";

/**
 * The built station the entity is standing on, or null.
 */
export function stationUnderEntity(entity: Entity): Entity | null {
    // A tower never counts as standing on itself.
    if (entity.getEcsComponent(StationComponentId)) {
        return null;
    }
    for (const [tower] of entity
        .getRootEntity()
        .queryComponents(StationComponentId)) {
        if (pointEquals(tower.worldPosition, entity.worldPosition)) {
            return tower;
        }
    }
    return null;
}

/**
 * The worker standing on this tower, or null
 * (at most one, the tile is impassable).
 */
export function stationOccupant(root: Entity, tower: Entity): Entity | null {
    for (const [unit] of root.queryComponents(PlayerUnitComponentId)) {
        if (pointEquals(unit.worldPosition, tower.worldPosition)) {
            return unit;
        }
    }
    return null;
}

/**
 * Whether any worker is manning this tower.
 */
export function isTowerManned(root: Entity, tower: Entity): boolean {
    return stationOccupant(root, tower) !== null;
}

/**
 * Check if an entity should man the station
 */
export function isManningStation(entity: Entity): boolean {
    if (getRoleRank(entity, WorkerRole.Guard) < 0) {
        return false;
    }
    const tower = stationUnderEntity(entity);
    if (!tower) {
        return false;
    }
    const station = tower.getEcsComponent(StationComponentId);
    return !!station && station.priority !== StationPriority.Off;
}
