import { View } from "../view";
import "./gameView.css";
import { Game } from "../../game/game";
import { ViewContext } from "../viewContext";
import { WebsocketConnection } from "../../network/websocketConnection";
import { WebsocketChannels } from "../../../common/websocket";
import { GameEvent } from "../../../common/data/event/gameEvent";

const canvasElementId = "gameCanvas";

export class GameView extends View {
    private game: Game;

    public render(): HTMLElement {
        const canvasWrapper = document.createElement("div");
        canvasWrapper.id = "canvaswrapper";
        const canvasElement = document.createElement("canvas");
        canvasElement.id = canvasElementId;
        canvasWrapper.append(canvasElement);
        return canvasWrapper;
    }

    public onMounted(viewContext: ViewContext): void {
        console.log("Booting game");
        const gameChannel = viewContext.ioc
            .getService<WebsocketConnection>(WebsocketConnection.ServiceName)
            .getChannel<GameEvent>(WebsocketChannels.GAME);
        this.game = new Game(canvasElementId, gameChannel);
    }

    public dispose(): void {
        console.log("Disposing gameview");
        this.game.dispose();
    }
}
