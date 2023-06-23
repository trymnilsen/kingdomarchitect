import { JobRunnerComponent } from "../component/job/jobRunnerComponent.js";
import { SpriteComponent } from "../component/draw/spriteComponent.js";
import { WorkerBehaviorComponent } from "../component/behavior/workerBehaviorComponent.js";
import { Entity } from "../entity/entity.js";
import { sprites2 } from "../../../asset/sprite.js";
import { EquipmentComponent } from "../component/inventory/equipmentComponent.js";

export function workerPrefab(id: string): Entity {
    const worker = new Entity(id);
    const spriteDrawer = new SpriteComponent(sprites2.worker, {
        x: 3,
        y: 2,
    });
    const jobRunner = new JobRunnerComponent();
    const workerBehaviorComponent = new WorkerBehaviorComponent();
    const equipmentComponet = new EquipmentComponent();

    worker.addComponent(spriteDrawer);
    worker.addComponent(jobRunner);
    worker.addComponent(workerBehaviorComponent);
    worker.addComponent(equipmentComponet);

    return worker;
}
