import type { Graph } from "../map/path/graph/graph.js";
import { PathCache } from "../map/path/pathCache.js";

export type PathfindingGraph = {
    graph: Graph;
    pathCache: PathCache;
};

export type PathfindingGraphRegistryComponent = {
    id: typeof PathfindingGraphRegistryComponentId;
    graphs: Map<string, PathfindingGraph>; // Keyed by entity id (scene id)
};

export const PathfindingGraphRegistryComponentId = "PathfindingGraphRegistry";

export function createPathfindingGraphRegistryComponent(): PathfindingGraphRegistryComponent {
    return {
        id: PathfindingGraphRegistryComponentId,
        graphs: new Map(),
    };
}

export function createPathfindingGraph(graph: Graph): PathfindingGraph {
    return {
        graph,
        pathCache: new PathCache(),
    };
}

/**
 * Gets a pathfinding graph by id
 * @param registry The PathfindingGraphRegistryComponent
 * @param graphId The id of the pathfinding graph. Id of entity with SpaceComponent on it
 * @returns The PathfindingGraph or undefined if not found
 */
export function getPathfindingGraph(
    registry: PathfindingGraphRegistryComponent,
    graphId: string,
): PathfindingGraph | undefined {
    return registry.graphs.get(graphId);
}
