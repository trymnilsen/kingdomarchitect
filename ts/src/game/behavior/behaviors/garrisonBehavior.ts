import { distance } from "../../../common/point.ts";
import type { Entity } from "../../entity/entity.ts";
import { getGameTimeTick } from "../../component/gameTimeComponent.ts";
import { WorkerRole } from "../../component/worker/roleComponent.ts";
import {
    getRoleRank,
    roleUtility,
} from "../../component/worker/rolePriority.ts";
import {
    StationComponentId,
    StationPriority,
} from "../../component/stationComponent.ts";
import {
    isManningStation,
    stationOccupant,
} from "../../component/stationQuery.ts";
import type { BehaviorActionData } from "../actions/actionData.ts";
import type { Behavior } from "./behavior.ts";

/** How long one watch lasts before the guard re-selects. */
const HOLD_TICKS = 1;

/**
 * GarrisonBehavior: a Guard walks to a tower's lookout station, mans it, and
 * keeps standing there. The vantage and searchlight follow from the tile alone.
 *
 * Holding the post competes with the guard's other duties on rank. Ranked above
 * work a guard stays on the wall, ranked below it the guard climbs down and
 * returns when work runs out.
 *
 * Occupancy is read live rather than stored, so nothing dangles when a guard
 * dies. This behavior owns only the staffing policy, which free post to take.
 */
export function createGarrisonBehavior(): Behavior {
    return {
        name: "garrison",

        isValid(entity: Entity): boolean {
            if (getRoleRank(entity, WorkerRole.Guard) < 0) {
                return false;
            }
            // Already on a post: staying there is the duty.
            if (isManningStation(entity)) {
                return true;
            }
            return bestFreeStation(entity) !== null;
        },

        utility(entity: Entity): number {
            return roleUtility(entity, WorkerRole.Guard);
        },

        expand(entity: Entity): BehaviorActionData[] {
            if (isManningStation(entity)) {
                const now = getGameTimeTick(entity.getRootEntity());
                return [{ type: "holdStation", untilTick: now + HOLD_TICKS }];
            }
            const post = bestFreeStation(entity);
            if (!post) {
                return [];
            }
            return [
                {
                    type: "moveTo",
                    target: post.worldPosition,
                    stopAdjacent: "cardinal",
                },
                { type: "stepOnto", targetId: post.id },
            ];
        },
    };
}

/**
 * The highest-priority enabled station no other guard is standing on, ties broken by
 * distance, or null if none. (A post the guard itself is on doesn't disqualify it.)
 */
function bestFreeStation(guard: Entity): Entity | null {
    const root = guard.getRootEntity();
    let best: Entity | null = null;
    let bestPriority = -1;
    let bestDistance = Infinity;
    for (const [tower, station] of root.queryComponents(StationComponentId)) {
        if (station.priority === StationPriority.Off) {
            continue;
        }
        const occupant = stationOccupant(root, tower);
        if (occupant && occupant.id !== guard.id) {
            continue;
        }
        const d = distance(guard.worldPosition, tower.worldPosition);
        if (
            station.priority > bestPriority ||
            (station.priority === bestPriority && d < bestDistance)
        ) {
            best = tower;
            bestPriority = station.priority;
            bestDistance = d;
        }
    }
    return best;
}
