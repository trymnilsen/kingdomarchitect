import { WorkerBehaviorComponent } from "../../behavior/workerBehaviorComponent.js";
import { Entity } from "../../../entity/entity.js";
import { Job } from "../job.js";
import { JobConstraint } from "../jobConstraint.js";

/**
 * A constrain that will filter for if the entity is worker constraint
 */
export class WorkerConstraint implements JobConstraint {
    isEntityApplicableForJob(job: Job, entity: Entity): boolean {
        const hasWorkerBehavior = entity.getComponent(WorkerBehaviorComponent);
        return !!hasWorkerBehavior;
    }
}
