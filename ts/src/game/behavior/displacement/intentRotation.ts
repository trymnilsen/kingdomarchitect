import { type Point, pointEquals } from "../../../common/point.ts";
import { BehaviorAgentComponentId } from "../../component/behaviorAgentComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { queryEntity } from "../../map/query/queryEntity.ts";
import { nextRouteStep } from "../actions/moveRoute.ts";
import type { DisplacementMove } from "./displacementTransaction.ts";

/**
 * Moves that let the walkers ahead of the requester step together, when their
 * next steps lead back to the requester's tile. Each member waits on the next,
 * so they move as one or never, and rank cannot decide it since equals never
 * out-rank each other. On a cardinal grid the smallest loops are a head-on
 * pair and four walkers turning around a 2x2 square.
 *
 * Null when the chain ends anywhere else. A free tile or a stalled walker
 * clears without help, and a loop that leaves the requester out is found by
 * its own members on their turns.
 */
export function findIntentRotation(
    requester: Entity,
    targetTile: Point,
    root: Entity,
): DisplacementMove[] | null {
    const moves: DisplacementMove[] = [];
    const visitedIds = new Set<string>([requester.id]);
    let tile = targetTile;

    while (true) {
        const holder = queryEntity(root, tile).find((occupant) =>
            occupant.hasComponent(BehaviorAgentComponentId),
        );
        if (!holder || visitedIds.has(holder.id)) {
            return null;
        }
        const nextStep = nextRouteStep(holder);
        if (!nextStep) {
            return null;
        }

        moves.push({ entityId: holder.id, from: tile, to: nextStep });
        if (pointEquals(nextStep, requester.worldPosition)) {
            return moves;
        }

        visitedIds.add(holder.id);
        tile = nextStep;
    }
}
