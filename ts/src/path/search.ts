import { Point } from "../common/point";
import { BinaryHeap } from "./binaryHeap";
import { Graph, GraphNode } from "./graph";
import { manhattanDistance } from "./pathHeuristics";

export class PathSearch {
    private graph: Graph;
    constructor(graph: Graph) {
        this.graph = graph;
    }

    getGraph(): Graph {
        return this.graph;
    }

    updateGraph(graph: Graph) {
        this.graph = graph;
    }

    search(from: Point, to: Point): Point[] {
        let start = this.graph.nodeAt(from.x, from.y);
        let end = this.graph.nodeAt(to.x, to.y);
        if (!start) {
            console.warn("From point not in graph", from);
            return [];
        }

        if (!end) {
            console.warn("To point not in graph", to);
            return [];
        }

        this.graph.cleanDirtyNodes();

        var openHeap = this.createHeap();
        var closestNode = start; // set the start node to be the closest if required

        start.h = manhattanDistance(start, end);
        this.graph.markDirtyNode(start);

        openHeap.push(start);

        while (openHeap.size > 0) {
            // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
            var currentNode = openHeap.pop();

            // End case -- result has been found, return the traced path.
            if (currentNode === end) {
                return this.pathTo(currentNode);
            }

            // Normal case -- move currentNode from open to closed, process each of its neighbors.
            currentNode.closed = true;

            // Find all neighbors for the current node.
            var neighbors = this.graph.neighbors(currentNode);

            for (var i = 0, il = neighbors.length; i < il; ++i) {
                var neighbor = neighbors[i];

                if (neighbor.closed || neighbor.isWall) {
                    // Not a valid node to process, skip to next neighbor.
                    continue;
                }

                // The g score is the shortest distance from start to current node.
                // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
                var gScore = currentNode.g + neighbor.weight;
                var beenVisited = neighbor.visited;

                if (!beenVisited || gScore < neighbor.g) {
                    // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
                    neighbor.visited = true;
                    neighbor.parent = currentNode;
                    neighbor.h = neighbor.h || manhattanDistance(neighbor, end);
                    neighbor.g = gScore;
                    neighbor.f = neighbor.g + neighbor.h;
                    this.graph.markDirtyNode(neighbor);
                    /*                     if (closest) {
                        // If the neighbour is closer than the current closestNode or if it's equally close but has
                        // a cheaper path than the current closest node then it becomes the closest node
                        if (
                            neighbor.h < closestNode.h ||
                            (neighbor.h === closestNode.h &&
                                neighbor.g < closestNode.g)
                        ) {
                            closestNode = neighbor;
                        }
                    } */

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

        // No result was found - empty array signifies failure to find path.
        return [];
    }

    private createHeap(): BinaryHeap<GraphNode> {
        return new BinaryHeap((node) => node.f);
    }

    private pathTo(node: GraphNode) {
        var curr = node;
        var path: GraphNode[] = [];
        while (curr.parent) {
            path.unshift(curr);
            curr = curr.parent;
        }
        return path;
    }
}
