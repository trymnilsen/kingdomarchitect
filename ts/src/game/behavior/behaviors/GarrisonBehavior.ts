import { distance } from "../../../common/point.ts";
import type { Entity } from "../../entity/entity.ts";
import {
    RoleComponentId,
    WorkerRole,
} from "../../component/worker/roleComponent.ts";
import {
    StationComponentId,
    StationPriority,
} from "../../component/stationComponent.ts";
import {
    isManningStation,
    stationOccupant,
} from "../../component/stationQuery.ts";
import type { BehaviorActionData } from "../actions/ActionData.ts";
import type { Behavior } from "./Behavior.ts";

/**
 * Utility for *walking to* a tower. Below survival/combat (90+) so a guard still
 * leaves to eat, sleep, and fight, then returns. Above incidental behaviors
 * (deposit/restock ~15). It need not out-rank jobs (50) because guards are excluded
 * from the job pool entirely (see PerformJobBehavior).
 */
const GARRISON_UTILITY = 40;

/**
 * GarrisonBehavior: a Guard walks to a tower's lookout station and mans it. The
 * effects (vision vantage by day, searchlight by night) follow from the worker
 * simply standing on the tile.
 *
 * There is no "hold" action. Once on the post the behavior has nothing left to do,
 * so it expands to an empty plan — the worker idles in place. An empty queue makes
 * the behavior system re-evaluate every tick, so the guard reacts promptly to needs
 * and combat; and because nothing moves it, it stays put. StepOutsideBehavior is
 * taught (via {@link isManningStation}) to leave a manning guard alone.
 *
 * Staffing is fully stateless: occupancy is read live from {@link stationQuery}, so
 * nothing can dangle when a guard dies or despawns. This behavior owns only the
 * staffing *policy* — which free post to take.
 */
export function createGarrisonBehavior(): Behavior {
    return {
        name: "garrison",

        isValid(entity: Entity): boolean {
            const role = entity.getEcsComponent(RoleComponentId);
            if (role?.role !== WorkerRole.Guard) {
                return false;
            }
            // Already manning a post → nothing to do but stay; idling there keeps
            // the body on the tile (StepOutside leaves a manning guard alone).
            if (isManningStation(entity)) {
                return false;
            }
            return bestFreeStation(entity) !== null;
        },

        utility(_entity: Entity): number {
            return GARRISON_UTILITY;
        },

        expand(entity: Entity): BehaviorActionData[] {
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
