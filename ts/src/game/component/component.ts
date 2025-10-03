import type { ActiveEffectsComponent } from "./activeEffectsComponent.js";
import type { AnimationComponent } from "./animationComponent.js";
import type { BuildingComponent } from "./buildingComponent.js";
import type { ChunkMapComponent } from "./chunkMapComponent.js";
import { DirectionComponent } from "./directionComponent.js";
import type { EffectEmitterComponent } from "./effectEmitterComponent.js";
import type { EquipmentComponent } from "./equipmentComponent.js";
import type { HealthComponent } from "./healthComponent.js";
import type { InventoryComponent } from "./inventoryComponent.js";
import type { JobQueueComponent } from "./jobQueueComponent.js";
import type { JobRunnerComponent } from "./jobRunnerComponent.js";
import type { KingdomComponent } from "./kingdomComponent.js";
import type { PathfindingGraphComponent } from "./pathfindingGraphComponent.js";
import type { PlayerUnitComponent } from "./playerUnitComponent.js";
import type { ResourceComponent } from "./resourceComponent.js";
import type { SpriteComponent } from "./spriteComponent.js";
import type { TileComponent } from "./tileComponent.js";
import type { VisibilityComponent } from "./visibilityComponent.js";
import type { VisibilityMapComponent } from "./visibilityMapComponent.js";
import type { WorldDiscoveryComponent } from "./worldDiscoveryComponent.js";

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
    | WorldDiscoveryComponent
    | VisibilityMapComponent
    | VisibilityComponent
    | EffectEmitterComponent
    | AnimationComponent
    | PathfindingGraphComponent
    | KingdomComponent
    | DirectionComponent
    | ActiveEffectsComponent;

export interface BaseComponent {
    id: string;
}

export type ComponentID = Components["id"];
