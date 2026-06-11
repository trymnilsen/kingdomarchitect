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
 * How a blocking entity may be dealt with. The model is transient vs persistent
 * *occupancy* of a tile — is the blocker going to leave on its own, or not?
 *
 *   - `transient`     — the blocker will vacate the tile by itself. Either it's *walking*
 *                       (a `moveTo` at its queue head, so it steps off next tick) or it's
 *                       *undecided* (`pendingReplan` set — freshly spawned, or it just
 *                       finished/failed an action and hasn't re-chosen yet). You never
 *                       shove a transient occupant: you wait for it, or swap if you're
 *                       head-on. Shoving a walker wastes the route progress it made;
 *                       shoving an undecided worker pre-empts a choice it's one tick from
 *                       making.
 *   - `movedThisTick` — it already moved this tick (the hard one-move-per-tick gate), so
 *                       it can't move again until next tick. Like a transient occupant
 *                       it's free next tick → the requester waits and retries.
 *   - `displaceable`  — it has *settled*: idle (no plan → `cost` 0, yields for free) or
 *                       doing a stationary task (`cost` = its behaviour utility). It won't
 *                       move unless pushed, so it is shoved only by a higher-priority
 *                       requester.
 *   - `immovable`     — not a behaviour agent at all (building / resource / inert). Cannot
 *                       be displaced. Defensive: the real call paths only ever classify
 *                       agent-bearing entities, but keeping it makes the function total.
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
 * that become adjacent before either has a committed path resolve cleanly — the first
 * waits instead of shoving, and the beneficial swap fires once the second plans the same
 * tick. It relies on the behaviour system clearing `pendingReplan` when a worker settles
 * (idle or mid-task); a settled worker must classify as `displaceable`, not `transient`.
 */
export function classifyBlocker(entity: Entity, currentTick: number): BlockerClass {
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
 * already-moved, or immovable occupant is never a chain link — you don't shove it).
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

    // Free tile — ideal, terminates the displacement chain
    const displaceable = occupants.filter((o) =>
        o.hasComponent(BehaviorAgentComponentId),
    );
    if (displaceable.length === 0) {
        return 100;
    }

    // Tile has an entity — only a `displaceable` one is a valid chain link, scored by
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
