import { Point } from "../../common/point";
import { Graph, GraphNode } from "./graph";

export type LazyGraphNodeFunction = (point: Point) => number | null;

export class LazyGraph implements Graph {
    private _nodes: { [x: number]: { [y: number]: GraphNode } } = {};
    constructor(private nodeFunction: LazyGraphNodeFunction) {}
    offsetX: number = 0;
    offsetY: number = 0;
    /**
     * Invalidate a point lazily. This means it is deleted by not
     * re-generated until its needed
     * @param point
     */
    invalidatePoint(point: Point) {
        if (!!this._nodes[point.x]) {
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
        if (!!westNode) {
            neighborNodes.push(westNode);
        }

        // East
        const eastNode = this.nodeAt(x + 1, y);
        if (!!eastNode) {
            neighborNodes.push(eastNode);
        }

        // South
        const southNode = this.nodeAt(x, y - 1);
        if (!!southNode) {
            neighborNodes.push(southNode);
        }

        // North
        const northNode = this.nodeAt(x, y + 1);
        if (!!northNode) {
            neighborNodes.push(northNode);
        }

        return neighborNodes;
    }

    private setNode(graphNode: GraphNode) {
        if (!this._nodes[graphNode.x]) {
            this._nodes[graphNode.x] = {};
        }

        this._nodes[graphNode.x][graphNode.y] = graphNode;
    }
}
