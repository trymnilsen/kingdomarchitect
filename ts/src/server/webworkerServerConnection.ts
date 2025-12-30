import type { GameCommand } from "./message/gameCommand.ts";
import { Event } from "../common/event.ts";
import { GameServerConnection } from "./gameServerConnection.ts";
import type { CommandGameMessage, GameMessage } from "./message/gameMessage.ts";

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
        const message: CommandGameMessage = {
            type: "command",
            command: command,
        };
        this.worker.postMessage(message);
    }
}
