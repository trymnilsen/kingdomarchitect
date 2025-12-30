import { addPoint, pointEquals, type Point } from "../../../common/point.js";
import type { PathfindingGraph } from "../../component/pathfindingGraphRegistryComponent.js";
import type { Entity } from "../../entity/entity.js";
import type { GraphNode } from "../path/graph/graph.js";
import { aStarSearch, type SearchedNode } from "../path/search.js";

export function queryPath(
    pathfindingGraph: PathfindingGraph,
    from: Point,
    to: Point,
): PathResult {
    const graph = pathfindingGraph.graph;
    if (!graph) {
        throw new Error("No graph set on pathfinding graph");
    }

    const offsetPoint = {
        x: graph.offsetX,
        y: graph.offsetY,
    };
    const offsetFrom = addPoint(from, {
        x: offsetPoint.x,
        y: offsetPoint.y,
    });
    const offsetTo = addPoint(to, {
        x: offsetPoint.x,
        y: offsetPoint.y,
    });

    const weightModifier = defaultWeightModifier;

    // Perform the search
    const result = aStarSearch(
        offsetFrom,
        offsetTo,
        graph,
        true,
        weightModifier,
    );

    // The path results are returned in a absolute space, so we convert them
    // back before doing any further work on it
    const path = result.path.map((item) => {
        return {
            x: item.x - offsetPoint.x,
            y: item.y - offsetPoint.y,
        };
    });
    if (path.length == 0) {
        return {
            status: PathResultStatus.None,
            path: [],
            graph: result.graph,
        };
    }

    // Now we have a search result, check if the end of the path is adjacent
    // to the end point if needed
    const lastPathPoint = path[path.length - 1];
    if (pointEquals(lastPathPoint, to)) {
        return {
            status: PathResultStatus.Complete,
            path: path,
            graph: result.graph,
        };
    } else {
        return {
            status: PathResultStatus.Partial,
            path: path,
            graph: result.graph,
        };
    }
}

/**
 * Status of a path search result
 */
export const PathResultStatus = {
    /**
     * A complete path was found including the end point
     */
    Complete: "complete",
    /**
     * A complete path was found excluding the end point.
     * There might be multiple tiles between the end point of the search
     * and the target if the target is withing an entity spanning multiple
     * tiles. In this case the final point in the path will be a tile adjacent
     * to the bounds of this entity
     */
    Adjacent: "adjacent",
    /**
     * A partial path was found to the end point. Use with caution as it is not
     * a complete path
     */
    Partial: "partial",
    /**
     * No path was found from start to end. For example if the start was inside
     * a impassable position
     */
    None: "none",
} as const;

export type PathResultStatus = typeof PathResultStatus[keyof typeof PathResultStatus];

/**
 * The result of a path search, will include the potential path found and the
 * status of the search. Note: A result with entries in the path array might
 * not be a complete path, remember to check the status
 */
export type PathResult = {
    path: Point[];
    status: PathResultStatus;
    graph: SearchedNode[];
};

const defaultWeightModifier = (node: GraphNode) => node.weight;
const blockBuildingsModifier = (node: GraphNode) => {
    return node.weight >= 20 ? 0 : node.weight;
};
