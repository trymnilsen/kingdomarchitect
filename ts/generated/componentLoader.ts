import { ConstructorFunction } from "../src/common/constructor.js"
import { EntityComponent } from "../src/game/component/entityComponent.js"
import { AggroComponent } from "../src/game/component/actor/mob/aggroComponent.js";
import { BuildingComponent } from "../src/game/component/building/buildingComponent.js";
import { ChestComponent } from "../src/game/component/resource/chestComponent.js";
import { ChunkMapComponent } from "../src/game/component/root/chunk/chunkMapComponent.js";
import { DestroyOnZeroHealthComponent } from "../src/game/component/health/destroyOnZeroHealthComponent.js";
import { EffectComponent } from "../src/game/component/effect/effectComponent.js";
import { EnergyComponent } from "../src/game/component/energy/energyComponent.js";
import { EquipmentComponent } from "../src/game/component/inventory/equipmentComponent.js";
import { ForrestComponent } from "../src/game/component/resource/forrestComponent.js";
import { FoxComponent } from "../src/game/component/actor/animal/foxComponent.js";
import { HealthComponent } from "../src/game/component/health/healthComponent.js";
import { HousingComponent } from "../src/game/component/housing/housingComponent.js";
import { IdleMobComponent } from "../src/game/component/actor/mob/IdleMobComponent.js";
import { InventoryComponent } from "../src/game/component/inventory/inventoryComponent.js";
import { JobQueueComponent } from "../src/game/component/job/jobQueueComponent.js";
import { JobRunnerComponent } from "../src/game/component/job/jobRunnerComponent.js";
import { JobSchedulerComponent } from "../src/game/component/job/jobSchedulerComponent.js";
import { MovementComponent } from "../src/game/component/movement/movementComponent.js";
import { PathFindingComponent } from "../src/game/component/root/path/pathFindingComponent.js";
import { SpriteComponent } from "../src/game/component/draw/spriteComponent.js";
import { TenantComponent } from "../src/game/component/housing/tenantComponent.js";
import { TileGeneratorComponent } from "../src/game/component/tile/tileGeneratorComponent.js";
import { TilesComponent } from "../src/game/component/tile/tilesComponent.js";
import { TreeComponent } from "../src/game/component/resource/treeComponent.js";
import { WorkerBehaviorComponent } from "../src/game/component/behavior/workerBehaviorComponent.js";
import { WorkerSpriteComponent } from "../src/game/component/actor/mob/workerSpriteComponent.js";

export const componentLoaders: ConstructorFunction<EntityComponent>[] = [
    AggroComponent,
    BuildingComponent,
    ChestComponent,
    ChunkMapComponent,
    DestroyOnZeroHealthComponent,
    EffectComponent,
    EnergyComponent,
    EquipmentComponent,
    ForrestComponent,
    FoxComponent,
    HealthComponent,
    HousingComponent,
    IdleMobComponent,
    InventoryComponent,
    JobQueueComponent,
    JobRunnerComponent,
    JobSchedulerComponent,
    MovementComponent,
    PathFindingComponent,
    SpriteComponent,
    TenantComponent,
    TileGeneratorComponent,
    TilesComponent,
    TreeComponent,
    WorkerBehaviorComponent,
    WorkerSpriteComponent,
];
