import { createLogger } from "../common/logging/logger.ts";
import type { GameCommand } from "./message/gameCommand.ts";
import { Event } from "../common/event.ts";
import { GameServerConnection } from "./gameServerConnection.ts";
import type { CommandGameMessage, GameMessage } from "./message/gameMessage.ts";

const log = createLogger("server");

export class WebworkerServerConnection implements GameServerConnection {
    private worker: Worker;
    private _onMessageEvent: Event<GameMessage>;

    public get onMessage(): Event<GameMessage> {
        return this._onMessageEvent;
    }

    constructor() {
        log.info("Start webworker");
        this._onMessageEvent = new Event();
        this.worker = new Worker("dist/server/webWorkerServer.js");
        this.worker.onmessage = (message) => {
            this._onMessageEvent.publish(message.data);
        };
    }

    postCommand(command: GameCommand) {
        log.debug("Sending command", { command });
        const message: CommandGameMessage = {
            type: "command",
            command: command,
        };
        this.worker.postMessage(message);
    }
}
