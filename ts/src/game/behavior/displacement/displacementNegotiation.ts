/**
 * Displacement negotiation engine — bounded, cost-sensitive graph search.
 *
 * When an entity's moveTo action finds its next tile occupied by another entity,
 * this module searches for a chain of willing displacing entities that creates
 * a path. The result is a DisplacementTransaction (a sequence of moves) that
 * can be committed atomically in the same tick.
 *
 * The algorithm is a depth-limited DFS over the social graph. Nodes are entities,
 * edges represent "I could move to this neighbor tile". The search terminates when:
 *   - A free tile is found (chain terminated at a free tile)
 *   - A cycle back to the requester is found (all entities in the rotation swap)
 *   - Max depth is reached without a free tile
 *   - An entity refuses displacement (high resistance)
 *
 * Cardinal direction traversal order (left, right, up, down) is fixed for
 * determinism — never random tiebreaks.
 */
import { adjacentPoints, type Point, pointEquals } from "../../../common/point.ts";
import { BehaviorAgentComponentId } from "../../component/BehaviorAgentComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { queryEntity } from "../../map/query/queryEntity.ts";
import {
    canAffordDisplacement,
    classifyBlocker,
    scoreCandidateTile,
} from "./displacementCost.ts";
import { deriveIntendedNextStep } from "./movementIntent.ts";
import type {
    DisplacementMove,
    DisplacementTransaction,
} from "./displacementTransaction.ts";
import { log } from "../../../common/logging/logger.ts";

export type NegotiationResult =
    | { kind: "success"; transaction: DisplacementTransaction }
    | { kind: "refused" }
    | { kind: "noChain" }
    | { kind: "wait" };

/**
 * Maximum number of entities in a displacement chain, not counting the requester.
 * Deep chains impose compounding social cost and are rarely affordable in practice
 * (each hop adds resistance). 3 is enough to unblock most realistic corridors while
 * keeping the DFS bounded.
 */
const MAX_CHAIN_DEPTH = 3;

/**
 * Compile-time exhaustiveness guard: if a new `BlockerClass` kind is added and a switch
 * below doesn't handle it, this line stops compiling until it's dealt with.
 */
function assertNever(value: never): never {
    throw new Error(`Unhandled blocker class: ${JSON.stringify(value)}`);
}

