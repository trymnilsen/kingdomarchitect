import { Event } from "../../common/event.js";

export interface GameServerConnection {
    readonly onMessage: Event<object>;
    postCommand();
}
