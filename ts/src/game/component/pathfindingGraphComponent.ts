import type { Graph } from "../../module/path/graph/graph.js";
import type { PathCache } from "../../module/path/pathCache.js";

export type PathfindingGraphComponent = {
    id: typeof PathfindingGraphComponentId;
    graph: Graph;
    pathCache: PathCache;
};

export const PathfindingGraphComponentId = "PathfindingGraph";
