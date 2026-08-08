/**
 * Displacement classification + scoring policy.
 *
 * `classifyBlocker` is the single source of truth for "what is this blocking entity, and
 * what may I do with it." The negotiation engine and the chain-candidate scorer both
 * consume it, so the transient/persistent model is defined in exactly one place.
 */
import type { Point } from "../../../common/point.ts";
import { BuildingComponentId } from "../../component/buildingComponent.ts";
import { BehaviorAgentComponentId } from "../../component/BehaviorAgentComponent.ts";
import {
    MovementStaminaComponentId,
    hasMovedThisTick,
} from "../../component/movementStaminaComponent.ts";
import { ResourceComponentId } from "../../component/resourceComponent.ts";
import { isDecorativeResource } from "../../../data/inventory/items/naturalResource.ts";
import { TileComponentId, getTile } from "../../component/tileComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { queryEntity } from "../../map/query/queryEntity.ts";

/**
 * How a blocking entity may be dealt with. The model turns on whether the
 * blocker's *occupancy* of a tile is transient or persistent, which comes down
 * to one question: is it going to leave on its own?
 *
 *   - `transient` means the blocker will vacate the tile by itself. It is either
 *     *walking* (a `moveTo` at its queue head, so it steps off next tick) or
 *     *undecided* (`pendingReplan` set, so freshly spawned or just finished or
 *     failed an action and not yet re-chosen). A transient occupant never gets
 *     shoved. You wait for it, or swap if you are head-on. Shoving a walker
 *     wastes the route progress it made, and shoving an undecided worker
 *     pre-empts a choice it is one tick away from making.
 *   - `movedThisTick` means it already moved this tick and is held by the hard
 *     one-move-per-tick gate, so it cannot move again until the next one. It is
 *     free next tick, same as a transient occupant, so the requester waits and
 *     retries.
 *   - `displaceable` means it has *settled*. It is either idle (no plan, `cost`
 *     0, yields for free) or doing a stationary task (`cost` is its behaviour
 *     utility). It will not move unless pushed, and only a higher-priority
 *     requester can push it.
 *   - `immovable` means it is not a behaviour agent at all, such as a building,
 *     a resource, or something inert. It cannot be displaced. This case is
 *     defensive: the real call paths only ever classify agent-bearing entities,
 *     and keeping it makes the function total.
 */
export type BlockerClass =
    | { kind: "transient" }
    | { kind: "movedThisTick" }
    | { kind: "displaceable"; cost: number }
    | { kind: "immovable" };

/**
 * Classify a blocking entity. See {@link BlockerClass} for what each kind means and why.
 *
 * The `pendingReplan` half of `transient` is load-bearing: it's what lets two workers
 * that become adjacent before either has a committed path resolve cleanly. The first
 * waits instead of shoving, and the beneficial swap fires once the second plans the same
 * tick. It relies on the behaviour system clearing `pendingReplan` when a worker settles
 * (idle or mid-task); a settled worker must classify as `displaceable`, not `transient`.
 */
export function classifyBlocker(
    entity: Entity,
    currentTick: number,
): BlockerClass {
    const agent = entity.getEcsComponent(BehaviorAgentComponentId);
    if (!agent) {
        return { kind: "immovable" };
    }

    const stamina = entity.getEcsComponent(MovementStaminaComponentId);
    if (stamina && hasMovedThisTick(stamina, currentTick)) {
        return { kind: "movedThisTick" };
    }

    if (
        agent.actionQueue[0]?.type === "moveTo" ||
        agent.pendingReplan !== undefined
    ) {
        return { kind: "transient" };
    }

    return { kind: "displaceable", cost: agent.currentBehaviorUtility };
}

/**
 * Returns true if the requester's priority is high enough to afford
 * displacing a persistent blocker with the given cost.
 */
export function canAffordDisplacement(
    requesterPriority: number,
    cost: number,
): boolean {
    return requesterPriority > cost;
}

/**
 * Returns a score for how desirable a tile is as a displacement destination
 * for an entity being displaced. Higher is better.
 *
 * Returns -Infinity for tiles the entity cannot move to at all: walls, buildings,
 * resources, or a tile held by an occupant that isn't `displaceable` (a transient,
 * already-moved, or immovable occupant is never a chain link, since none of them
 * get shoved).
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
        const resource = occupant.getEcsComponent(ResourceComponentId);
        if (resource && !isDecorativeResource(resource.resourceId)) {
            return -Infinity;
        }
    }

    // Free tile. This is ideal and terminates the displacement chain.
    const displaceable = occupants.filter((o) =>
        o.hasComponent(BehaviorAgentComponentId),
    );
    if (displaceable.length === 0) {
        return 100;
    }

    // Tile has an entity. Only a `displaceable` one is a valid chain link, scored by
    // the inverse of its cost (cheaper to move = better). Transient/moved/immovable
    // occupants drop the tile out (-Infinity); a future BlockerClass kind safely defaults
    // to not-chainable here too.
    const cls = classifyBlocker(displaceable[0], currentTick);
    if (cls.kind !== "displaceable") {
        return -Infinity;
    }
    // Map cost (0–100+) to a medium score (0–50)
    return Math.max(0, 50 - cls.cost);
}
