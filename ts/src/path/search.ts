import { Point, pointEquals } from "../common/point";
import { BinaryHeap } from "./binaryHeap";
import { Graph, GraphNode, WeightNode } from "./graph";
import { GraphGenerator } from "./graphGenerator";
import { manhattanDistance } from "./pathHeuristics";

export class PathSearch {
    private generator: GraphGenerator;
    private _graph: Graph | undefined;

    private get graph(): Graph {
        if (!this._graph) {
            this._graph = this.generator.createGraph();
        }

        return this._graph;
    }

    get offset(): Point {
        return {
            x: this.graph.offsetX,
            y: this.graph.offsetY,
        };
    }

    constructor(generator: GraphGenerator) {
        this.generator = generator;
    }

    getWeights(): WeightNode[][] {
        return this.graph.weights;
    }

    invalidateGraph(): void {
        this._graph = undefined;
    }

    search(
        from: Point,
        to: Point,
        allowPartialPaths: boolean,
        weightModifier: (graphNode: GraphNode) => number
    ): Point[] {
        const start = this.graph.nodeAt(from.x, from.y);
        const end = this.graph.nodeAt(to.x, to.y);
        let closestNode = start;
        if (!start) {
            console.warn("From point not in graph", from);
            return [];
        }

        if (!end) {
            console.warn("To point not in graph", to);
            return [];
        }

        this.graph.cleanDirtyNodes();

        const openHeap = this.createHeap();
        //var closestNode = start; // set the start node to be the closest if required

        start.h = manhattanDistance(start, end);
        this.graph.markDirtyNode(start);

        openHeap.push(start);

        while (openHeap.size > 0) {
            // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
            const currentNode = openHeap.pop();

            // End case -- result has been found, return the traced path.
            if (currentNode === end) {
                return this.pathTo(currentNode);
            }

            // Normal case -- move currentNode from open to closed, process each of its neighbors.
            currentNode.closed = true;

            // Find all neighbors for the current node.
            const neighbors = this.graph.neighbors(currentNode);

            for (var i = 0, il = neighbors.length; i < il; ++i) {
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
                    neighbor.h = neighbor.h || manhattanDistance(neighbor, end);
                    neighbor.g = gScore;
                    neighbor.f = neighbor.g + neighbor.h;
                    this.graph.markDirtyNode(neighbor);

                    // If the neighbour is closer than the current closestNode or if it's equally close but has
                    // a cheaper path than the current closest node then it becomes the closest node
                    const neighborCloserThanClosest =
                        neighbor.h < closestNode.h;
                    const neighborIsCheaper =
                        neighbor.h === closestNode.h &&
                        neighbor.g < closestNode.g;

                    if (neighborCloserThanClosest || neighborIsCheaper) {
                        closestNode = neighbor;
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
            return this.pathTo(closestNode);
        }

        // No result was found - empty array signifies failure to find path.
        return [];
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
}
