import { Game2 } from "./game/game2.js";

const canvasElementId = "gameCanvas";

async function bootstrap() {
    console.log("Bootstrapping");
    const game = new Game2(canvasElementId);

    try {
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
