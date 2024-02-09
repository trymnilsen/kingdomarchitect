import { JobRunnerComponent } from "../component/job/jobRunnerComponent.js";
import { SpriteComponent } from "../component/draw/spriteComponent.js";
import { WorkerBehaviorComponent } from "../component/behavior/workerBehaviorComponent.js";
import { Entity } from "../entity/entity.js";
import { sprites2 } from "../../asset/sprite.js";
import { EquipmentComponent } from "../component/inventory/equipmentComponent.js";
import { HealthComponent } from "../component/health/healthComponent.js";
import {
    AggroComponent,
    AggroMode,
} from "../component/actor/mob/aggroComponent.js";
import { MovementComponent } from "../component/movement/movementComponent.js";
import { EnergyComponent } from "../component/energy/energyComponent.js";
import { WorkerSpriteComponent } from "../component/actor/mob/workerSpriteComponent.js";
import { EffectComponent } from "../component/effect/effectComponent.js";
import { TileDiscoveryComponent } from "../component/tile/tileDiscoveryComponent.js";
import { VisibilityComponent } from "../component/visibility/visibilityComponent.js";

export function workerPrefab(id: string): Entity {
    const worker = new Entity(id);

    const jobRunner = new JobRunnerComponent();
    const workerBehaviorComponent = new WorkerBehaviorComponent();
    const equipmentComponent = new EquipmentComponent();
    const movementComponent = new MovementComponent();
    const energyComponent = new EnergyComponent();
    const effectComponent = new EffectComponent();
    const visibilityComponent = new VisibilityComponent();
    const tileDiscoveryComponent = new TileDiscoveryComponent();
    energyComponent.setEnergy(10000);
    const healthComponent = HealthComponent.createInstance(100, 100);
    const aggroComponent = AggroComponent.createInstance(5);
    aggroComponent.aggroMode = AggroMode.Defensive;
    worker.addComponent(jobRunner);
    worker.addComponent(workerBehaviorComponent);
    worker.addComponent(equipmentComponent);
    worker.addComponent(aggroComponent);
    worker.addComponent(movementComponent);
    worker.addComponent(energyComponent);
    worker.addComponent(new WorkerSpriteComponent());
    worker.addComponent(healthComponent);
    worker.addComponent(effectComponent);
    worker.addComponent(tileDiscoveryComponent);
    worker.addComponent(visibilityComponent);

    return worker;
}
