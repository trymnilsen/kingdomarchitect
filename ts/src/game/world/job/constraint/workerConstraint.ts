import { WorkerBehaviorComponent } from "../../component/behavior/workerBehaviorComponent";
import { Entity } from "../../entity/entity";
import { Job } from "../job";
import { JobConstraint } from "../jobConstraint";

/**
 * A constrain that will filter for if the entity is worker constraint
 */
export class WorkerConstraint implements JobConstraint {
    isEntityApplicableForJob(job: Job, entity: Entity): boolean {
        const hasWorkerBehavior = entity.getComponent(WorkerBehaviorComponent);
        return !!hasWorkerBehavior;
    }
}
