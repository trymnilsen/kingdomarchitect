import express from "express";
import { getLog } from "./monitoring/logger";
import { requestLogger } from "./middleware/requestLogger";
import { controller, get, attachController } from "./rest/rest";
import { inspect } from "util";
import { UserController } from "./rest/controller/user-controller";
import { WorldController } from "./rest/controller/world-controller";
import { UserStore } from "./store/userStore";

export function bootstrap() {
    const expressApp = express();
    const logger = getLog("Application");
    expressApp.use(requestLogger);
    expressApp.use(express.static("public"));
    logger.info("Creating stores");
    const userStore = new UserStore();
    logger.info("Attaching controllers");
    attachController([
        new UserController(userStore),
        new WorldController()
    ], expressApp);

    expressApp.get("/supererror", (req, res) => {
        res.send("Error made");
    });

    return expressApp;
}

