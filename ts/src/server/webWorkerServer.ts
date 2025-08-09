// Started as a webworker from webworkerServerConnection.ts
import { GameServer } from "./gameServer.js";
import type { GameMessage } from "./message/gameMessage.js";

console.log("Booting webworker server");
const gameServer = new GameServer((message) => {
    self.postMessage(message);
});
onmessage = (message) => {
    console.log("[webWorkerServer] recieved message", message);
    const commandMessage = message.data as GameMessage;
    if (commandMessage.type == "command") {
        gameServer.onCommand(commandMessage.command);
    }
};
