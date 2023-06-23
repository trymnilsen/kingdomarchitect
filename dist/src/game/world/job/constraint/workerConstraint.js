import { WorkerBehaviorComponent } from "../../component/behavior/workerBehaviorComponent.js";
/**
 * A constrain that will filter for if the entity is worker constraint
 */ export class WorkerConstraint {
    isEntityApplicableForJob(job, entity) {
        const hasWorkerBehavior = entity.getComponent(WorkerBehaviorComponent);
        return !!hasWorkerBehavior;
    }
}
