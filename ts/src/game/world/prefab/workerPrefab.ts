import { sprites } from "../../../asset/sprite";
import { JobRunnerComponent } from "../component/job/jobRunnerComponent";
import { SpriteComponent } from "../component/draw/spriteComponent";
import { WorkerBehaviorComponent } from "../component/behavior/workerBehaviorComponent";
import { Entity } from "../entity/entity";

export function workerPrefab(id: string): Entity {
    const worker = new Entity(id);
    const spriteDrawer = new SpriteComponent(sprites.farmer, { x: 3, y: 2 });
    const jobRunner = new JobRunnerComponent();
    const workerBehaviorComponent = new WorkerBehaviorComponent();

    worker.addComponent(spriteDrawer);
    worker.addComponent(jobRunner);
    worker.addComponent(workerBehaviorComponent);

    return worker;
}
