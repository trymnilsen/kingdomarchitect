import { Entity } from "../../../entity/entity.js";
import { WorkerBehaviorComponent } from "../../behavior/workerBehaviorComponent.js";
import { JobConstraint } from "../jobConstraint.js";

export class IsWorkerJobConstraint implements JobConstraint {
    rankEntity(entity: Entity): number {
        if (!!entity.getComponent(WorkerBehaviorComponent)) {
            return 1;
        } else {
            return 0;
        }
    }
}
