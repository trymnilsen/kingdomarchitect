"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chunk_1 = require("./chunk");
const player_1 = require("./player");
const whatAmILookingAt_1 = require("./whatAmILookingAt");
exports.WorldSceneName = "world";
class WorldScene {
    constructor(rootNode, state) {
        this.chunks = new chunk_1.ChunkHandler(rootNode);
        this.player = new player_1.Player(rootNode, state.get("player"));
        new whatAmILookingAt_1.WhatAmILookingAt(rootNode, state.get("waila"));
    }
    transitionTo() { }
    render(context) {
        this.chunks.render(context);
    }
    dispose() { }
}
exports.WorldScene = WorldScene;
//# sourceMappingURL=worldScene.js.map