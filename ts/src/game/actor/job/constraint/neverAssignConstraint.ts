import { Actor } from "../../actor";
import { Job } from "../job";
import { JobConstraint } from "../jobConstraint";

/**
 * A debug constraint if the job should stay in the queue forever
 */
export class NeverAssignConstraint implements JobConstraint {
    isActorApplicableForJob(job: Job, actor: Actor): boolean {
        return false;
    }
}
