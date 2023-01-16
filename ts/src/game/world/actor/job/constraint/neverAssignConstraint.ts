import { Entity } from "../../../entity/entity";
import { Job } from "../job";
import { JobConstraint } from "../jobConstraint";

/**
 * A debug constraint if the job should stay in the queue forever
 */
export class NeverAssignConstraint implements JobConstraint {
    isEntityApplicableForJob(job: Job, entity: Entity): boolean {
        return false;
    }
}
