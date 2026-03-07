import { createLogger } from "../common/logging/logger.ts";
import { Event } from "../common/event.ts";
import { GameServer } from "./gameServer.ts";
import type { GameCommand } from "./message/gameCommand.ts";
import type { CommandGameMessage, GameMessage } from "./message/gameMessage.ts";
import { GameServerConnection } from "./gameServerConnection.ts";
import { IndexedDBAdapter } from "./persistence/indexedDBAdapter.ts";
import { createSinglePlayerMessageRouter } from "./singlePlayerMessageRouter.ts";

const log = createLogger("server");

/**
 * Runs the game server in the same thread as the client, enabling
 * full debugger access across both client and server code.
 * Messages are delivered via direct function calls instead of postMessage.
 */
export class LocalServerConnection implements GameServerConnection {
    private _onMessageEvent: Event<GameMessage>;
    private gameServer: GameServer;
    private isInitialized = false;

    public get onMessage(): Event<GameMessage> {
        return this._onMessageEvent;
    }

    constructor() {
        log.info("Starting local server");
        this._onMessageEvent = new Event();
        const adapter = new IndexedDBAdapter();
        const router = createSinglePlayerMessageRouter((message) => {
            this._onMessageEvent.publish(message);
        });
        this.gameServer = new GameServer(router, adapter);

        adapter
            .init()
            .then(() => this.gameServer.init("player"))
            .then(() => {
                log.info("Local server initialized");
                this.isInitialized = true;
            })
            .catch((err) => {
                log.error("Failed to initialize local server", { err });
            });
    }

    postCommand(command: GameCommand) {
        if (!this.isInitialized) {
            log.warn("Command before initialization, ignoring");
            return;
        }
        const message: CommandGameMessage = {
            type: "command",
            command: command,
        };
        this.gameServer.onMessage(message);
    }
}
