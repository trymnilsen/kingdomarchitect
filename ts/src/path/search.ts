import { Point, pointEquals } from "../common/point.js";
import { BinaryHeap } from "./binaryHeap.js";
import { Graph, GraphNode } from "./graph/graph.js";
import { manhattanDistance } from "./pathHeuristics.js";

export class PathSearch {
    private graph: Graph;

    get offset(): Point {
        return {
            x: this.graph.offsetX,
            y: this.graph.offsetY,
        };
    }

    constructor(graph: Graph) {
        this.graph = graph;
    }

    invalidateGraphPoint(point: Point): void {
        this.graph.invalidatePoint(point);
    }

    search(
        from: Point,
        to: Point,
        _allowPartialPaths: boolean,
        weightModifier: (graphNode: GraphNode) => number,
    ): SearchResult {
        const start = this.graph.nodeAt(from.x, from.y);
        const end = this.graph.nodeAt(to.x, to.y);
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

        let closestNode = start;
        this.graph.cleanDirtyNodes();

        const openHeap = this.createHeap();
        //var closestNode = start; // set start node to be closest if required

        start.h = manhattanDistance(start, end);
        this.graph.markDirtyNode(start);

        openHeap.push(start);

        while (openHeap.size > 0) {
            // Grab the lowest f(x) to process next.
            // Heap keeps this sorted for us.
            const currentNode = openHeap.pop();

            // End case -- result has been found, return the traced path.
            if (currentNode === end) {
                const path = this.pathTo(currentNode);
                return {
                    path: path,
                    graph: this.mapGraph(),
                };
            }

            // Normal case -- move currentNode from open to closed,
            // process each of its neighbors.
            currentNode.closed = true;

            // Find all neighbors for the current node.
            const neighbors = this.graph.neighbors(currentNode);

            for (let i = 0, il = neighbors.length; i < il; ++i) {
                const neighbor = neighbors[i];
                const neighborWeight = weightModifier(neighbor);
                if (neighbor.closed || neighborWeight === 0) {
                    // Not a valid node to process, skip to next neighbor.
                    // if the weight modifier returns 0 it is absolutely
                    // impassable and should not be ranked
                    continue;
                }

                // The g score is the shortest distance from start
                // to current node. We need to check if the path we
                // have arrived at this neighbor is the shortest one
                // we have seen yet.
                const gScore = currentNode.g + neighborWeight;
                const beenVisited = neighbor.visited;

                if (!beenVisited || gScore < neighbor.g) {
                    // Found an optimal (so far) path to this node.
                    // Take score for node to see how good it is.
                    neighbor.visited = true;
                    neighbor.parent = currentNode;
                    neighbor.h = manhattanDistance(neighbor, end);
                    neighbor.g = gScore;
                    neighbor.f = neighbor.g + neighbor.h;
                    this.graph.markDirtyNode(neighbor);

                    // If the neighbour is closer than the current closestNode
                    // or if it's equally close but has a cheaper path than
                    // the current closest node then it becomes the closest node
                    const neighborCloserThanClosest =
                        neighbor.h < closestNode.h;
                    const neighborIsCheaper =
                        neighbor.h === closestNode.h &&
                        neighbor.g < closestNode.g;

                    if (neighborCloserThanClosest || neighborIsCheaper) {
                        closestNode = neighbor;
                    }

                    if (!beenVisited) {
                        // Pushing to heap will put it in proper place
                        // based on the 'f' value.
                        openHeap.push(neighbor);
                    } else {
                        // Already seen the node, but since it has been
                        // rescored we need to reorder it in the heap
                        openHeap.rescoreItem(neighbor);
                    }
                }
            }
        }

        // If the closest node is not the start node, we have a partial path
        if (!pointEquals(start, closestNode)) {
            const path = this.pathTo(closestNode);
            return {
                path: path,
                graph: this.mapGraph(),
            };
        }

        // No result was found - empty array signifies failure to find path.
        return {
            path: [],
            graph: [],
        };
    }

    private createHeap(): BinaryHeap<GraphNode> {
        return new BinaryHeap((node) => node.f);
    }

    private pathTo(node: GraphNode) {
        let curr = node;
        const path: GraphNode[] = [];
        while (curr.parent) {
            path.unshift(curr);
            curr = curr.parent;
        }
        return path;
    }

    private mapGraph(): SearchedNode[] {
        return this.graph.getNodes().map((node) => {
            return {
                x: node.x,
                y: node.y,
                weight: node.weight,
                visited: node.visited,
                totalCost: node.f,
            };
        });
    }
}

export interface SearchedNode {
    x: number;
    y: number;
    weight: number;
    visited: boolean;
    totalCost: number;
}

export interface SearchResult {
    path: Point[];
    graph: SearchedNode[];
}
