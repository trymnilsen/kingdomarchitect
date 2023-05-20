import { Entity } from "../entity/entity";
import { Job } from "./job";

export interface JobConstraint {
    isEntityApplicableForJob(job: Job, entity: Entity): boolean;
}
