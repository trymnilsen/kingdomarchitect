import type { Entity } from "../../entity/entity.js";
import {
    PathfindingGraphRegistryComponentId,
    getPathfindingGraph,
    type PathfindingGraph,
} from "../../component/pathfindingGraphRegistryComponent.js";
import { SpaceComponentId } from "../../component/spaceComponent.js";

/**
 * Gets the pathfinding graph for an entity's space from the root entity.
 * This is a convenience function that handles the common pattern of:
 * 1. Getting the registry from root
 * 2. Finding the entity's space ancestor
 * 3. Looking up the graph for that space
 *
 * @param root The root entity containing the PathfindingGraphRegistryComponent
 * @param entity The entity whose space's pathfinding graph to retrieve
 * @returns The PathfindingGraph or null if not found
 */
export function getPathfindingGraphForEntity(
    root: Entity,
    entity: Entity,
): PathfindingGraph | null {
    const registry = root.getEcsComponent(PathfindingGraphRegistryComponentId);
    if (!registry) {
        console.error(
            "[PathfindingGraph] No pathfinding graph registry found on root entity",
        );
        return null;
    }

    const spaceEntity = entity.getAncestorEntity(SpaceComponentId);
    if (!spaceEntity) {
        console.error(
            `[PathfindingGraph] Entity ${entity.id} has no space ancestor`,
        );
        return null;
    }

    const pathfindingGraph = getPathfindingGraph(registry, spaceEntity.id);
    if (!pathfindingGraph) {
        console.error(
            `[PathfindingGraph] No pathfinding graph found for space ${spaceEntity.id}`,
        );
        return null;
    }

    return pathfindingGraph;
}
