import { Entity } from "../../entity/entity.js";
import { Job } from "../job.js";
import { JobConstraint } from "../jobConstraint.js";

export class EntityInstanceJobConstraint implements JobConstraint {
    constructor(private entity: Entity) {}

    isEntityApplicableForJob(job: Job, entity: Entity): boolean {
        return entity === this.entity;
    }
}
