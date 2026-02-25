import { startMultiplayerServer, readConfig } from "./server/multiplayerServer.ts";

const config = readConfig();
startMultiplayerServer(config);
