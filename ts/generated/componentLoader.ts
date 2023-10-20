import { ConstructorFunction } from "../src/common/constructor.js"
import { EntityComponent } from "../src/game/component/entityComponent.js"
import { TilesComponent } from "../src/game/component/tile/tilesComponent.js";
import { WorkerBehaviorComponent } from "../src/game/component/behavior/workerBehaviorComponent.js";
import { ChunkMapComponent } from "../src/game/component/root/chunk/chunkMapComponent.js";
import { InventoryComponent } from "../src/game/component/inventory/inventoryComponent.js";
import { SpriteComponent } from "../src/game/component/draw/spriteComponent.js";
import { ChestComponent } from "../src/game/component/resource/chestComponent.js";
import { HealthComponent } from "../src/game/component/health/healthComponent.js";
import { TreeComponent } from "../src/game/component/resource/treeComponent.js";
import { BuildingComponent } from "../src/game/component/building/buildingComponent.js";
import { PathFindingComponent } from "../src/game/component/root/path/pathFindingComponent.js";
import { JobQueueComponent } from "../src/game/component/job/jobQueueComponent.js";
import { JobRunnerComponent } from "../src/game/component/job/jobRunnerComponent.js";
import { IdleMobComponent } from "../src/game/component/actor/mob/IdleMobComponent.js";
import { AggroComponent } from "../src/game/component/actor/mob/aggroComponent.js";
import { DestroyOnZeroHealthComponent } from "../src/game/component/health/destroyOnZeroHealthComponent.js";
import { TileGeneratorComponent } from "../src/game/component/tile/tileGeneratorComponent.js";
import { EquipmentComponent } from "../src/game/component/inventory/equipmentComponent.js";
import { TenantComponent } from "../src/game/component/housing/tenantComponent.js";
import { HousingComponent } from "../src/game/component/housing/housingComponent.js";
import { JobSchedulerComponent } from "../src/game/component/job/jobSchedulerComponent.js";
import { FoxComponent } from "../src/game/component/actor/animal/foxComponent.js";
import { ForrestComponent } from "../src/game/component/resource/forrestComponent.js";

export const componentLoaders: ConstructorFunction<EntityComponent>[] = [
    TilesComponent,
    WorkerBehaviorComponent,
    ChunkMapComponent,
    InventoryComponent,
    SpriteComponent,
    ChestComponent,
    HealthComponent,
    TreeComponent,
    BuildingComponent,
    PathFindingComponent,
    JobQueueComponent,
    JobRunnerComponent,
    IdleMobComponent,
    AggroComponent,
    DestroyOnZeroHealthComponent,
    TileGeneratorComponent,
    EquipmentComponent,
    TenantComponent,
    HousingComponent,
    JobSchedulerComponent,
    FoxComponent,
    ForrestComponent,
];
