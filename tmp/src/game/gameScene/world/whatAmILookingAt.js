"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const renderNode_1 = require("../../rendering/items/renderNode");
const rectangle_1 = require("../../rendering/items/rectangle");
const chunk_1 = require("./chunk");
const text_1 = require("../../rendering/items/text");
class WhatAmILookingAt {
    constructor(renderNode, state) {
        //const position = state.get("position").value<Point>();
        this.container = new renderNode_1.UiRenderNode({
            x: window.innerWidth / 2 - 100 + chunk_1.TileSize / 2,
            y: 32,
            depth: 1000
        });
        const rect = new rectangle_1.Rectangle({
            width: 200,
            height: 50,
            color: "#404040",
            x: 0,
            y: 0,
            depth: 1000
        });
        this.label = new text_1.TextVisual({
            text: "Tree",
            x: 100,
            y: 32,
            color: "white",
            align: "center",
            depth: 1001
        });
        this.container.addChild(rect);
        this.container.addChild(this.label);
        renderNode.addChild(this.container);
    }
}
exports.WhatAmILookingAt = WhatAmILookingAt;
//# sourceMappingURL=whatAmILookingAt.js.map