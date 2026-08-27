import type { Entity } from "../../entity/entity.ts";
import { log } from "../../../common/logging/logger.ts";
import {
    PathfindingGraphComponentId,
    type PathfindingGraph,
} from "../../component/pathfindingGraphComponent.ts";

/**
 * The world's pathfinding graph, held on the root entity. There is one graph
 * for everything that moves.
 *
 * @param root The root entity containing the PathfindingGraphComponent
 * @returns The PathfindingGraph or null if not found
 */
export function getPathfindingGraph(root: Entity): PathfindingGraph | null {
    const pathfindingGraphComponent = root.getEcsComponent(
        PathfindingGraphComponentId,
    );
    if (!pathfindingGraphComponent) {
        log.error("No pathfinding graph component found on root entity");
        return null;
    }

    return pathfindingGraphComponent.pathfindingGraph;
}
