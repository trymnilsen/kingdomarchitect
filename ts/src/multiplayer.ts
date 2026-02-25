import { Game } from "./game/game.ts";
import { WebSocketServerConnection } from "./server/websocketServerConnection.ts";

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
            console.error("Failed to run bootstrap", err);
        });
    },
    false,
);
