import { View } from "../view";
import "./gameView.css";
import { Game } from "../../game/game";

const canvasElementId = "gameCanvas";

export class GameView extends View {
    private game: Game;

    public render(): HTMLElement {
        const canvasElement = document.createElement("canvas");
        canvasElement.id = canvasElementId;
        this.game = new Game(canvasElementId);
        return canvasElement;
    }

    public dispose(): void {
        console.log("Disposing gameview");
        this.game.dispose();
    }
}
