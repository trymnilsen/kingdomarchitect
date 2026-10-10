import {
    type Point,
    isPointAdjacentTo,
    pointEquals,
} from "../../../common/point.ts";
import {
    BehaviorAgentComponentId,
    requestReplan,
} from "../../component/behaviorAgentComponent.ts";
import {
    MovementStaminaComponentId,
    hasMovedThisTick,
} from "../../component/movementStaminaComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { relocate } from "../../job/movementHelper.ts";
import type { MoveToActionData } from "../actions/moveToAction.ts";
import { activeRoute, stepAlongRoute } from "../actions/moveRoute.ts";
import { log } from "../../../common/logging/logger.ts";

export type DisplacementMove = {
    entityId: string;
    from: Point;
    to: Point;
};

/**
 * The entities that move so a requester can step into its next tile, starting
 * with the one on that tile. The requester is never a member and takes its own
 * step afterwards, so its route and energy work the same however the tile was
 * cleared.
 *
 *   - `shove`: settled workers pushed aside. They replan and pay nothing.
 *   - `rotation`: walkers that step together along their own routes, see
 *     findIntentRotation.
 */
export type DisplacementTransaction = {
    kind: "shove" | "rotation";
    moves: DisplacementMove[];
};

type ResolvedMove = {
    entity: Entity;
    from: Point;
    to: Point;
};

/**
 * Apply every move of the transaction, or none of them when anything changed
 * since negotiation. Moves apply last to first, so each member steps into a
 * tile its successor has just left.
 */
export function commitDisplacementTransaction(
    transaction: DisplacementTransaction,
    root: Entity,
    currentTick: number,
): boolean {
    const resolved = resolveTransaction(transaction, root, currentTick);
    if (!resolved) {
        return false;
    }
    log.info(
        `Committing ${transaction.kind} of ${resolved.length} moves at tick=${currentTick}`,
    );
    if (transaction.kind === "shove") {
        commitShove(resolved, currentTick);
        return true;
    }
    return commitRotation(resolved, currentTick);
}

function commitShove(moves: ResolvedMove[], currentTick: number): void {
    for (let i = moves.length - 1; i >= 0; i--) {
        const { entity, from, to } = moves[i];
        relocate(entity, from, to, currentTick);
        requestReplan(entity);
        entity.invalidateComponent(BehaviorAgentComponentId);
    }
}

/**
 * Members keep their plans. Replanning would make a worker re-decide its goal
 * in the middle of a crowd it is only passing through.
 */
function commitRotation(moves: ResolvedMove[], currentTick: number): boolean {
    const routes: MoveToActionData[] = [];
    for (const { entity, to } of moves) {
        const route = activeRoute(entity);
        const nextStep = route?.cachedPath?.[0];
        if (!route || !nextStep || !pointEquals(nextStep, to)) {
            log.warn(
                `${entity.id} no longer heads for (${to.x},${to.y}), aborting`,
            );
            return false;
        }
        routes.push(route);
    }
    for (let i = moves.length - 1; i >= 0; i--) {
        stepAlongRoute(moves[i].entity, routes[i], currentTick);
    }
    return true;
}

/**
 * Look up every member and check it is still where negotiation saw it, has not
 * moved this tick, and is moving one tile. Null when any check fails.
 */
function resolveTransaction(
    transaction: DisplacementTransaction,
    root: Entity,
    currentTick: number,
): ResolvedMove[] | null {
    const resolved: ResolvedMove[] = [];
    for (const move of transaction.moves) {
        const entity = root.findEntity(move.entityId);
        if (!entity) {
            log.warn(`Entity ${move.entityId} not found, aborting`);
            return null;
        }
        if (!pointEquals(entity.worldPosition, move.from)) {
            log.warn(
                `Entity ${move.entityId} stale: expected (${move.from.x},${move.from.y}) but at (${entity.worldPosition.x},${entity.worldPosition.y}), aborting`,
            );
            return null;
        }
        if (!isPointAdjacentTo(move.from, move.to)) {
            log.error(
                `Entity ${move.entityId} asked to move from (${move.from.x},${move.from.y}) to non-adjacent (${move.to.x},${move.to.y}), aborting`,
            );
            return null;
        }
        const stamina = entity.getEcsComponent(MovementStaminaComponentId);
        if (stamina && hasMovedThisTick(stamina, currentTick)) {
            log.warn(
                `Entity ${move.entityId} already moved at tick=${currentTick}, aborting`,
            );
            return null;
        }
        resolved.push({ entity, from: move.from, to: move.to });
    }
    return resolved;
}
