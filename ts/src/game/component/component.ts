import type { ChunkMapComponent } from "./chunkMapComponent.js";
import type { InventoryComponent } from "./inventoryComponent.js";
import type { JobRunnerComponent } from "./jobRunnerComponent.js";
import type { PathfindingGraphComponent } from "./pathfindingGraphComponent.js";
import type { ResourceComponent } from "./resourceComponent.js";
import type { SpriteComponent } from "./spriteComponent.js";
import type { TileComponent } from "./tileComponent.js";

export type ComponentType =
    | JobRunnerComponent
    | SpriteComponent
    | TileComponent
    | InventoryComponent
    | ResourceComponent
    | ChunkMapComponent
    | PathfindingGraphComponent;

export type ParameterlessClassConstructor<
    T extends ComponentType = ComponentType,
> = new () => T;
export type EcsComponent = { constructor: ParameterlessClassConstructor };
