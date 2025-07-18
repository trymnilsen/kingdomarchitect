import { Point, pointEquals } from "../../common/point.js";
import { BinaryHeap } from "../../common/structure/binaryHeap.js";
import { Graph, GraphNode } from "./graph/graph.js";
import { manhattanDistance } from "./pathHeuristics.js";

export function aStarSearch(
    from: Point,
    to: Point,
    graph: Graph,
    _allowPartialPaths: boolean,
    weightModifier: (graphNode: GraphNode) => number,
): SearchResult {
    const start = graph.nodeAt(from.x, from.y);
    const end = graph.nodeAt(to.x, to.y);
    if (!start) {
        console.warn("From point not in graph", from);
        return {
            graph: [],
            path: [],
        };
    }

    if (!end) {
        console.warn("To point not in graph", to);
        return {
            graph: [],
            path: [],
        };
    }

    const heuristics = (from: Point, to: Point) => {
        return manhattanDistance(from, to) * 2;
    };

    let closestNode = start;
    graph.cleanDirtyNodes();

    const openHeap = createHeap();
    //var closestNode = start; // set start node to be closest if required

    start.h = heuristics(start, end);
    graph.markDirtyNode(start);

    openHeap.push(start);

    while (openHeap.size > 0) {
        // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
        var currentNode = openHeap.pop();

        // End case -- result has been found, return the traced path.
        if (currentNode === end) {
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

        for (var i = 0, il = neighbors.length; i < il; ++i) {
            var neighbor = neighbors[i];
            const neighborWeight = weightModifier(neighbor);
            if (neighbor.closed || neighborWeight === 0) {
                // Not a valid node to process, skip to next neighbor.
                // if the weight modifier returns 0 it is absolutely
                // impassable and should not be ranked
                continue;
            }

            // The g score is the shortest distance from start to current node.
            // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
            var gScore = currentNode.g + neighborWeight;
            var beenVisited = neighbor.visited;

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

function pathTo(node: GraphNode) {
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
    path: Point[];
    graph: SearchedNode[];
};
