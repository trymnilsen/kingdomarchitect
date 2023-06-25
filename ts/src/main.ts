import { Game } from "./game/game.js";

const canvasElementId = "gameCanvas";

async function bootstrap() {
    console.log("Bootstrapping");
    const game = new Game(canvasElementId);
    try {
        await game.bootstrap();
    } catch (e) {
        console.error("Failed to bootstrap game: ", e);
    }
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        bootstrap();
    },
    false
);
