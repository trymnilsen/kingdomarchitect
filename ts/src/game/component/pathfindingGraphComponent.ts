import type { Graph } from "../map/path/graph/graph.js";
import { PathCache } from "../map/path/pathCache.js";

export type PathfindingGraphComponent = {
    id: typeof PathfindingGraphComponentId;
    graph: Graph;
    pathCache: PathCache;
};

export function createPathfindingGraphComponent(
    graph: Graph,
): PathfindingGraphComponent {
    return {
        id: PathfindingGraphComponentId,
        pathCache: new PathCache(),
        graph: graph,
    };
}

export const PathfindingGraphComponentId = "PathfindingGraph";
