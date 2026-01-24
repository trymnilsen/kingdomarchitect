import type { Graph } from "../map/path/graph/graph.ts";
import { PathCache } from "../map/path/pathCache.ts";

export type PathfindingGraph = {
    graph: Graph;
    pathCache: PathCache;
};

export type PathfindingGraphComponent = {
    id: typeof PathfindingGraphComponentId;
    pathfindingGraph: PathfindingGraph;
};

export const PathfindingGraphComponentId = "PathfindingGraph";

export function createPathfindingGraphComponent(
    graph: Graph,
): PathfindingGraphComponent {
    return {
        id: PathfindingGraphComponentId,
        pathfindingGraph: createPathfindingGraph(graph),
    };
}

export function createPathfindingGraph(graph: Graph): PathfindingGraph {
    return {
        graph,
        pathCache: new PathCache(),
    };
}
