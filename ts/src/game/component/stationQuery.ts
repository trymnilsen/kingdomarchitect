import { pointEquals } from "../../common/point.ts";
import type { Entity } from "../entity/entity.ts";
import { StationComponentId, StationPriority } from "./stationComponent.ts";
import { RoleComponentId, WorkerRole } from "./worker/roleComponent.ts";
import { PlayerUnitComponentId } from "./playerUnitComponent.ts";

/**
 * Station occupancy, derived live from physical co-location — never a stored
 * reference, so nothing dangles when a worker dies or despawns. The single home for
 * "who is on which station", shared by the vision vantage, the garrison behavior,
 * the step-outside exemption, and the night watch, so those can never drift apart.
 *
 * Two predicates are deliberately distinct because the asymmetry is real:
 *  - {@link stationUnderEntity} is role-agnostic — *any* body on a station tile gets
 *    the manned-tower effects (and a future drafted worker will too).
 *  - {@link isManningStation} is role-gated — only an *intended occupant* (a Guard)
 *    of an *enabled* station is left in place; that narrowness is what makes a
 *    disabled station or an un-roled guard self-heal (StepOutside grounds them).
 */

/** The built station the entity is standing on, or null. */
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

/** The worker standing on this tower, or null (at most one — the tile is impassable). */
export function stationOccupant(root: Entity, tower: Entity): Entity | null {
    for (const [unit] of root.queryComponents(PlayerUnitComponentId)) {
        if (pointEquals(unit.worldPosition, tower.worldPosition)) {
            return unit;
        }
    }
    return null;
}

/** Whether any worker is manning this tower. */
export function isTowerManned(root: Entity, tower: Entity): boolean {
    return stationOccupant(root, tower) !== null;
}

/**
 * Whether this worker is the intended occupant of an *enabled* station it stands on.
 * v1: intended occupant == Guard. This is the single predicate the garrison behavior
 * (already manning → idle) and StepOutsideBehavior (don't ground a manning guard)
 * both read, and the one line drafting later broadens to "Guard or drafted-here".
 */
export function isManningStation(entity: Entity): boolean {
    const role = entity.getEcsComponent(RoleComponentId);
    if (role?.role !== WorkerRole.Guard) {
        return false;
    }
    const tower = stationUnderEntity(entity);
    if (!tower) {
        return false;
    }
    const station = tower.getEcsComponent(StationComponentId);
    return !!station && station.priority !== StationPriority.Off;
}
