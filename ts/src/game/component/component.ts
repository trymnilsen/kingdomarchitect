import type { ActiveEffectsComponent } from "./activeEffectsComponent.ts";
import type { AnimationComponent } from "./animationComponent.ts";
import type { BuildingComponent } from "./buildingComponent.ts";
import type { ChunkMapRegistryComponent } from "./chunkMapRegistryComponent.ts";
import type { CollectableComponent } from "./collectableComponent.ts";
import type { CraftingComponent } from "./craftingComponent.ts";
import { DirectionComponent } from "./directionComponent.ts";
import type { EffectEmitterComponent } from "./effectEmitterComponent.ts";
import type { EquipmentComponent } from "./equipmentComponent.ts";
import type { HealthComponent } from "./healthComponent.ts";
import type { HousingComponent } from "./housingComponent.ts";
import type { InventoryComponent } from "./inventoryComponent.ts";
import type { JobQueueComponent } from "./jobQueueComponent.ts";
import type { JobRunnerComponent } from "./jobRunnerComponent.ts";
import type { KingdomComponent } from "./kingdomComponent.ts";
import type { OppcupationComponent } from "./occupationComponent.ts";
import type { PathfindingGraphRegistryComponent } from "./pathfindingGraphRegistryComponent.ts";
import type { PlayerUnitComponent } from "./playerUnitComponent.ts";
import type { RegrowComponent } from "./regrowComponent.ts";
import type { ResourceComponent } from "./resourceComponent.ts";
import type { SpaceComponent } from "./spaceComponent.ts";
import type { SpriteComponent } from "./spriteComponent.ts";
import type { TileComponent } from "./tileComponent.ts";
import type { VisibilityComponent } from "./visibilityComponent.ts";
import type { VisibilityMapComponent } from "./visibilityMapComponent.ts";
import type { WorkplaceComponent } from "./workplaceComponent.ts";
import type { WorldDiscoveryComponent } from "./worldDiscoveryComponent.ts";

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
