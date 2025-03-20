import { Point } from "../../../common/point.js";
import { Graph, GraphNode } from "./graph.js";

export type LazyGraphNodeFunction = (point: Point) => number | null;

export class LazyGraph implements Graph {
    private _nodes: Record<number, Record<number, GraphNode>> = {};
    constructor(private nodeFunction: LazyGraphNodeFunction) {}
    offsetX = 0;
    offsetY = 0;
    /**
     * Invalidate a point lazily. This means it is deleted by not
     * re-generated until its needed
     * @param point
     */
    invalidatePoint(point: Point) {
        if (this._nodes[point.x]) {
            delete this._nodes[point.x][point.y];
        }
    }
    nodeAt(x: number, y: number): GraphNode | null {
        if (!!this._nodes[x] && !!this._nodes[x][y]) {
            return this._nodes[x][y];
        } else {
            const weight = this.nodeFunction({ x, y });
            if (weight === null) {
                return null;
            }

            const node = new GraphNode(x, y, weight);
            this.setNode(node);
            return node;
        }
    }
    cleanDirtyNodes() {
        for (const i of Object.values(this._nodes)) {
            for (const j of Object.values(i)) {
                j.clean();
            }
        }
    }
    markDirtyNode(point: GraphNode) {
        if (!!this._nodes[point.x] && !!this._nodes[point.x][point.y]) {
            this._nodes[point.x][point.y].isDirty = true;
        }
    }
    neighbors(point: GraphNode): GraphNode[] {
        const neighborNodes: GraphNode[] = [];
        const x = point.x;
        const y = point.y;

        // West
        const westNode = this.nodeAt(x - 1, y);
        if (westNode) {
            neighborNodes.push(westNode);
        }

        // East
        const eastNode = this.nodeAt(x + 1, y);
        if (eastNode) {
            neighborNodes.push(eastNode);
        }

        // South
        const southNode = this.nodeAt(x, y - 1);
        if (southNode) {
            neighborNodes.push(southNode);
        }

        // North
        const northNode = this.nodeAt(x, y + 1);
        if (northNode) {
            neighborNodes.push(northNode);
        }
        /*
        console.log(
            `Neighbor nodes of ${x},${y}`,
            neighborNodes.map((item) => {
                return `${item.x},${item.y}`;
            })
        );*/
        return neighborNodes;
    }

    getNodes(): GraphNode[] {
        const nodesList: GraphNode[] = [];
        for (const i of Object.values(this._nodes)) {
            for (const j of Object.values(i)) {
                nodesList.push(j);
            }
        }

        return nodesList;
    }

    private setNode(graphNode: GraphNode) {
        if (!this._nodes[graphNode.x]) {
            this._nodes[graphNode.x] = {};
        }

        this._nodes[graphNode.x][graphNode.y] = graphNode;
    }
}
