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
export class LazyGraph {
    /**
     * Invalidate a point lazily. This means it is deleted by not
     * re-generated until its needed
     * @param point
     */ invalidatePoint(point) {
        if (!!this._nodes[point.x]) {
            delete this._nodes[point.x][point.y];
        }
    }
    nodeAt(x, y) {
        if (!!this._nodes[x] && !!this._nodes[x][y]) {
            return this._nodes[x][y];
        } else {
            const weight = this.nodeFunction({
                x,
                y
            });
            if (weight === null) {
                return null;
            }
            const node = new GraphNode(x, y, weight);
            this.setNode(node);
            return node;
        }
    }
    cleanDirtyNodes() {
        for (const i of Object.values(this._nodes)){
            for (const j of Object.values(i)){
                j.clean();
            }
        }
    }
    markDirtyNode(point) {
        if (!!this._nodes[point.x] && !!this._nodes[point.x][point.y]) {
            this._nodes[point.x][point.y].isDirty = true;
        }
    }
    neighbors(point) {
        const neighborNodes = [];
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
        /*
        console.log(
            `Neighbor nodes of ${x},${y}`,
            neighborNodes.map((item) => {
                return `${item.x},${item.y}`;
            })
        );*/ return neighborNodes;
    }
    getNodes() {
        const nodesList = [];
        for (const i of Object.values(this._nodes)){
            for (const j of Object.values(i)){
                nodesList.push(j);
            }
        }
        return nodesList;
    }
    setNode(graphNode) {
        if (!this._nodes[graphNode.x]) {
            this._nodes[graphNode.x] = {};
        }
        this._nodes[graphNode.x][graphNode.y] = graphNode;
    }
    constructor(nodeFunction){
        _define_property(this, "nodeFunction", void 0);
        _define_property(this, "_nodes", void 0);
        _define_property(this, "offsetX", void 0);
        _define_property(this, "offsetY", void 0);
        this.nodeFunction = nodeFunction;
        this._nodes = {};
        this.offsetX = 0;
        this.offsetY = 0;
    }
}
