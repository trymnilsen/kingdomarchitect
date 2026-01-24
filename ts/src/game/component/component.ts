import type { ActiveEffectsComponent } from "./activeEffectsComponent.ts";
import type { AnimationComponent } from "./animationComponent.ts";
import type { BuildingComponent } from "./buildingComponent.ts";
import type { ChunkMapComponent } from "./chunkMapComponent.ts";
import type { CollectableComponent } from "./collectableComponent.ts";
import type { CraftingComponent } from "./craftingComponent.ts";
import { DirectionComponent } from "./directionComponent.ts";
import type { EffectEmitterComponent } from "./effectEmitterComponent.ts";
import type { EquipmentComponent } from "./equipmentComponent.ts";
import type { GoapAgentComponent } from "./goapAgentComponent.ts";
import type { BehaviorAgentComponent } from "../behavior/components/BehaviorAgentComponent.ts";
import type { HealthComponent } from "./healthComponent.ts";
import type { HousingComponent } from "./housingComponent.ts";
import type { HungerComponent } from "./hungerComponent.ts";
import type { EnergyComponent } from "./energyComponent.ts";
import type { InventoryComponent } from "./inventoryComponent.ts";
import type { JobQueueComponent } from "./jobQueueComponent.ts";
import type { JobRunnerComponent } from "./jobRunnerComponent.ts";
import type { KingdomComponent } from "./kingdomComponent.ts";
import type { OppcupationComponent } from "./occupationComponent.ts";
import type { PathfindingGraphComponent } from "./pathfindingGraphComponent.ts";
import type { PlayerUnitComponent } from "./playerUnitComponent.ts";
import type { RegrowComponent } from "./regrowComponent.ts";
import type { ResourceComponent } from "./resourceComponent.ts";
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
    | ChunkMapComponent
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
    | PathfindingGraphComponent
    | KingdomComponent
    | DirectionComponent
    | ActiveEffectsComponent
    | HousingComponent
    | OppcupationComponent
    | WorkplaceComponent
    | GoapAgentComponent
    | BehaviorAgentComponent
    | HungerComponent
    | EnergyComponent;

export interface BaseComponent {
    id: string;
}

export type ComponentID = Components["id"];
