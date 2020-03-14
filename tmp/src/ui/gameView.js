"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const game_1 = require("../game/game");
const canvasElementId = "gameCanvas";
class GameView {
    init() {
        this.game = new game_1.Game(canvasElementId);
    }
}
exports.GameView = GameView;
//# sourceMappingURL=gameView.js.map