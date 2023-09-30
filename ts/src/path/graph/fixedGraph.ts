import { Point } from "../../common/point.js";
import { Graph, GraphNode } from "./graph.js";

export type WeightFunction = () => {
    offsetX: number;
    offsetY: number;
    weights: number[][];
};

export class FixedGraph implements Graph {
    private nodes: GraphNode[] = [];
    private grid: GraphNode[][] = [];
    private dirtyNodes: GraphNode[] = [];
    private _offsetX: number = 0;
    private _offsetY: number = 0;

    get offsetX(): number {
        return this._offsetX;
    }

    get offsetY(): number {
        return this._offsetY;
    }

    constructor(private weightFunction: WeightFunction) {
        this.generateGrid();
    }

    invalidatePoint() {
        this.generateGrid();
    }

    nodeAt(x: number, y: number): GraphNode {
        return this.grid[x][y];
    }

    cleanDirtyNodes() {
        for (const node of this.dirtyNodes) {
            node.clean();
        }
        this.dirtyNodes = [];
    }

    markDirtyNode(node: GraphNode) {
        this.dirtyNodes.push(node);
    }

    neighbors(node: GraphNode): GraphNode[] {
        const neighborNodes: GraphNode[] = [];
        const x = node.x;
        const y = node.y;

        // West
        if (this.grid[x - 1] && this.grid[x - 1][y]) {
            neighborNodes.push(this.grid[x - 1][y]);
        }

        // East
        if (this.grid[x + 1] && this.grid[x + 1][y]) {
            neighborNodes.push(this.grid[x + 1][y]);
        }

        // South
        if (this.grid[x] && this.grid[x][y - 1]) {
            neighborNodes.push(this.grid[x][y - 1]);
        }

        // North
        if (this.grid[x] && this.grid[x][y + 1]) {
            neighborNodes.push(this.grid[x][y + 1]);
        }

        return neighborNodes;
    }

    getNodes(): GraphNode[] {
        return this.nodes;
    }

    private generateGrid() {
        const generateResult = this.weightFunction();
        const weights = generateResult.weights;
        this.grid = [];
        this.nodes = [];
        this.dirtyNodes = [];
        this._offsetX = generateResult.offsetX;
        this._offsetY = generateResult.offsetY;

        for (let x = 0; x < weights.length; x++) {
            this.grid[x] = [];
            const row = weights[x];
            for (let y = 0; y < row.length; y++) {
                const weight = row[y];
                const node = new GraphNode(x, y, weight);
                this.grid[x][y] = node;
                this.nodes.push(node);
            }
        }
    }
}
