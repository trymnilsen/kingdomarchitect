import { CharacterBuilder } from "./builder.ts";

/**
 * Bootstrap function for the character builder application
 */
async function bootstrap() {
    try {
        const characterBuilder = new CharacterBuilder("gameCanvas");
        await characterBuilder.bootstrap();
    } catch (e) {
        console.error("Failed to bootstrap character builder: ", e);
    }
}

// Initialize the character builder when the DOM is ready
document.addEventListener(
    "DOMContentLoaded",
    () => {
        bootstrap().catch((err) => {
            console.error("Failed to run bootstrap", err);
        });
    },
    false,
);
