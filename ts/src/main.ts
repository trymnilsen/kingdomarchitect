import { createRootLogger, createLogger } from "./common/logging/logger.ts";
import { Game } from "./game/game.ts";
import { clearGameDatabase } from "./server/persistence/indexedDBAdapter.ts";
import { WebworkerServerConnection } from "./server/webworkerServerConnection.ts";

createRootLogger();

const log = createLogger("client");

const canvasElementId = "gameCanvas";

log.info("Booting!");
window.debugChunks = true;

async function bootstrap() {
    log.info("Bootstrapping!");

    const params = new URLSearchParams(window.location.search.toLowerCase());
    if (params.has("cleargame")) {
        log.info("clearGame parameter detected, clearing saved game state...");
        await clearGameDatabase();
    }

    try {
        const serverConnection = new WebworkerServerConnection();
        const game = new Game(canvasElementId, serverConnection);
        await game.bootstrap();
    } catch (e) {
        log.error("Failed to bootstrap game", { error: e });
    }
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
