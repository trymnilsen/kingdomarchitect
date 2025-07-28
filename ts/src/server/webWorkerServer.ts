// Started as a webworker from webworkerServerConnection.ts
import { GameServer } from "./gameServer.js";

const gameServer = new GameServer();
onmessage = (message) => gameServer.onCommand(message.data);
