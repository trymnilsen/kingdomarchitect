import { GameView } from "./ui/gameView";

export async function bootstrap() {
    console.log("Bootstrapping");
    const view = new GameView();
    view.init();
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        bootstrap();
    },
    false
);
