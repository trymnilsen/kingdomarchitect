import { createRootLogger, createLogger } from "./common/logging/logger.ts";
import { Game } from "./game/game.ts";
import { WebSocketServerConnection } from "./server/websocketServerConnection.ts";

createRootLogger();

const log = createLogger("client");

const canvasElementId = "gameCanvas";

async function bootstrap() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}`;

    const serverConnection = new WebSocketServerConnection(wsUrl);
    const game = new Game(canvasElementId, serverConnection);
    await game.bootstrap();
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        bootstrap().catch((err) => {
            log.error("Failed to run bootstrap", { error: err });
        });
    },
    false,
);
