import type { GameCommand } from "../command/gameCommand.js";
import { Event } from "../../common/event.js";
import type { GameMessage } from "../command/gameMessage.js";

export interface GameServerConnection {
    readonly onMessage: Event<GameMessage>;
    postCommand(command: GameCommand);
}
