import type { BuildingComponent } from "./buildingComponent.js";
import type { ChunkMapComponent } from "./chunkMapComponent.js";
import type { EquipmentComponent } from "./equipmentComponent.js";
import type { HealthComponent } from "./healthComponent.js";
import type { InventoryComponent } from "./inventoryComponent.js";
import type { JobQueueComponent } from "./jobQueueComponent.js";
import type { JobRunnerComponent } from "./jobRunnerComponent.js";
import type { PathfindingGraphComponent } from "./pathfindingGraphComponent.js";
import type { PlayerUnitComponent } from "./playerUnitComponent.js";
import type { ResourceComponent } from "./resourceComponent.js";
import type { SpriteComponent } from "./spriteComponent.js";
import type { TileComponent } from "./tileComponent.js";

export type Components =
    | JobRunnerComponent
    | SpriteComponent
    | TileComponent
    | InventoryComponent
    | ResourceComponent
    | ChunkMapComponent
    | PlayerUnitComponent
    | JobQueueComponent
    | BuildingComponent
    | HealthComponent
    | EquipmentComponent
    | PathfindingGraphComponent;

export interface BaseComponent {
    id: string;
}

export type ComponentID = Components["id"];
