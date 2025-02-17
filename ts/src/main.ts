import { AssetLoader } from "./asset/loader/assetLoader.js";
import { createRootEntity } from "./game/entity/rootEntity.js";
import { Game } from "./game/game.js";

const canvasElementId = "gameCanvas";
console.log("Booting!");
async function bootstrap() {
    console.log("Bootstrapping!");
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
