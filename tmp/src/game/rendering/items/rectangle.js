"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const renderNode_1 = require("./renderNode");
class Rectangle extends renderNode_1.RenderNode {
    constructor(config) {
        super(config);
        this.config = config;
    }
    render(context) {
        let rx = this.absolutePosition.x + this._screenSpacePosition.x;
        let ry = this.absolutePosition.y + this._screenSpacePosition.y;
        let rw = this.config.width;
        let rh = this.config.height;
        if (this.config.strokeWidth > 0) {
            rx += this.config.strokeWidth;
            ry += this.config.strokeWidth;
            rw -= this.config.strokeWidth * 2;
            rh -= this.config.strokeWidth * 2;
            const color = this.config.strokeColor || "black";
            context.fillStyle = color;
            context.fillRect(this.absolutePosition.x + this._screenSpacePosition.x, this.absolutePosition.y + this._screenSpacePosition.y, this.config.width, this.config.height);
        }
        context.fillStyle = this.config.color;
        context.fillRect(rx, ry, rw, rh);
    }
}
exports.Rectangle = Rectangle;
//# sourceMappingURL=rectangle.js.map