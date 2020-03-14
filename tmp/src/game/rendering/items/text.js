"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const renderNode_1 = require("./renderNode");
class TextVisual extends renderNode_1.RenderNode {
    constructor(config) {
        super(config);
        this.config = config;
    }
    render(context) {
        let rx = this.absolutePosition.x + this._screenSpacePosition.x;
        let ry = this.absolutePosition.y + this._screenSpacePosition.y;
        context.fillStyle = this.config.color;
        context.font = "16px Arial";
        context.textAlign = this.config.align || "left";
        context.fillText(this.config.text, rx, ry);
        context.textAlign = "left";
    }
}
exports.TextVisual = TextVisual;
//# sourceMappingURL=text.js.map