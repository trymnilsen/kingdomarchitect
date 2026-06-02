import type { Point } from "../../../common/point.ts";
import {
    BehaviorAgentComponentId,
    requestReplan,
} from "../../component/BehaviorAgentComponent.ts";
import { spendEntityEnergy } from "../../component/energyComponent.ts";
import {
    DirectionComponentId,
    updateDirectionComponent,
} from "../../component/directionComponent.ts";
import {
    MovementStaminaComponentId,
    hasMovedThisTick,
    recordMove,
} from "../../component/movementStaminaComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { discoverAfterMovement } from "../../job/movementHelper.ts";
import { log } from "../../../common/logging/logger.ts";

export type DisplacementMove = {
    entityId: string;
    from: Point;
    to: Point;
};

export type DisplacementTransaction = {
    moves: DisplacementMove[];
    /**
     * True when the chain forms a closed cycle (e.g., A↔B swap or A→B→C→A rotation).
     * Cycles require all positions to be reassigned simultaneously — no entity can move
     * "first" because every destination is occupied by another entity in the cycle.
     */
    isCycle: boolean;
    /**
     * True when this is a mutually-beneficial head-on swap: every member is stepping
     * into a tile it already wanted, so each continues its own route (no replan) and
     * pays its own movement energy. Distinguished from a forced cycle, where displaced
     * members are shoved off-path (replan, no energy). Only meaningful when isCycle.
     */
    beneficialSwap?: boolean;
};

/**
 * A `DisplacementMove` with the entity already resolved from the world tree.
 * Used internally so validate and execute share a single `findEntity` call per move.
 */
type ResolvedMove = {
    entity: Entity;
    from: Point;
    to: Point;
};

/**
 * Attempt to commit a displacement transaction atomically.
 * Returns false if the transaction is stale (entities have moved since negotiation)
 * or if any entity has already moved this tick. Returns true on success.
 *
 * For non-cycle chains the last entity moves first (into the free tile), then
 * the chain unravels back-to-front. For cycles all positions are swapped at once.
 *
 * `requesterEntityId` identifies the entity that initiated the displacement.
 * That entity should NOT receive a replan — its move action continues normally
 * (or in a cycle, its position was updated as part of the rotation and its
 * action will complete when it checks arrival).
 */
export function commitDisplacementTransaction(
    transaction: DisplacementTransaction,
    root: Entity,
    currentTick: number,
    requesterEntityId: string,
): boolean {
    log.info(
        `Committing ${transaction.isCycle ? "cycle" : "chain"} of ${transaction.moves.length} moves at tick=${currentTick}`,
    );

    // Resolve entities and validate in one pass. If anything is stale or missing
    // we return false before touching any positions.
    const resolved = resolveTransaction(transaction, root, currentTick);
    if (!resolved) {
        return false;
    }

    log.debug(
        `Resolved ${resolved.length} entities, applying as ${transaction.isCycle ? "cycle" : "chain"}`,
    );

    if (transaction.isCycle) {
        commitCycle(
            resolved,
            currentTick,
            requesterEntityId,
            transaction.beneficialSwap === true,
        );
    } else {
        commitChain(resolved, currentTick, requesterEntityId);
    }

    return true;
}

/**
 * Resolve each move in the transaction to a live Entity reference, validating
 * that every entity is still at its expected from-position and has not already
 * moved this tick. Returns null if any check fails — no entity has been moved.
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
        if (
            entity.worldPosition.x !== move.from.x ||
            entity.worldPosition.y !== move.from.y
        ) {
            log.warn(
                `Entity ${move.entityId} stale: expected (${move.from.x},${move.from.y}) but at (${entity.worldPosition.x},${entity.worldPosition.y}), aborting`,
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

/**
 * Execute a non-cycle chain by iterating in reverse order (last entity first).
 * The last entity steps into the free tile, which vacates its old tile for the
 * entity behind it, and so on back to the front of the chain. Moving front-to-back
 * would require double-occupancy because each entity's destination is still occupied.
 */
function commitChain(
    moves: ResolvedMove[],
    currentTick: number,
    requesterEntityId: string,
): void {
    for (let i = moves.length - 1; i >= 0; i--) {
        const { entity, from, to } = moves[i];
        applyEntityMove(
            entity,
            from,
            to,
            currentTick,
            entity.id !== requesterEntityId,
            false,
        );
    }
}

/**
 * Execute a cycle by applying all position changes simultaneously.
 * In a cycle every entity's destination is occupied by another cycle member, so
 * no entity can move "first" without evicting someone who hasn't moved yet.
 * `resolveTransaction` already captured the Entity references before any positions
 * change, so we can apply them all in one pass without double-occupancy issues.
 */
function commitCycle(
    moves: ResolvedMove[],
    currentTick: number,
    requesterEntityId: string,
    beneficialSwap: boolean,
): void {
    for (const { entity, from, to } of moves) {
        if (beneficialSwap) {
            // Mutually-beneficial swap: every member stepped into a tile it already
            // wanted, so it continues its own route (no replan) and pays for its own
            // step. Advance its cached path past the consumed step.
            applyEntityMove(entity, from, to, currentTick, false, true);
            advanceOrClearMoveCache(entity, to);
        } else {
            // Forced cycle: displaced members are shoved off-path — replan, no energy.
            applyEntityMove(
                entity,
                from,
                to,
                currentTick,
                entity.id !== requesterEntityId,
                false,
            );
        }
    }
}

/**
 * After a beneficial swap, drop the step the entity just consumed from its cached
 * path so it keeps following the same `moveTo` next tick without a replan. If the
 * cached head no longer matches (rare — a divergent committed route), clear the
 * path so it is recomputed fresh next tick instead of stepping onto a stale tile.
 */
function advanceOrClearMoveCache(entity: Entity, to: Point): void {
    const agent = entity.getEcsComponent(BehaviorAgentComponentId);
    const action = agent?.actionQueue[0];
    if (action?.type !== "moveTo") {
        return;
    }
    const cached = action.cachedPath;
    if (
        cached &&
        cached.length > 0 &&
        cached[0].x === to.x &&
        cached[0].y === to.y
    ) {
        action.cachedPath = cached.slice(1);
    } else {
        action.cachedPath = undefined;
    }
    entity.invalidateComponent(BehaviorAgentComponentId);
}

function applyEntityMove(
    entity: Entity,
    from: Point,
    to: Point,
    currentTick: number,
    triggerReplan: boolean,
    spendEnergy: boolean,
): void {
    discoverAfterMovement(entity, to);

    entity.updateComponent(DirectionComponentId, (component) => {
        updateDirectionComponent(component, from, to);
    });

    entity.worldPosition = to;

    const stamina = entity.getEcsComponent(MovementStaminaComponentId);
    if (stamina) {
        recordMove(stamina, currentTick);
        entity.invalidateComponent(MovementStaminaComponentId);
    }

    if (spendEnergy) {
        spendEntityEnergy(entity, 1);
    }

    log.debug(
        `Moved ${entity.id} from (${from.x},${from.y}) to (${to.x},${to.y})${triggerReplan ? " (replan scheduled)" : ""}`,
    );

    if (triggerReplan) {
        requestReplan(entity);
        entity.invalidateComponent(BehaviorAgentComponentId);
    }
}
