/**
 * Displacement classification and scoring policy.
 *
 * The negotiation engine and the chain-candidate scorer both ask
 * `classifyBlocker` what a blocking entity is and what may be done with it, so
 * the transient/persistent model is defined once.
 */
import type { Point } from "../../../common/point.ts";
import { BehaviorAgentComponentId } from "../../component/behaviorAgentComponent.ts";
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
 *   - `transient` will vacate by itself: it is walking (a `moveTo` at its queue
 *     head, so it steps off next tick) or undecided (`pendingReplan` set:
 *     freshly spawned, or between actions). Never shoved. You wait for it, or
 *     swap if you are head-on. Shoving a walker throws away its route progress,
 *     and shoving an undecided worker pre-empts a choice it is one tick from
 *     making.
 *   - `movedThisTick` is held by the one-move-per-tick gate. Free next tick, so
 *     the requester waits and retries.
 *   - `displaceable` has settled: idle (`cost` 0, yields for free) or on a
 *     stationary task (`cost` is its behaviour utility). Moves only when a
 *     higher-priority requester pushes it.
 *   - `immovable` is not a behaviour agent at all, such as a building or a
 *     resource.
 */
export type BlockerClass =
    | { kind: "transient" }
    | { kind: "movedThisTick" }
    | { kind: "displaceable"; cost: number }
    | { kind: "immovable" };

/**
 * Classify a blocking entity. See {@link BlockerClass} for what each kind means.
 *
 * The `pendingReplan` half of `transient` covers two workers that become
 * adjacent before either has a committed path. The first waits, and the swap
 * fires once the second plans. This depends on the behaviour system clearing
 * `pendingReplan` when a worker settles, since a settled worker must classify
 * as `displaceable`.
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

/** Strictly greater, so equal priority never displaces. */
export function canAffordDisplacement(
    requesterPriority: number,
    cost: number,
): boolean {
    return requesterPriority > cost;
}

/**
 * Score a tile as a displacement destination for the entity being displaced.
 * Higher is better.
 *
 * -Infinity marks tiles the entity cannot move to at all: walls, buildings,
 * resources, or a tile held by an occupant that isn't `displaceable`. Transient,
 * already-moved and immovable occupants are never chain links, since none of
 * them get shoved.
 */
export function scoreCandidateTile(
    tile: Point,
    root: Entity,
    currentTick: number,
): number {
    const tileComponent = root.getEcsComponent(TileComponentId);
    if (!tileComponent || !getTile(tileComponent, tile)) {
        return -Infinity;
    }

    const occupants = queryEntity(root, tile);

    // Buildings go through isImpassableStructure so a shoved worker obeys
    // exactly the rule the pathfinder planned with. A local check here would
    // let displacement treat a farm as a wall while A* walks over it.
    for (const occupant of occupants) {
        if (isImpassableStructure(occupant)) {
            return -Infinity;
        }
        const resource = occupant.getEcsComponent(ResourceComponentId);
        if (resource && !isDecorativeResource(resource.resourceId)) {
            return -Infinity;
        }
    }

    // A free tile terminates the chain.
    const displaceable = occupants.filter((o) =>
        o.hasComponent(BehaviorAgentComponentId),
    );
    if (displaceable.length === 0) {
        return 100;
    }

    // Only a `displaceable` occupant is a valid chain link, scored by the inverse
    // of its cost so the cheapest to move wins. Any other kind drops the tile out,
    // which also makes a future BlockerClass kind default to not-chainable.
    const cls = classifyBlocker(displaceable[0], currentTick);
    if (cls.kind !== "displaceable") {
        return -Infinity;
    }
    // Cost 0..100+ maps onto a medium score, 0..50.
    return Math.max(0, 50 - cls.cost);
}
