import type { Graph } from "../map/path/graph/graph.js";
import type { PathCache } from "../map/path/pathCache.js";

export type PathfindingGraphComponent = {
    id: typeof PathfindingGraphComponentId;
    graph: Graph;
    pathCache: PathCache;
};

export const PathfindingGraphComponentId = "PathfindingGraph";
