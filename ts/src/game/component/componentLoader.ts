import { ConstructorFunction } from "../../common/constructor.js";
import { IdleMobComponent } from "./actor/mob/IdleMobComponent.js";
import { AggroComponent } from "./actor/mob/aggroComponent.js";
import { WorkerBehaviorComponent } from "./behavior/workerBehaviorComponent.js";
import { BuildingComponent } from "./building/buildingComponent.js";
import { SpriteComponent } from "./draw/spriteComponent.js";
import { EntityComponent } from "./entityComponent.js";
import { DestroyOnZeroHealthComponent } from "./health/destroyOnZeroHealthComponent.js";
import { HealthComponent } from "./health/healthComponent.js";
import { HousingComponent } from "./housing/housingComponent.js";
import { TenantComponent } from "./housing/tenantComponent.js";
import { EquipmentComponent } from "./inventory/equipmentComponent.js";
import { InventoryComponent } from "./inventory/inventoryComponent.js";
import { JobQueueComponent } from "./job/jobQueueComponent.js";
import { JobRunnerComponent } from "./job/jobRunnerComponent.js";
import { JobSchedulerComponent } from "./job/jobSchedulerComponent.js";
import { ChestComponent } from "./resource/chestComponent.js";
import { TreeComponent } from "./resource/treeComponent.js";
import { ChunkMapComponent } from "./root/chunk/chunkMapComponent.js";
import { PathFindingComponent } from "./root/path/pathFindingComponent.js";
import { TileGeneratorComponent } from "./tile/tileGeneratorComponent.js";
import { TilesComponent } from "./tile/tilesComponent.js";

export const loaders: ConstructorFunction<EntityComponent>[] = [
    AggroComponent,
    IdleMobComponent,
    WorkerBehaviorComponent,
    BuildingComponent,
    SpriteComponent,
    DestroyOnZeroHealthComponent,
    HealthComponent,
    HousingComponent,
    TenantComponent,
    EquipmentComponent,
    InventoryComponent,
    JobQueueComponent,
    JobRunnerComponent,
    JobSchedulerComponent,
    ChestComponent,
    TreeComponent,
    ChunkMapComponent,
    PathFindingComponent,
    TileGeneratorComponent,
    TilesComponent,
];
