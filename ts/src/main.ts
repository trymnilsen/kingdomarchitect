import { Game } from "./game/game.ts";
import { clearGameDatabase } from "./server/persistence/indexedDBAdapter.ts";

const canvasElementId = "gameCanvas";

console.log("Booting!");
window.debugChunks = true;

async function bootstrap() {
    console.log("Bootstrapping!");

    const params = new URLSearchParams(window.location.search.toLowerCase());
    if (params.has("cleargame")) {
        console.log(
            "clearGame parameter detected, clearing saved game state...",
        );
        await clearGameDatabase();
    }

    try {
        const game = new Game(canvasElementId);
        await game.bootstrap();
    } catch (e) {
        console.error("Failed to bootstrap game: ", e);
    }
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        bootstrap().catch((err) => {
            console.error("Failed to run bootstrap", err);
        });
    },
    false,
);
