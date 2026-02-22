/**
 * Displacement cost model — Phase 1 implementation.
 *
 * The functions in this file are deliberately isolated so that Phase 2
 * (tickToken social currency) can replace `getDisplacementResistance` and
 * `canAffordDisplacement` without touching the negotiation engine.
 */
import type { Point } from "../../../common/point.ts";
import { BuildingComponentId } from "../../component/buildingComponent.ts";
import { BehaviorAgentComponentId } from "../../component/BehaviorAgentComponent.ts";
import {
    MovementStaminaComponentId,
    getMovementPressure,
    hasMovedThisTick,
} from "../../component/movementStaminaComponent.ts";
import { ResourceComponentId } from "../../component/resourceComponent.ts";
import { TileComponentId, getTile } from "../../component/tileComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { queryEntity } from "../../map/query/queryEntity.ts";

/**
 * Weight applied to movement pressure when computing resistance.
 * A fully-pressured entity (pressure=1.0) gains this many extra resistance points.
 * At 30, an idle goblin (utility≈10) that has been displaced repeatedly still has
 * lower resistance than a working goblin (utility≈50).
 */
const PRESSURE_WEIGHT = 30;

/**
 * Returns the effective resistance of an entity to being displaced.
 * Higher resistance means the entity is harder (more expensive) to move.
 *
 * Returns Infinity when the entity cannot be displaced at all:
 *   - No BehaviorAgentComponent (buildings, resources, inert objects)
 *   - Already moved this tick (hard one-move-per-tick gate)
 */
export function getDisplacementResistance(
    entity: Entity,
    currentTick: number,
): number {
    const agent = entity.getEcsComponent(BehaviorAgentComponentId);
    if (!agent) {
        return Infinity;
    }

    const stamina = entity.getEcsComponent(MovementStaminaComponentId);
    if (stamina && hasMovedThisTick(stamina, currentTick)) {
        return Infinity;
    }

    const pressure = stamina
        ? getMovementPressure(stamina, currentTick)
        : 0;

    return agent.currentBehaviorUtility + pressure * PRESSURE_WEIGHT;
}

/**
 * Returns true if the requester's priority is high enough to afford
 * displacing an entity with the given resistance.
 *
 * Phase 2 will replace this with a token-balance check.
 */
export function canAffordDisplacement(
    requesterPriority: number,
    resistance: number,
): boolean {
    return requesterPriority > resistance;
}

/**
 * Returns a score for how desirable a tile is as a displacement destination
 * for an entity being displaced. Higher is better.
 *
 * Returns -Infinity for tiles the entity cannot move to at all
 * (walls, buildings, resources).
 */
export function scoreCandidateTile(
    tile: Point,
    root: Entity,
    currentTick: number,
): number {
    // Must have ground
    const tileComponent = root.getEcsComponent(TileComponentId);
    if (!tileComponent || !getTile(tileComponent, tile)) {
        return -Infinity;
    }

    const occupants = queryEntity(root, tile);

    // Check for impassable entities (buildings, resources)
    for (const occupant of occupants) {
        if (occupant.hasComponent(BuildingComponentId)) {
            const building = occupant.getEcsComponent(BuildingComponentId);
            // Roads (weight 1) are passable; non-road buildings are not
            if (building && building.building.id !== "road") {
                return -Infinity;
            }
        }
        if (occupant.hasComponent(ResourceComponentId)) {
            return -Infinity;
        }
    }

    // Free tile — ideal, terminates the displacement chain
    const displaceable = occupants.filter((o) =>
        o.hasComponent(BehaviorAgentComponentId),
    );
    if (displaceable.length === 0) {
        return 100;
    }

    // Tile has a displaceable entity — score by inverse of their resistance
    // (cheaper to move them = better candidate for chain extension)
    const resistance = getDisplacementResistance(displaceable[0], currentTick);
    if (!isFinite(resistance)) {
        return -Infinity;
    }
    // Map resistance (0–100+) to a medium score (0–50)
    return Math.max(0, 50 - resistance);
}
