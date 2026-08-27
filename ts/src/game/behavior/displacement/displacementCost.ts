/**
 * Displacement classification and scoring policy.
 *
 * The negotiation engine and the chain-candidate scorer both ask
 * `classifyBlocker` what a blocking entity is and what may be done with it, so
 * the transient/persistent model is defined once.
 */
import type { Point } from "../../../common/point.ts";
import { BehaviorAgentComponentId } from "../../component/BehaviorAgentComponent.ts";
import { isImpassableStructure } from "../../component/traversalComponent.ts";
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
 * How a blocking entity may be dealt with. The question behind the model is
 * whether the blocker will leave the tile on its own.
 *
 *   - `transient` means it will vacate by itself. Either it is walking (a
 *     `moveTo` at its queue head, so it steps off next tick) or it is undecided
 *     (`pendingReplan` set: freshly spawned, or between actions). A transient
 *     occupant is never shoved. You wait for it, or swap if you are head-on.
 *     Shoving a walker throws away its route progress, and shoving an undecided
 *     worker pre-empts a choice it is one tick from making.
 *   - `movedThisTick` means the one-move-per-tick gate holds it. It is free
 *     next tick, like a transient occupant, so the requester waits and retries.
 *   - `displaceable` means it has settled: idle (`cost` 0, yields for free) or
 *     on a stationary task (`cost` is its behaviour utility). It moves only
 *     when a higher-priority requester pushes it.
 *   - `immovable` means it is not a behaviour agent at all, such as a building
 *     or a resource.
 */
export type BlockerClass =
    | { kind: "transient" }
    | { kind: "movedThisTick" }
    | { kind: "displaceable"; cost: number }
    | { kind: "immovable" };

/**
 * Classify a blocking entity. See {@link BlockerClass} for what each kind means.
 *
 * The `pendingReplan` half of `transient` is what lets two workers that become
 * adjacent before either has a committed path resolve cleanly: the first waits
 * instead of shoving, and the swap fires once the second plans. This depends on
 * the behaviour system clearing `pendingReplan` when a worker settles, since a
 * settled worker must classify as `displaceable`.
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

    // Check for impassable entities (buildings, resources). Buildings go
    // through isImpassableStructure so a shoved worker obeys exactly the rule
    // the pathfinder planned with. Doing it locally here is what previously let
    // displacement treat a farm as a wall while A* walked over it.
    for (const occupant of occupants) {
        if (isImpassableStructure(occupant)) {
            return -Infinity;
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
