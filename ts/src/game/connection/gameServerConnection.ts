import { Event } from "../../common/event.js";
import type { GameServerMessage } from "../../server/gameServerMessageBus.js";

export interface GameServerConnection {
    readonly onMessage: Event<GameServerMessage>;
    postCommand();
}
