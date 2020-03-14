"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rectangle_1 = require("../../rendering/items/rectangle");
const chunk_1 = require("./chunk");
class Player {
    constructor(renderNode, state) {
        const position = state.get("position").value();
        this.playerVisual = new rectangle_1.Rectangle({
            width: chunk_1.TileSize - 8,
            height: chunk_1.TileSize - 8,
            color: "red",
            x: position.x * chunk_1.TileSize + 4,
            y: position.y * chunk_1.TileSize + 4,
            depth: 1000
        });
        renderNode.addChild(this.playerVisual);
        state.listen((event) => {
            console.log("Player updated", event);
            const newPosition = event.data;
            this.playerVisual.position = {
                x: newPosition.x * chunk_1.TileSize + 4,
                y: newPosition.y * chunk_1.TileSize + 4
            };
        });
    }
}
exports.Player = Player;
//# sourceMappingURL=player.js.map