/**
 * Attempt to negotiate a displacement transaction to clear `targetTile` for the requester.
 * Returns a transaction to commit atomically, or null if no affordable resolution exists.
 *
 * The returned transaction moves all displaced entities and (in cycle cases) the requester.
 * Non-cycle: the requester still needs to move itself into `targetTile` after committing.
 * Cycle: the requester's move is included in the transaction.
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

    const occupants = queryEntity(root, targetTile);
    const blocker = occupants.find((o) =>
        o.hasComponent(BehaviorAgentComponentId),
    );
    if (!blocker) {
        // No displaceable entity at target — building, resource, or empty
        log.debug(
            `${requester.id} no displaceable entity at (${targetTile.x},${targetTile.y}), skipping`,
        );
        return { kind: "noChain" };
    }

    // Mutual-benefit pass, checked BEFORE the dominance gate below on purpose.
    // Displacement (shoving someone off their task) and passing (two travellers
    // trading tiles) are different things that the old cost model lumped together:
    // a head-on in a 1-wide corridor between two equally-important workers could
    // never resolve, because neither could "out-rank" the other. But if the blocker
    // is itself trying to step into the requester's tile, a swap advances BOTH along
    // their own paths and costs neither any progress — so it's always allowed,
    // regardless of utility (even zero). That's why it skips the affordability check.
    //
    // On a cardinal grid a reciprocal pass is always a 2-entity swap (a longer cycle
    // can't reach back to the requester without revisiting a tile). If the blocker
    // already moved this tick we still return the transaction; commit's staleness
    // check (it re-validates positions/one-move-per-tick) turns it into a harmless
    // "wait" that leaves the requester's cached path intact to retry next tick.
    const blockerNextStep = deriveIntendedNextStep(blocker);
    if (
        blockerNextStep &&
        blockerNextStep.x === requester.worldPosition.x &&
        blockerNextStep.y === requester.worldPosition.y
    ) {
        log.debug(
            `${requester.id} mutual swap with ${blocker.id} (head-on pass at (${targetTile.x},${targetTile.y}))`,
        );
        return {
            kind: "success",
            transaction: {
                isCycle: true,
                beneficialSwap: true,
                moves: [
                    {
                        entityId: blocker.id,
                        from: targetTile,
                        to: requester.worldPosition,
                    },
                    {
                        entityId: requester.id,
                        from: requester.worldPosition,
                        to: targetTile,
                    },
                ],
            },
        };
    }

    // The blocker isn't trading places with us. What we may do depends on what it is.
    const cls = classifyBlocker(blocker, currentTick);
    switch (cls.kind) {
        case "transient":
        case "movedThisTick":
            // It will vacate on its own (walking / undecided) or already moved this tick
            // and is free next tick — either way we don't shove it. Wait and retry next
            // tick, holding the cached path. This keeps same-direction traffic queueing
            // rather than barging, and lets a not-yet-planned head-on partner resolve via
            // the swap above once it has computed its path.
            log.debug(
                `${requester.id} blocker=${blocker.id} is ${cls.kind}, waiting`,
            );
            return { kind: "wait" };
        case "immovable":
            // Not a behaviour agent — nothing to displace (defensive; the blocker was
            // already found via BehaviorAgentComponentId, so this shouldn't be reached).
            return { kind: "noChain" };
        case "displaceable":
            break;
        default:
            return assertNever(cls);
    }

    // Persistent blocker (idle or mid-task): displace it only if we out-rank its cost.
    if (!canAffordDisplacement(requesterPriority, cls.cost)) {
        log.debug(
            `${requester.id} blocker=${blocker.id} cost=${cls.cost} exceeds priority=${requesterPriority}, refusing`,
        );
        return { kind: "refused" };
    }

    log.debug(
        `${requester.id} blocker=${blocker.id} willing (cost=${cls.cost}), searching chain`,
    );

    // visitedIds starts with the requester and the blocker so we detect both
    // back-edges (requester → cycle) and double-visit (same entity twice in chain)
    const visitedIds = new Set<string>([requester.id, blocker.id]);

    const result = findBestChain(
        blocker,
        targetTile,
        requester,
        targetTile,
        requesterPriority,
        root,
        currentTick,
        visitedIds,
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
        `${requester.id} found ${result.isCycle ? "cycle" : "chain"} of ${result.moves.length} moves, totalCost=${result.totalCost}`,
    );
    return {
        kind: "success",
        transaction: { moves: result.moves, isCycle: result.isCycle },
    };
}

interface ChainResult {
    moves: DisplacementMove[];
    isCycle: boolean;
    totalCost: number;
}

/**
 * Recursive DFS that finds the cheapest valid displacement chain starting from `entity`.
 * `initialTargetTile` is where the original requester wants to end up — needed to construct
 * the requester's move when a cycle back to it is detected.
 */
