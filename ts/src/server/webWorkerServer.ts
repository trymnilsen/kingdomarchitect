// Started as a webworker from webworkerServerConnection.ts
import { GameServer } from "./gameServer.js";
import type {
    GameServerMessage,
    GameServerMessageBus,
} from "./gameServerMessageBus.js";

const messageBus: GameServerMessageBus = {
    postMessage: (messageEntry) => {
        const gameServerMessage: GameServerMessage = {
            entries: [messageEntry],
        };
        self.postMessage(gameServerMessage);
    },
};
const gameServer = new GameServer(messageBus);
self.onmessage = (message) => gameServer.onCommand(message);
