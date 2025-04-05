import type { InventoryComponent } from "./inventoryComponent.js";
import type { JobRunnerComponent } from "./jobRunnerComponent.js";
import type { SpriteComponent } from "./spriteComponent.js";
import type { TileComponent } from "./tileComponent.js";

export type ComponentType =
    | JobRunnerComponent
    | SpriteComponent
    | TileComponent
    | InventoryComponent;
