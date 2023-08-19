import { Entity } from "../../entity/entity.js";
import { Job } from "./job.js";

export interface JobConstraint {
    isEntityApplicableForJob(job: Job, entity: Entity): boolean;
}
