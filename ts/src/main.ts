import { Game } from "./game/game";

const canvasElementId = "gameCanvas";

export async function bootstrap() {
    console.log("Bootstrapping");
    const game = new Game(canvasElementId);
    await game.bootstrap();
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        bootstrap();
    },
    false
);
