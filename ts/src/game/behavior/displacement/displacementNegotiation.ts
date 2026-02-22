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
import { adjacentPoints, type Point } from "../../../common/point.ts";
import { BehaviorAgentComponentId } from "../../component/BehaviorAgentComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { queryEntity } from "../../map/query/queryEntity.ts";
import {
    canAffordDisplacement,
    getDisplacementResistance,
    scoreCandidateTile,
} from "./displacementCost.ts";
import type { DisplacementMove, DisplacementTransaction } from "./displacementTransaction.ts";

export type NegotiationResult =
    | { kind: "success"; transaction: DisplacementTransaction }
    | { kind: "refused" }
    | { kind: "noChain" };

/**
 * Maximum number of entities in a displacement chain, not counting the requester.
 * Deep chains impose compounding social cost and are rarely affordable in practice
 * (each hop adds resistance). 3 is enough to unblock most realistic corridors while
 * keeping the DFS bounded.
 */
const MAX_CHAIN_DEPTH = 3;

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
    console.log(
        `[Displacement] ${requester.id} negotiating tile (${targetTile.x},${targetTile.y}), priority=${requesterPriority}`,
    );

    const occupants = queryEntity(root, targetTile);
    const blocker = occupants.find((o) => o.hasComponent(BehaviorAgentComponentId));
    if (!blocker) {
        // No displaceable entity at target — building, resource, or empty
        console.log(
            `[Displacement] ${requester.id} no displaceable entity at (${targetTile.x},${targetTile.y}), skipping`,
        );
        return { kind: "noChain" };
    }

    const blockerResistance = getDisplacementResistance(blocker, currentTick);
    if (!canAffordDisplacement(requesterPriority, blockerResistance)) {
        console.log(
            `[Displacement] ${requester.id} blocker=${blocker.id} resistance=${blockerResistance} exceeds priority=${requesterPriority}, refusing`,
        );
        return { kind: "refused" };
    }

    console.log(
        `[Displacement] ${requester.id} blocker=${blocker.id} willing (resistance=${blockerResistance}), searching chain`,
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
        blockerResistance,
    );

    if (!result) {
        console.log(
            `[Displacement] ${requester.id} no viable chain found for (${targetTile.x},${targetTile.y})`,
        );
        return { kind: "noChain" };
    }

    console.log(
        `[Displacement] ${requester.id} found ${result.isCycle ? "cycle" : "chain"} of ${result.moves.length} moves, totalResistance=${result.totalResistance}`,
    );
    return { kind: "success", transaction: { moves: result.moves, isCycle: result.isCycle } };
}

interface ChainResult {
    moves: DisplacementMove[];
    isCycle: boolean;
    totalResistance: number;
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
    accumulatedResistance: number,
): ChainResult | null {
    // Sort candidates by score descending so free tiles (score=100) are tried first.
    // Cardinal order (left, right, up, down) is the tiebreak for determinism.
    const candidates = adjacentPoints(fromTile)
        .map((tile) => ({ tile, score: scoreCandidateTile(tile, root, currentTick) }))
        .filter((c) => c.score > -Infinity)
        .sort((a, b) => b.score - a.score);

    let bestResult: ChainResult | null = null;

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
            console.log(
                `[Displacement] ${entity.id} can step to free tile (${tile.x},${tile.y}), terminating chain`,
            );
            return {
                moves: [{ entityId: entity.id, from: fromTile, to: tile }],
                isCycle: false,
                totalResistance: accumulatedResistance,
            };
        }

        const nextEntity = displaceable[0];

        // Cycle detected: the candidate tile is occupied by the original requester.
        // On a cardinal grid the only possible cycle back to the requester is a
        // 2-entity swap (A is adjacent to B, B is adjacent to A). Longer cycles
        // through other entities can't reach the requester because they're already
        // in visitedIds and would have been pruned as back-edges above.
        if (nextEntity.id === requester.id) {
            console.log(
                `[Displacement] ${entity.id} cycle back to requester via (${tile.x},${tile.y}), recording as candidate`,
            );
            const result: ChainResult = {
                moves: [
                    { entityId: entity.id, from: fromTile, to: tile },
                    {
                        entityId: requester.id,
                        from: tile,
                        to: initialTargetTile,
                    },
                ],
                isCycle: true,
                totalResistance: accumulatedResistance,
            };
            // Record as a candidate — keep checking for free tiles (better) or
            // cheaper cycles. A free tile always scores 100 vs cycle's lower score,
            // so this will only win if no free tile is reachable.
            if (!bestResult || result.totalResistance < bestResult.totalResistance) {
                bestResult = result;
            }
            continue;
        }

        // Back-edge to a different entity already in the chain (not the requester) —
        // this would create an unresolvable loop, prune the branch.
        if (visitedIds.has(nextEntity.id)) {
            console.log(
                `[Displacement] ${entity.id} tile (${tile.x},${tile.y}) occupied by already-visited ${nextEntity.id}, pruning`,
            );
            continue;
        }

        // At max depth with an occupied tile — can't extend the chain further.
        if (depth >= MAX_CHAIN_DEPTH) {
            console.log(
                `[Displacement] ${entity.id} max chain depth reached at (${tile.x},${tile.y}), pruning`,
            );
            continue;
        }

        // Check if requester can afford to displace this next entity too.
        const nextResistance = getDisplacementResistance(nextEntity, currentTick);
        if (!canAffordDisplacement(requesterPriority, nextResistance)) {
            console.log(
                `[Displacement] ${entity.id} next entity ${nextEntity.id} resistance=${nextResistance} > priority=${requesterPriority}, pruning`,
            );
            continue;
        }

        // Extend the chain: find where nextEntity can go.
        // Copy visitedIds to avoid mutating the set across branches.
        console.log(
            `[Displacement] ${entity.id} extending chain through ${nextEntity.id} at (${tile.x},${tile.y})`,
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
            accumulatedResistance + nextResistance,
        );

        if (subResult) {
            const chainResult: ChainResult = {
                moves: [
                    { entityId: entity.id, from: fromTile, to: tile },
                    ...subResult.moves,
                ],
                isCycle: subResult.isCycle,
                totalResistance: subResult.totalResistance,
            };
            if (!bestResult || chainResult.totalResistance < bestResult.totalResistance) {
                bestResult = chainResult;
            }
        }
    }

    return bestResult;
}