function findBestChain(
    entity: Entity,
    fromTile: Point,
    requester: Entity,
    initialTargetTile: Point,
    requesterPriority: number,
    root: Entity,
    currentTick: number,
    visitedIds: Set<string>,
    depth: number,
    accumulatedCost: number,
): ChainResult | null {
    // A displacement chain terminates in one of two ways:
    //   1. at a free tile — everyone shifts over by one (preferred; handled in the loop)
    //   2. at the requester's own tile — `entity` rotates into the spot the requester is
    //      about to vacate, closing a swap/rotation cycle.
    // The cycle terminator is built explicitly here, not scored as a candidate, because
    // the requester is in transit so scoreCandidateTile (correctly) rejects its tile as a
    // normal push target. It's checked at every depth: the cycle can close at the initial
    // blocker (the 2-entity swap) or deeper, through a ring of pushed entities — in which
    // case the recursion prepends the intermediate moves as it unwinds.
    //
    // It's recorded as a candidate result, not returned early: a free tile still wins
    // (the loop returns on the first one), and among non-free results the cheapest wins.
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
                {
                    entityId: requester.id,
                    from: requester.worldPosition,
                    to: initialTargetTile,
                },
            ],
            isCycle: true,
            totalCost: accumulatedCost,
        };
    }

    // Other destinations, best score first (free tiles score 100). The requester's tile
    // is handled above; scoreCandidateTile rejects it (along with any transient/immovable
    // occupant), so it never appears here. Cardinal order (left, right, up, down) is the
    // deterministic tiebreak.
    const candidates = adjacentPoints(fromTile)
        .map((tile) => ({
            tile,
            score: scoreCandidateTile(tile, root, currentTick),
        }))
        .filter((c) => c.score > -Infinity)
        .sort((a, b) => b.score - a.score);

    for (const { tile } of candidates) {
        const occupants = queryEntity(root, tile);
        const displaceable = occupants.filter((o) =>
            o.hasComponent(BehaviorAgentComponentId),
        );

        if (displaceable.length === 0) {
            // Free passable tile — the best possible displacement destination.
            // scoreCandidateTile returns 100 for free tiles and at most 50 for any
            // occupied tile (50 - resistance). Since candidates are sorted descending,
            // a free tile always appears first. No chain outcome can be better, so
            // return immediately without evaluating the remaining candidates.
            log.debug(
                `${entity.id} can step to free tile (${tile.x},${tile.y}), terminating chain`,
            );
            return {
                moves: [{ entityId: entity.id, from: fromTile, to: tile }],
                isCycle: false,
                totalCost: accumulatedCost,
            };
        }

        const nextEntity = displaceable[0];

        // Back-edge: the tile is held by an entity already in the chain — including the
        // requester, whose cycle-back is the terminator handled above. Pushing into it
        // would loop, so prune.
        if (visitedIds.has(nextEntity.id)) {
            log.debug(
                `${entity.id} tile (${tile.x},${tile.y}) occupied by already-visited ${nextEntity.id}, pruning`,
            );
            continue;
        }

        // At max depth with an occupied tile — can't extend the chain further.
        if (depth >= MAX_CHAIN_DEPTH) {
            log.debug(
                `${entity.id} max chain depth reached at (${tile.x},${tile.y}), pruning`,
            );
            continue;
        }

        // Only a settled (displaceable) entity can extend the chain, and only if the
        // requester out-ranks its cost. Transient/moved occupants were already dropped by
        // scoreCandidateTile, so in practice nextEntity is displaceable — classify to be
        // safe and to read its cost.
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

        // Extend the chain: find where nextEntity can go.
        // Copy visitedIds to avoid mutating the set across branches.
        log.debug(
            `${entity.id} extending chain through ${nextEntity.id} at (${tile.x},${tile.y})`,
        );
        const newVisited = new Set([...visitedIds, nextEntity.id]);
        const subResult = findBestChain(
            nextEntity,
            tile,
            requester,
            initialTargetTile,
            requesterPriority,
            root,
            currentTick,
            newVisited,
            depth + 1,
            accumulatedCost + nextCls.cost,
        );

        if (subResult) {
            const chainResult: ChainResult = {
                moves: [
                    { entityId: entity.id, from: fromTile, to: tile },
                    ...subResult.moves,
                ],
                isCycle: subResult.isCycle,
                totalCost: subResult.totalCost,
            };
            if (!bestResult || chainResult.totalCost < bestResult.totalCost) {
                bestResult = chainResult;
            }
        }
    }

    return bestResult;
}
