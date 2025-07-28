import { Event } from "../../common/event.js";
import type { GameServerMessage } from "../../server/gameServerMessageBus.js";
import { GameServerConnection } from "./gameServerConnection.js";

export class WebworkerServerConnection implements GameServerConnection {
    private worker: Worker;
    private _onMessageEvent: Event<GameServerMessage>;

    public get onMessage(): Event<GameServerMessage> {
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
    postAction(action: EntityAction) {
        const message: GameServerMessage = {
            entries: [{ id: "entityAction", entityAction: action }],
        };
        console.log("Sending message", message);
        this.worker.postMessage(message);
    }
}
