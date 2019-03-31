import express from "express";
import { getLog } from "./monitoring/logger";
import { requestLogger } from "./middleware/requestLogger";
import { controller, get, attachController } from "./rest/rest";
import { inspect } from "util";
import { UserController } from "./rest/user-controller";
import { WorldController } from "./rest/world-controller";
import { UserStore } from "./store/userStore";
import {Server as WebsocketServer} from "ws";
import http from "http";
import { GameServer } from "./gameserver";
import { AuthenticateController } from "./rest/auth-controller";

export function bootstrap() {
    const expressApp = express();
    const httpServer = http.createServer(expressApp);

    const logger = getLog("Application");

    expressApp.use(requestLogger);
    expressApp.use(express.static("public"));

    logger.info("Creating stores");
    const userStore = new UserStore();

    logger.info("Attaching controllers");
    attachController([
        new UserController(userStore),
        new WorldController(),
        new AuthenticateController()
    ], expressApp);
    const websocketServer = new WebsocketServer({
        path: "/ws",
        server: httpServer
    });
    const gameServer = new GameServer();

    websocketServer.on("connection", (socket) => {
        gameServer.clientConnected(socket);
    });

    httpServer.listen(5000, "localhost");
    return expressApp;
}
