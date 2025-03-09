import { WorkerBehaviorComponent } from "../component/behavior/workerBehaviorComponent.js";
import { HousingComponent } from "../component/housing/housingComponent.js";
import { Entity } from "../entity/entity.js";

export function update(rootEntity: Entity) {
    const houses = rootEntity.queryComponents2({
        house: HousingComponent,
    });

    const workers = rootEntity.queryComponents2({
        worker: WorkerBehaviorComponent,
    });
}
