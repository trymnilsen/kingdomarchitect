/**
 * A debug constraint if the job should stay in the queue forever
 */ export class NeverAssignConstraint {
    isEntityApplicableForJob(job, entity) {
        return false;
    }
}
