import { setupLogger, log } from "../../common/logging/logger.ts";
import { MountainPreview } from "./mountainPreview.ts";

setupLogger();

async function bootstrap() {
    try {
        const preview = new MountainPreview("gameCanvas");
        await preview.bootstrap();
    } catch (e) {
        log.error("Failed to bootstrap mountain preview", { error: e });
    }
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        bootstrap().catch((err) => {
            log.error("Failed to run bootstrap", { error: err });
        });
    },
    false,
);
