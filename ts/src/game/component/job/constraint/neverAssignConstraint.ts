import { Entity } from "../../../entity/entity.js";
import { Job } from "../job.js";
import { JobConstraint } from "../jobConstraint.js";

/**
 * A debug constraint if the job should stay in the queue forever
 */
export class NeverAssignConstraint implements JobConstraint {
    isEntityApplicableForJob(job: Job, entity: Entity): boolean {
        return false;
    }
}
