import type { Graph } from "../map/path/graph/graph.js";
import { PathCache } from "../map/path/pathCache.js";

export type PathfindingGraphEntry = {
    graph: Graph;
    pathCache: PathCache;
};

export type PathfindingGraphComponent = {
    id: typeof PathfindingGraphComponentId;
    graphs: Map<string, PathfindingGraphEntry>;
};

export function createPathfindingGraphComponent(): PathfindingGraphComponent {
    return {
        id: PathfindingGraphComponentId,
        graphs: new Map(),
    };
}

export function createPathfindingGraphEntry(
    graph: Graph,
): PathfindingGraphEntry {
    return {
        graph,
        pathCache: new PathCache(),
    };
}

export const PathfindingGraphComponentId = "PathfindingGraph";
