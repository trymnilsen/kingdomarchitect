// Started as a webworker from webworkerServerConnection.ts
import { GameServer } from "./gameServer.js";
import type { GameMessage } from "./message/gameMessage.js";

console.log("Booting webworker server");
const gameServer = new GameServer((message) => {
    self.postMessage(message);
});

gameServer
    .init()
    .then(() => {
        console.log("Game server initialized");
    })
    .catch((err) => {
        console.error("Failed to initialize game server:", err);
    });

onmessage = (message) => {
    console.log("[webWorkerServer] recieved message", message);
    const commandMessage = message.data as GameMessage;
    gameServer.onMessage(commandMessage);
};
