// Started as a webworker from webworkerServerConnection.ts
import { GameServer } from "./gameServer.js";
import type { GameMessage } from "./message/gameMessage.js";

const gameServer = new GameServer((message) => {
    self.postMessage(message);
});
onmessage = (message) => {
    const commandMessage = message as GameMessage;
    if (commandMessage.type == "command") {
        gameServer.onCommand(commandMessage.command);
    }
};
