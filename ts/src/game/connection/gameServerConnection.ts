import type { GameCommand } from "../message/gameCommand.js";
import { Event } from "../../common/event.js";
import type { GameMessage } from "../message/gameMessage.js";

export interface GameServerConnection {
    readonly onMessage: Event<GameMessage>;
    postCommand(command: GameCommand);
}
