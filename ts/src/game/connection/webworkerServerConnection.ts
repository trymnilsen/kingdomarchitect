import type { GameCommand } from "../command/gameCommand.js";
import { Event } from "../../common/event.js";
import { GameServerConnection } from "./gameServerConnection.js";
import type { GameMessage } from "../command/gameMessage.js";

export class WebworkerServerConnection implements GameServerConnection {
    private worker: Worker;
    private _onMessageEvent: Event<GameMessage>;

    public get onMessage(): Event<GameMessage> {
        return this._onMessageEvent;
    }

    constructor() {
        console.log("Start webworker");
        this._onMessageEvent = new Event();
        this.worker = new Worker("dist/server/webWorkerServer.js");
        this.worker.onmessage = (message) => {
            this._onMessageEvent.publish(message.data);
        };
    }

    postCommand(command: GameCommand) {
        console.log("Sending command", command);
        this.worker.postMessage(command);
    }
}
