import type { GameCommand } from "./message/gameCommand.ts";
import { Event } from "../common/event.ts";
import type { GameMessage } from "./message/gameMessage.ts";

export interface GameServerConnection {
    readonly onMessage: Event<GameMessage>;
    postCommand(command: GameCommand);
}
