import type { Entity } from "../../entity/entity.ts";
import {
    PathfindingGraphComponentId,
    type PathfindingGraph,
} from "../../component/pathfindingGraphComponent.ts";

/**
 * Gets the pathfinding graph for an entity from the root entity.
 * This is a convenience function that retrieves the global pathfinding graph.
 *
 * @param root The root entity containing the PathfindingGraphComponent
 * @param _entity The entity (unused, kept for backwards compatibility)
 * @returns The PathfindingGraph or null if not found
 */
export function getPathfindingGraphForEntity(
    root: Entity,
    _entity: Entity,
): PathfindingGraph | null {
    const pathfindingGraphComponent = root.getEcsComponent(
        PathfindingGraphComponentId,
    );
    if (!pathfindingGraphComponent) {
        console.error(
            "[PathfindingGraph] No pathfinding graph component found on root entity",
        );
        return null;
    }

    return pathfindingGraphComponent.pathfindingGraph;
}
