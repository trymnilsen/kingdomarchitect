// Started as a webworker from webworkerServerConnection.ts
import { GameServer } from "./gameServer.ts";
import type { GameMessage } from "./message/gameMessage.ts";
import { IndexedDBAdapter } from "./persistence/indexedDBAdapter.ts";
import { createSinglePlayerMessageRouter } from "./singlePlayerMessageRouter.ts";

console.log("Booting webworker server");

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
        console.log("Game server initialized");
        isInitialized = true;
    })
    .catch((err) => {
        console.error("Failed to initialize game server:", err);
    });

onmessage = (message) => {
    console.log("[webWorkerServer] recieved message", message);
    if (!isInitialized) {
        console.warn(
            "Received message before initialization complete, ignoring",
        );
        return;
    }
    const commandMessage = message.data as GameMessage;
    gameServer.onMessage(commandMessage);
};
