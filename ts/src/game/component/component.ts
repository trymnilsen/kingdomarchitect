import type { InventoryComponent } from "./inventoryComponent.js";
import type { JobRunnerComponent } from "./jobRunnerComponent.js";
import type { SpriteComponent } from "./spriteComponent.js";

export type ComponentType =
    | JobRunnerComponent
    | SpriteComponent
    | InventoryComponent;
