/**
 * Works out who has to move so a walker can step into an occupied tile.
 * Walkers whose next steps loop back to it rotate together, see
 * findIntentRotation. Otherwise a settled blocker may be shoved, found by a
 * depth-limited search over the tiles the blockers could move to.
 *
 * Cardinal direction order (left, right, up, down) is the tiebreak throughout,
 * so the outcome is deterministic.
 */
import {
    adjacentPoints,
    type Point,
    pointEquals,
} from "../../../common/point.ts";
import { BehaviorAgentComponentId } from "../../component/behaviorAgentComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { queryEntity } from "../../map/query/queryEntity.ts";
import {
    canAffordDisplacement,
    classifyBlocker,
    scoreCandidateTile,
} from "./displacementCost.ts";
import { findIntentRotation } from "./intentRotation.ts";
import type {
    DisplacementMove,
    DisplacementTransaction,
} from "./displacementTransaction.ts";
import { log } from "../../../common/logging/logger.ts";

export type NegotiationResult =
    | DisplacementTransaction
    | { kind: "refused" }
    | { kind: "noChain" }
    | { kind: "wait" };

/**
 * Most entities a shove may push, not counting the requester. Each hop adds its
 * cost to the requester's bill, so deeper chains are rarely affordable anyway.
 */
const MAX_CHAIN_DEPTH = 3;

function assertNever(value: never): never {
    throw new Error(`Unhandled blocker class: ${JSON.stringify(value)}`);
}

/**
 * What it takes for `requester` to step into `targetTile`. A transaction moves
 * everyone in the way, and the requester then takes the step itself.
 */
export function negotiateDisplacement(
    requester: Entity,
    targetTile: Point,
    requesterPriority: number,
    root: Entity,
    currentTick: number,
): NegotiationResult {
    log.debug(
        `${requester.id} negotiating tile (${targetTile.x},${targetTile.y}), priority=${requesterPriority}`,
    );

    const blocker = queryEntity(root, targetTile).find((o) =>
        o.hasComponent(BehaviorAgentComponentId),
    );
    if (!blocker) {
        log.debug(
            `${requester.id} no displaceable entity at (${targetTile.x},${targetTile.y}), skipping`,
        );
        return { kind: "noChain" };
    }

    // Before the rank check, since a loop of walkers has to rotate whatever
    // their utilities are.
    const rotation = findIntentRotation(requester, targetTile, root);
    if (rotation) {
        log.debug(
            `${requester.id} rotating with [${rotation.map((move) => move.entityId).join(", ")}] into (${targetTile.x},${targetTile.y})`,
        );
        return { kind: "rotation", moves: rotation };
    }

    const cls = classifyBlocker(blocker, currentTick);
    switch (cls.kind) {
        case "transient":
        case "movedThisTick":
            log.debug(
                `${requester.id} blocker=${blocker.id} is ${cls.kind}, waiting`,
            );
            return { kind: "wait" };
        case "immovable":
            return { kind: "noChain" };
        case "displaceable":
            break;
        default:
            return assertNever(cls);
    }

    if (!canAffordDisplacement(requesterPriority, cls.cost)) {
        log.debug(
            `${requester.id} blocker=${blocker.id} cost=${cls.cost} exceeds priority=${requesterPriority}, refusing`,
        );
        return { kind: "refused" };
    }

    log.debug(
        `${requester.id} blocker=${blocker.id} willing (cost=${cls.cost}), searching chain`,
    );
    const result = findBestChain(
        blocker,
        targetTile,
        requester,
        requesterPriority,
        root,
        currentTick,
        new Set([requester.id, blocker.id]),
        0,
        cls.cost,
    );

    if (!result) {
        log.debug(
            `${requester.id} no viable chain found for (${targetTile.x},${targetTile.y})`,
        );
        return { kind: "noChain" };
    }

    log.debug(
        `${requester.id} found shove of ${result.moves.length} moves, totalCost=${result.totalCost}`,
    );
    return { kind: "shove", moves: result.moves };
}

interface ChainResult {
    moves: DisplacementMove[];
    totalCost: number;
}

/**
 * The cheapest way to push `entity` off `fromTile`. A free tile ends the chain
 * and always wins. Failing that, `entity` can take the requester's tile, which
 * the requester leaves once the shove commits, or push the next settled worker
 * along.
 */
function findBestChain(
    entity: Entity,
    fromTile: Point,
    requester: Entity,
    requesterPriority: number,
    root: Entity,
    currentTick: number,
    visitedIds: Set<string>,
    depth: number,
    accumulatedCost: number,
): ChainResult | null {
    // Built here because scoreCandidateTile rejects the requester's tile, as
    // it rejects every walker's.
    let bestResult: ChainResult | null = null;
    if (
        adjacentPoints(fromTile).some((tile) =>
            pointEquals(tile, requester.worldPosition),
        )
    ) {
        bestResult = {
            moves: [
                {
                    entityId: entity.id,
                    from: fromTile,
                    to: requester.worldPosition,
                },
            ],
            totalCost: accumulatedCost,
        };
    }

    const candidates = adjacentPoints(fromTile)
        .map((tile) => ({
            tile,
            score: scoreCandidateTile(tile, root, currentTick),
        }))
        .filter((c) => c.score > -Infinity)
        .sort((a, b) => b.score - a.score);

    for (const { tile } of candidates) {
        const nextEntity = queryEntity(root, tile).find((o) =>
            o.hasComponent(BehaviorAgentComponentId),
        );

        // Free tiles score highest, so the first one is the best outcome there is
        if (!nextEntity) {
            log.debug(
                `${entity.id} can step to free tile (${tile.x},${tile.y}), terminating chain`,
            );
            return {
                moves: [{ entityId: entity.id, from: fromTile, to: tile }],
                totalCost: accumulatedCost,
            };
        }

        if (visitedIds.has(nextEntity.id)) {
            log.debug(
                `${entity.id} tile (${tile.x},${tile.y}) occupied by already-visited ${nextEntity.id}, pruning`,
            );
            continue;
        }

        if (depth >= MAX_CHAIN_DEPTH) {
            log.debug(
                `${entity.id} max chain depth reached at (${tile.x},${tile.y}), pruning`,
            );
            continue;
        }

        const nextCls = classifyBlocker(nextEntity, currentTick);
        if (
            nextCls.kind !== "displaceable" ||
            !canAffordDisplacement(requesterPriority, nextCls.cost)
        ) {
            log.debug(
                `${entity.id} cannot displace ${nextEntity.id} (${nextCls.kind}), pruning`,
            );
            continue;
        }

        log.debug(
            `${entity.id} extending chain through ${nextEntity.id} at (${tile.x},${tile.y})`,
        );
        const subResult = findBestChain(
            nextEntity,
            tile,
            requester,
            requesterPriority,
            root,
            currentTick,
            new Set([...visitedIds, nextEntity.id]),
            depth + 1,
            accumulatedCost + nextCls.cost,
        );

        if (
            subResult &&
            (!bestResult || subResult.totalCost < bestResult.totalCost)
        ) {
            bestResult = {
                moves: [
                    { entityId: entity.id, from: fromTile, to: tile },
                    ...subResult.moves,
                ],
                totalCost: subResult.totalCost,
            };
        }
    }

    return bestResult;
}
