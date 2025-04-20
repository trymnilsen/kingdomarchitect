import { Event } from "../../common/event.js";
import { GameServerConnection } from "./gameServerConnection.js";

export class WebworkerServerConnection implements GameServerConnection {
    private worker: Worker;
    private _onMessageEvent: Event<object>;

    public get onMessage(): Event<object> {
        return this._onMessageEvent;
    }

    constructor() {
        console.log("Start webworker");
        this._onMessageEvent = new Event();
        this.worker = new Worker("dist/server/webWorkerServer.js");
        this.worker.onmessage = (message) => {
            console.log("Message from worker: ", message);
            this._onMessageEvent.publish(message);
        };
    }
    postCommand() {
        //this.worker.postMessage("foo");
    }
}
