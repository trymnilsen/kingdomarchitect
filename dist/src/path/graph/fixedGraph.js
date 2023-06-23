function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { GraphNode } from "./graph.js";
export class FixedGraph {
    get offsetX() {
        return this._offsetX;
    }
    get offsetY() {
        return this._offsetY;
    }
    invalidatePoint(point) {
        this.generateGrid();
    }
    nodeAt(x, y) {
        return this.grid[x][y];
    }
    cleanDirtyNodes() {
        for (const node of this.dirtyNodes){
            node.clean();
        }
        this.dirtyNodes = [];
    }
    markDirtyNode(node) {
        this.dirtyNodes.push(node);
    }
    neighbors(node) {
        const neighborNodes = [];
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
    getNodes() {
        return this.nodes;
    }
    generateGrid() {
        const generateResult = this.weightFunction();
        const weights = generateResult.weights;
        this.grid = [];
        this.nodes = [];
        this.dirtyNodes = [];
        this._offsetX = generateResult.offsetX;
        this._offsetY = generateResult.offsetY;
        for(let x = 0; x < weights.length; x++){
            this.grid[x] = [];
            const row = weights[x];
            for(let y = 0; y < row.length; y++){
                const weight = row[y];
                const node = new GraphNode(x, y, weight);
                this.grid[x][y] = node;
                this.nodes.push(node);
            }
        }
    }
    constructor(weightFunction){
        _define_property(this, "weightFunction", void 0);
        _define_property(this, "nodes", void 0);
        _define_property(this, "grid", void 0);
        _define_property(this, "dirtyNodes", void 0);
        _define_property(this, "_offsetX", void 0);
        _define_property(this, "_offsetY", void 0);
        this.weightFunction = weightFunction;
        this.nodes = [];
        this.grid = [];
        this.dirtyNodes = [];
        this._offsetX = 0;
        this._offsetY = 0;
        this.generateGrid();
    }
}
