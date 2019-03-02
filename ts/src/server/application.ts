import * as express from "express";
import { getLog } from "./monitoring/logger";
import { requestLogger } from "./middleware/requestLogger";
import { controller, get, attachController } from "./rest/rest";
import { inspect } from "util";
import { UserController } from "./rest/controller/user-controller";
import { WorldController } from "./rest/controller/world-controller";

export function bootstrap() {
    const expressApp = express();
    expressApp.use(requestLogger);
    expressApp.use(express.static("public"));

    attachController([
        new UserController(),
        new WorldController()
    ], expressApp);

    expressApp.get("/supererror", (req, res) => {
        res.send("Error made");
    });

    expressApp.listen(5000, () => {
        console.log("Listening on port 5000");
    });

}

