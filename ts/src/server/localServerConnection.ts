import { createLogger } from "../common/logging/logger.ts";
import { Event } from "../common/event.ts";
import { GameServer } from "./gameServer.ts";
import type { GameCommand } from "./message/gameCommand.ts";
import type { CommandGameMessage, GameMessage } from "./message/gameMessage.ts";
import {
    type GameSaveCapability,
    GameServerConnection,
} from "./gameServerConnection.ts";
import { IndexedDBAdapter } from "./persistence/indexedDBAdapter.ts";
import { PersistenceManager } from "./persistence/persistenceManager.ts";
import type { SaveFileData } from "./persistence/saveFileData.ts";
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
    private persistenceManager: PersistenceManager;
    private isInitialized = false;

    public get onMessage(): Event<GameMessage> {
        return this._onMessageEvent;
    }

    readonly gameSaveCapability: GameSaveCapability = {
        save: () => {
            if (!this.isInitialized) return;
            const data = this.persistenceManager.exportWorld(
                this.gameServer.worldRoot,
                this.gameServer.worldMeta,
            );
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "kingdom-architect-save.json";
            a.click();
            URL.revokeObjectURL(url);
        },
        load: () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".json";
            input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;
                const text = await file.text();
                const saveData = JSON.parse(text) as SaveFileData;
                await this.persistenceManager.importSave(saveData);
                window.location.reload();
            };
            input.click();
        },
    };

    constructor() {
        log.info("Starting local server");
        this._onMessageEvent = new Event();
        const adapter = new IndexedDBAdapter();
        this.persistenceManager = new PersistenceManager(adapter);
        const router = createSinglePlayerMessageRouter((message) => {
            this._onMessageEvent.publish(message);
        });
        this.gameServer = new GameServer(router, this.persistenceManager);

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
