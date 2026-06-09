import type { Entity } from "../entity/entity.ts";
import type { GraphNode } from "../map/path/graph/graph.ts";
import {
    getWeightAtPoint,
    isTileAvailable,
} from "../map/path/graph/weight.ts";
import { queryEntity } from "../map/query/queryEntity.ts";
import { isImpassableStructure } from "../component/traversalComponent.ts";
import { BuildingComponentId } from "../component/buildingComponent.ts";
import { HealthComponentId } from "../component/healthComponent.ts";
import { ResourceComponentId } from "../component/resourceComponent.ts";
import { isPermanentObstacle } from "../../data/inventory/items/naturalResource.ts";
import { SIEGE_COST_MULTIPLIER, STRUCTURE_DAMAGE } from "./raidConstants.ts";

/**
 * Weight modifier for goblin "siege" pathfinding. Unlike the normal movement
 * modifier (which rejects any impassable structure outright via isTileAvailable),
 * this treats a *destructible* structure as traversable at a finite cost equal to
 * the time it takes to break it. A* therefore routes around a wall when going
 * around is cheaper, but punches straight through when the wall is the shortcut.
 *
 * Used only by RaidBehavior's own path query to decide the siege route — the
 * normal moveTo pathing is untouched. The route this produces tells the behavior
 * which wall to break next; the goblin then walks (with normal pathing) up to
 * that wall and attacks it, after which the destroyed tile opens up.
 *
 * GraphNode coordinates are in graph space (world + offset); we subtract the
 * graph offset to convert back to world coordinates before querying entities,
 * mirroring makePathModifier in moveToAction.
 */
export function goblinSiegeModifier(
    root: Entity,
    offsetX: number,
    offsetY: number,
): (node: GraphNode) => number {
    return (node) => {
        const wx = node.x - offsetX;
        const wy = node.y - offsetY;
        const point = { x: wx, y: wy };

        // Off-map / no ground tile is always impassable.
        if (getWeightAtPoint(point, root) === 0) {
            return 0;
        }

        // A normally-available tile keeps its ordinary cost — no siege handling
        // needed. This covers open ground, roads, passable resources and units.
        if (isTileAvailable(point, root)) {
            return node.weight;
        }

        // The tile is blocked. Decide whether it's breachable.
        const entities = queryEntity(root, point);
        for (const entity of entities) {
            // Permanent natural obstacles (e.g. stone) can never be broken.
            const resource = entity.getEcsComponent(ResourceComponentId);
            if (resource && isPermanentObstacle(resource.resourceId)) {
                return 0;
            }

            if (!isImpassableStructure(entity)) {
                continue;
            }

            // An impassable structure: breachable only if it's a destructible
            // building. Cost scales with time-to-destroy so cheaper/weaker walls
            // are preferred breach points and stronger ones favour a detour.
            const building = entity.getEcsComponent(BuildingComponentId);
            const health = entity.getEcsComponent(HealthComponentId);
            if (building && health) {
                return SIEGE_COST_MULTIPLIER * (health.maxHp / STRUCTURE_DAMAGE);
            }

            // Impassable and not a destructible building → hard block.
            return 0;
        }

        // Blocked for some other reason we don't model as breachable.
        return 0;
    };
}
