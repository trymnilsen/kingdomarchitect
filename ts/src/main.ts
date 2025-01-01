import { AssetLoader } from "./asset/loader/assetLoader.js";
import { createRootEntity } from "./game/entity/rootEntity.js";
import { Game } from "./game/game.js";
import { generateMap } from "./game/map/mapGenerator.js";

const canvasElementId = "gameCanvas";

function createGame(): Game {
    const rootNode = createRootEntity();
    const assetLoader = new AssetLoader();
    const assets = assetLoader.load();
    const game = new Game(canvasElementId, rootNode, assetLoader);
    generateMap(rootNode);
    return game;
}

async function bootstrap() {
    console.log("Bootstrapping");
    try {
        await game.bootstrap();
    } catch (e) {
        console.error("Failed to bootstrap game: ", e);
    }
}

const game = createGame();
document.addEventListener(
    "DOMContentLoaded",
    () => {
        bootstrap().catch((err) => {
            console.error("Failed to run bootstrap", err);
        });
    },
    false,
);
