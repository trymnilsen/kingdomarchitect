import { View } from "../view";
import "./gameView.css";
import { Game } from "../../game/game";

const canvasWrapperId = "gameCanvasWrapper";

export class GameView extends View {
    private game: Game;

    public render(): HTMLElement {
        const canvasWrapper = document.createElement("div");
        canvasWrapper.id = canvasWrapperId;
        this.game = new Game(canvasWrapperId);
        return canvasWrapper;
    }
    public dispose(): void {
        console.log("Disposing gameview");
        this.game.dispose();
    }
}