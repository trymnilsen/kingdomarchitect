import {
    createLogger,
    createRootLogger,
} from "../common/logging/logger.ts";
import { CityPreview } from "./cityPreview.ts";

createRootLogger();
const log = createLogger("citypreview");

async function bootstrap() {
    try {
        const preview = new CityPreview("gameCanvas");
        await preview.bootstrap();
    } catch (e) {
        log.error("Failed to bootstrap city preview", { error: e });
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
