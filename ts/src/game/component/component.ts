import type { ActiveEffectsComponent } from "./activeEffectsComponent.js";
import type { AnimationComponent } from "./animationComponent.js";
import type { BuildingComponent } from "./buildingComponent.js";
import type { ChunkMapRegistryComponent } from "./chunkMapRegistryComponent.js";
import type { CollectableComponent } from "./collectableComponent.js";
import type { CraftingComponent } from "./craftingComponent.js";
import { DirectionComponent } from "./directionComponent.js";
import type { EffectEmitterComponent } from "./effectEmitterComponent.js";
import type { EquipmentComponent } from "./equipmentComponent.js";
import type { HealthComponent } from "./healthComponent.js";
import type { HousingComponent } from "./housingComponent.js";
import type { InventoryComponent } from "./inventoryComponent.js";
import type { JobQueueComponent } from "./jobQueueComponent.js";
import type { JobRunnerComponent } from "./jobRunnerComponent.js";
import type { KingdomComponent } from "./kingdomComponent.js";
import type { OppcupationComponent } from "./occupationComponent.js";
import type { PathfindingGraphRegistryComponent } from "./pathfindingGraphRegistryComponent.js";
import type { PlayerUnitComponent } from "./playerUnitComponent.js";
import type { RegrowComponent } from "./regrowComponent.js";
import type { ResourceComponent } from "./resourceComponent.js";
import type { SpaceComponent } from "./spaceComponent.js";
import type { SpriteComponent } from "./spriteComponent.js";
import type { TileComponent } from "./tileComponent.js";
import type { VisibilityComponent } from "./visibilityComponent.js";
import type { VisibilityMapComponent } from "./visibilityMapComponent.js";
import type { WorkplaceComponent } from "./workplaceComponent.js";
import type { WorldDiscoveryComponent } from "./worldDiscoveryComponent.js";

export type Components =
    | JobRunnerComponent
    | SpriteComponent
    | TileComponent
    | InventoryComponent
    | ResourceComponent
    | RegrowComponent
    | ChunkMapRegistryComponent
    | PlayerUnitComponent
    | JobQueueComponent
    | BuildingComponent
    | CollectableComponent
    | CraftingComponent
    | HealthComponent
    | EquipmentComponent
    | WorldDiscoveryComponent
    | VisibilityMapComponent
    | VisibilityComponent
    | EffectEmitterComponent
    | AnimationComponent
    | PathfindingGraphRegistryComponent
    | KingdomComponent
    | DirectionComponent
    | ActiveEffectsComponent
    | HousingComponent
    | OppcupationComponent
    | WorkplaceComponent
    | SpaceComponent;

export interface BaseComponent {
    id: string;
}

export type ComponentID = Components["id"];
