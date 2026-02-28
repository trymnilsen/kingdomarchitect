// Started as a webworker from webworkerServerConnection.ts
import { createRootLogger, createLogger } from "../common/logging/logger.ts";
import { GameServer } from "./gameServer.ts";
import type { GameMessage } from "./message/gameMessage.ts";
import { IndexedDBAdapter } from "./persistence/indexedDBAdapter.ts";
import { createSinglePlayerMessageRouter } from "./singlePlayerMessageRouter.ts";

createRootLogger();
const log = createLogger("server");

log.info("Booting webworker server");

const adapter = new IndexedDBAdapter();
const router = createSinglePlayerMessageRouter((message) => {
    self.postMessage(message);
});
const gameServer = new GameServer(router, adapter);

let isInitialized = false;

adapter
    .init()
    .then(() => gameServer.init("player"))
    .then(() => {
        log.info("Game server initialized");
        isInitialized = true;
    })
    .catch((err) => {
        log.error("Failed to initialize game server", { err });
    });

onmessage = (message) => {
    log.debug("Received message");
    if (!isInitialized) {
        log.warn("Message before initialization, ignoring");
        return;
    }
    const commandMessage = message.data as GameMessage;
    gameServer.onMessage(commandMessage);
};
