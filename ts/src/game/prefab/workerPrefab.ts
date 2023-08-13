import { JobRunnerComponent } from "../component/job/jobRunnerComponent.js";
import { SpriteComponent } from "../component/draw/spriteComponent.js";
import { WorkerBehaviorComponent } from "../component/behavior/workerBehaviorComponent.js";
import { Entity } from "../entity/entity.js";
import { sprites2 } from "../../../asset/sprite.js";
import { EquipmentComponent } from "../component/inventory/equipmentComponent.js";
import { HealthComponent } from "../component/health/healthComponent.js";
import {
    AggroComponent,
    AggroMode,
} from "../component/actor/mob/aggroComponent.js";

export function workerPrefab(id: string): Entity {
    const worker = new Entity(id);
    const spriteDrawer = new SpriteComponent(sprites2.dweller, {
        x: 3,
        y: 2,
    });
    const jobRunner = new JobRunnerComponent();
    const workerBehaviorComponent = new WorkerBehaviorComponent();
    const equipmentComponent = new EquipmentComponent();
    const healthComponent = new HealthComponent(100, 100);
    const aggroComponent = new AggroComponent(10);
    aggroComponent.aggroMode = AggroMode.Defensive;
    worker.addComponent(spriteDrawer);
    worker.addComponent(jobRunner);
    worker.addComponent(workerBehaviorComponent);
    worker.addComponent(equipmentComponent);
    worker.addComponent(healthComponent);
    worker.addComponent(aggroComponent);

    return worker;
}
