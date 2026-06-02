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
            // Both members stepped into a tile they were already heading for, so
            // each just keeps following its existing route. Two consequences:
            //   - No replan. Replanning would re-evaluate behaviour and could make a
            //     worker abandon its goal mid-corridor; there's no reason to, since
            //     its destination hasn't changed. We advance its cached path instead.
            //   - It pays energy (spendEnergy=true): a swap step is real travel, no
            //     cheaper than a normal step. The one-move-per-tick guard in
            //     moveToAction stops the same worker also stepping on its own turn,
            //     so this is charged exactly once.
            applyEntityMove(entity, from, to, currentTick, false, true);
            advanceOrClearMoveCache(entity, to);
        } else {
            // Forced cycle (the old "boxed-in blocker swaps with a higher-priority
            // requester" case): the non-requester is shoved off its own path, so it
            // must replan, and — unlike a willing traveller — is not charged energy.
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
 * Keep a swapped entity on its existing `moveTo` instead of replanning. The tile it
 * just moved into was the head of its cached path, so we drop that one step and the
 * rest of the route stays valid for next tick. The else-branch (clear the path) is a
 * safety net for the rare case where the head doesn't match — the entity then plans
 * fresh next tick rather than walking a stale route. Avoiding a full replan here is
 * what makes "continue your route" cheap and keeps a worker from re-deciding its
 * goal every time it squeezes past someone.
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

/**
 * Apply one entity's repositioning. The two flags differ by caller because the
 * meaning of the move differs: a shoved entity (forced chain/cycle) replans and
 * pays nothing, while a willing traveller (beneficial swap) keeps its plan and pays
 * energy like any other step. `recordMove` always runs — it backs both the
 * one-move-per-tick guard and the staleness check, regardless of move type.
 */
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
