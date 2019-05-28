import { Game } from "../game/game";

const canvasElementId = "gameCanvas";

export class GameView {
    private game: Game;

    public init() {
        this.game = new Game(canvasElementId);
    }
}
