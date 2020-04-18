import { Game } from "./game/game";

const canvasElementId = "gameCanvas";

export function bootstrap() {
    console.log("Bootstrapping");
    new Game(canvasElementId);
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        bootstrap();
    },
    false
);
