import { Router } from "./ui/router";
import { MenuView } from "./ui/views/menuView";
import { WorldSelectView } from "./ui/views/worldSelectView";
import { GameView } from "./ui/views/gameView";
import { authenticate } from "./authentication";
import { WebsocketConnection } from "./network/websocketConnection";
import { ServiceContainer } from "../common/ioc/service";

export async function bootstrap() {
    console.log("Bootstrapping");
    const services = new ServiceContainer();
    const websocketConnection = new WebsocketConnection();
    services.registerService(websocketConnection);
    const router = new Router(
        "#container",
        {
            "^\\/?$": new MenuView(),
            "\\/select-world\\/?$": new WorldSelectView(),
            "^\\/world\\/([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\\/?$": new GameView()
        },
        services
    );
    await authenticate();
    await websocketConnection.connect();
    router.init();
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        bootstrap();
    },
    false
);
