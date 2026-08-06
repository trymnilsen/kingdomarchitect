import {
    isPointAdjacentTo,
    type Point,
    pointEquals,
} from "../../../common/point.ts";
import { BinaryHeap } from "../../../common/structure/binaryHeap.ts";
import { log } from "../../../common/logging/logger.ts";
import { type Graph, GraphNode } from "./graph/graph.ts";
import { manhattanDistance } from "./pathHeuristics.ts";

export type SearchOptions = {
    /**
     * Replaces the cost read from each node. Returning 0 makes a node
     * impassable no matter what weight it stores.
     */
    weightModifier?: (graphNode: GraphNode) => number;
    /**
     * Stop once a node next to the goal is reached. Use this to path towards
     * something that cannot be stood on, like a wall or a tree.
     */
    allowAdjacentStop?: boolean;
};

const defaultWeightFunction = (node: GraphNode) => node.weight;

/**
 * Find a route between two points across the pathfinding graph.
 *
 * An unreachable goal still produces a result. The search falls back to a
 * partial path aimed at whichever reachable node ended up closest, which lets a
 * caller make some forward progress and try again later. An empty path means
 * one of three things: the start was missing from the graph, the goal was
 * missing from the graph, or nothing could be reached from the start.
 */
export function aStarSearch(
    from: Point,
    to: Point,
    graph: Graph,
    options?: SearchOptions,
): SearchResult {
    const weightModifier = options?.weightModifier ?? defaultWeightFunction;
    const start = graph.nodeAt(from.x, from.y);
    const end = graph.nodeAt(to.x, to.y);
    if (!start) {
        log.warn("From point not in graph", { from });
        return {
            graph: [],
            path: [],
        };
    }

    if (!end) {
        log.warn("To point not in graph", { to });
        return {
            graph: [],
            path: [],
        };
    }

    // Movement is four directional and the cheapest passable node costs 1, so
    // plain Manhattan distance is already an exact estimate of what remains.
    // The doubling overestimates on purpose. That turns this into weighted A*,
    // which settles for paths that can run slightly longer than optimal in
    // exchange for exploring far fewer nodes. Touching the 2 changes how every
    // unit in the game moves, so treat it as a tuning decision.
    const heuristics = (from: Point, to: Point) => {
        return manhattanDistance(from, to) * 2;
    };

    let closestNode = start;
    graph.cleanDirtyNodes();

    const openHeap = createHeap();

    start.h = heuristics(start, end);
    graph.markDirtyNode(start);

    openHeap.push(start);

    while (openHeap.size > 0) {
        // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
        const currentNode = openHeap.pop();

        // End case -- result has been found, return the traced path.
        if (
            currentNode === end ||
            (options?.allowAdjacentStop && isPointAdjacentTo(currentNode, end))
        ) {
            const path = pathTo(currentNode);
            return {
                path: path,
                graph: mapGraph(graph),
            };
        }

        // Normal case -- move currentNode from open to closed, process each of its neighbors.
        currentNode.closed = true;

        // Find all neighbors for the current node.
        const neighbors = graph.neighbors(currentNode);

        for (let i = 0, il = neighbors.length; i < il; ++i) {
            const neighbor = neighbors[i];
            const neighborWeight = weightModifier(neighbor);
            if (neighbor.closed || neighborWeight === 0) {
                // Not a valid node to process, skip to next neighbor.
                // if the weight modifier returns 0 it is absolutely
                // impassable and should not be ranked
                continue;
            }

            // The g score is the shortest distance from start to current node.
            // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
            const gScore = currentNode.g + neighborWeight;
            const beenVisited = neighbor.visited;

            if (!beenVisited || gScore < neighbor.g) {
                // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
                neighbor.visited = true;
                neighbor.parent = currentNode;
                neighbor.h = neighbor.h || heuristics(neighbor, end);
                neighbor.g = gScore;
                neighbor.f = neighbor.g + neighbor.h;
                graph.markDirtyNode(neighbor);

                if (closestNode) {
                    // If the neighbour is closer than the current closestNode or if it's equally close but has
                    // a cheaper path than the current closest node then it becomes the closest node
                    if (
                        neighbor.h < closestNode.h ||
                        (neighbor.h === closestNode.h &&
                            neighbor.g < closestNode.g)
                    ) {
                        closestNode = neighbor;
                    }
                }

                if (!beenVisited) {
                    // Pushing to heap will put it in proper place based on the 'f' value.
                    openHeap.push(neighbor);
                } else {
                    // Already seen the node, but since it has been rescored we need to reorder it in the heap
                    openHeap.rescoreItem(neighbor);
                }
            }
        }
    }

    // If the closest node is not the start node, we have a partial path
    if (!pointEquals(start, closestNode)) {
        const path = pathTo(closestNode);
        return {
            path: path,
            graph: mapGraph(graph),
        };
    }

    // No result was found - empty array signifies failure to find path.
    return {
        path: [],
        graph: [],
    };
}

function createHeap(): BinaryHeap<GraphNode> {
    return new BinaryHeap((node) => node.f);
}

/**
 * Walk the parent chain from a node back towards the search origin.
 *
 * The result reads as the steps to take. It includes the node passed in and
 * leaves out the origin, since a caller already standing on the origin has no
 * reason to move onto it.
 */
function pathTo(node: GraphNode): GraphNode[] {
    let curr = node;
    const path: GraphNode[] = [];
    while (curr.parent) {
        path.unshift(curr);
        curr = curr.parent;
    }
    return path;
}

function mapGraph(graph: Graph): SearchedNode[] {
    return graph.getNodes().map((node) => {
        return {
            x: node.x,
            y: node.y,
            weight: node.weight,
            visited: node.visited,
            g: node.g,
            totalCost: node.f,
        };
    });
}

export type SearchedNode = {
    x: number;
    y: number;
    weight: number;
    g: number;
    visited: boolean;
    totalCost: number;
};

export type SearchResult = {
    /**
     * The steps from the search origin to the goal, with the origin left out.
     *
     * The entries are live GraphNode instances widened to Point. Read x and y
     * from them and leave everything else alone. The next aStarSearch call runs
     * graph.cleanDirtyNodes(), which wipes parent, g, f, h, visited and closed
     * on every node listed here. Copy the coordinates out if the path has to
     * outlive the search that produced it.
     */
    path: Point[];
    /**
     * Every node the search touched, flattened for the debug overlays.
     *
     * This gets built on each successful search and allocates one fresh object
     * per explored node. Only two interaction states read it,
     * attackSelectionState and actorContextActionState. Every other caller pays
     * for the copy and throws it away.
     */
    graph: SearchedNode[];
};
