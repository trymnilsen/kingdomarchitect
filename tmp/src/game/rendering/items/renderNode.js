"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const point_1 = require("../../../data/point");
class RenderNode {
    constructor(nodeConfig) {
        this.depth = 0;
        this._children = [];
        this.position = { x: 0, y: 0 };
        if (!!nodeConfig) {
            this.position = { x: nodeConfig.x, y: nodeConfig.y };
            if (!!nodeConfig.depth) {
                this.depth = nodeConfig.depth;
            }
        }
    }
    render(context) { }
    addChild(child) {
        if (child == this) {
            throw new Error("Cannot add self");
        }
        this._children.push(child);
    }
    get children() {
        return this._children;
    }
    get absolutePosition() {
        return this._absolutePosition;
    }
    updateTransform(parentPoint, cameraScreenSpace) {
        if (!parentPoint) {
            //No parent, use zero
            parentPoint = { x: 0, y: 0 };
        }
        this._screenSpacePosition = cameraScreenSpace;
        this._absolutePosition = point_1.addPoint(parentPoint, this.position);
        this.children.forEach((p) => p.updateTransform(this._absolutePosition, cameraScreenSpace));
    }
}
exports.RenderNode = RenderNode;
class UiRenderNode extends RenderNode {
    updateTransform(parentPoint, cameraScreenSpace) {
        //Ui nodes are never moved based on camera
        if (!parentPoint) {
            //No parent, use zero
            parentPoint = { x: 0, y: 0 };
        }
        this._absolutePosition = point_1.addPoint(parentPoint, this.position);
        this.children.forEach((p) => p.updateTransform(this._absolutePosition, { x: 0, y: 0 }));
    }
}
exports.UiRenderNode = UiRenderNode;
//# sourceMappingURL=renderNode.js.map