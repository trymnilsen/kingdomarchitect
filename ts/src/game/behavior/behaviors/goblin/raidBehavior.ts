import { isPointAdjacentTo } from "../../../../common/point.ts";
import type { Entity } from "../../../entity/entity.ts";
import type { BehaviorActionData } from "../../actions/ActionData.ts";
import type { Behavior } from "../Behavior.ts";
import { RaidingComponentId } from "../../../component/raidingComponent.ts";
import { BuildingComponentId } from "../../../component/buildingComponent.ts";
import { HealthComponentId } from "../../../component/healthComponent.ts";
import { isImpassableStructure } from "../../../component/traversalComponent.ts";
import { queryEntity } from "../../../map/query/queryEntity.ts";
import { queryPath } from "../../../map/query/pathQuery.ts";
import { getPathfindingGraphForEntity } from "../../../map/path/getPathfindingGraphForEntity.ts";
import { goblinSiegeModifier } from "../../../raid/goblinSiegeModifier.ts";
import { RAID_UTILITY } from "../../../raid/raidConstants.ts";
import {
    findReplacementTarget,
    isLivePlayerBuilding,
} from "../../../raid/goblinRaid.ts";

/**
 * RaidBehavior drives a committed raider (a goblin carrying a RaidingComponent)
 * to march on and raze its assigned player building, breaking through any walls
 * in the way. There is no retreat: the behavior stays valid until the goblin
 * dies or no player buildings remain.
 *
 * Sits below engageInCombat (90) so a raider that gets attacked defends itself
 * first and then resumes the siege, and below keepWarm — except keepWarm is
 * suppressed for raiders, so a raider never abandons the siege to warm up.
 *
 * Siege movement: expand runs its own A* with the goblinSiegeModifier, which
 * treats destructible structures as traversable at a finite cost. That route
 * reveals the next wall to break; the goblin then walks (with ordinary moveTo
 * pathing) up to that wall and attacks it. Once the wall falls the graph
 * invalidates the tile, the next replan produces a shorter route, and the
 * raider advances — chewing inward until it reaches the target.
 */
export function createRaidBehavior(): Behavior {
    return {
        name: "raid",

        isValid(entity: Entity): boolean {
            const raiding = entity.getEcsComponent(RaidingComponentId);
            if (!raiding) {
                return false;
            }
            const root = entity.getRootEntity();
            if (isLivePlayerBuilding(root, raiding.targetId)) {
                return true;
            }
            // Current target gone — still valid if any player building remains.
            return findReplacementTarget(root, entity.worldPosition) !== null;
        },

        utility(_entity: Entity): number {
            return RAID_UTILITY;
        },

        expand(entity: Entity): BehaviorActionData[] {
            const raiding = entity.getEcsComponent(RaidingComponentId);
            if (!raiding) {
                return [];
            }
            const root = entity.getRootEntity();

            // Resolve (and if needed re-point) the target.
            let target = isLivePlayerBuilding(root, raiding.targetId)
                ? root.findEntity(raiding.targetId)
                : null;
            if (!target) {
                target = findReplacementTarget(root, entity.worldPosition);
                if (!target) {
                    return [];
                }
                raiding.targetId = target.id;
                entity.invalidateComponent(RaidingComponentId);
            }

            // The thing to attack next is either the first wall on the siege
            // route, or the target itself if the route is clear.
            const obstacle = nextSiegeObstacle(root, entity, target) ?? target;

            // Already adjacent → keep attacking (don't reset the running action
            // with a redundant moveTo, matching engageInCombatBehavior).
            if (isPointAdjacentTo(entity.worldPosition, obstacle.worldPosition)) {
                return [{ type: "attackTarget", targetId: obstacle.id }];
            }

            return [
                {
                    type: "moveTo",
                    target: obstacle.worldPosition,
                    stopAdjacent: "cardinal",
                },
                { type: "attackTarget", targetId: obstacle.id },
            ];
        },
    };
}

/**
 * Returns the first destructible structure standing between the raider and its
 * target along the siege route, or null if the route to the target is clear of
 * walls. The route is planned with the siege modifier so it may pass through
 * walls (at a cost); the first such wall is where the raider stops to attack.
 */
function nextSiegeObstacle(
    root: Entity,
    entity: Entity,
    target: Entity,
): Entity | null {
    const pathfindingGraph = getPathfindingGraphForEntity(root, entity);
    if (!pathfindingGraph) {
        return null;
    }

    const { offsetX, offsetY } = pathfindingGraph.graph;
    const result = queryPath(
        pathfindingGraph,
        entity.worldPosition,
        target.worldPosition,
        {
            weightModifier: goblinSiegeModifier(root, offsetX, offsetY),
            allowAdjacentStop: true,
        },
    );

    for (const point of result.path) {
        for (const occupant of queryEntity(root, point)) {
            if (occupant.id === target.id) {
                continue;
            }
            if (
                isImpassableStructure(occupant) &&
                occupant.hasComponent(BuildingComponentId) &&
                occupant.hasComponent(HealthComponentId)
            ) {
                return occupant;
            }
        }
    }

    return null;
}
