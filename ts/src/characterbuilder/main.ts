import {
    createLogger,
    createRootLogger,
} from "../common/logging/logger.ts";
import { CharacterBuilder } from "./builder.ts";

createRootLogger();
const log = createLogger("characterbuilder");

/**
 * Bootstrap function for the character builder application
 */
async function bootstrap() {
    try {
        const characterBuilder = new CharacterBuilder("gameCanvas");
        await characterBuilder.bootstrap();
    } catch (e) {
        log.error("Failed to bootstrap character builder", { error: e });
    }
}

// Initialize the character builder when the DOM is ready
document.addEventListener(
    "DOMContentLoaded",
    () => {
        bootstrap().catch((err) => {
            log.error("Failed to run bootstrap", { error: err });
        });
    },
    false,
);
