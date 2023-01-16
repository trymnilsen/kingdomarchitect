import { Entity } from "../../../entity/entity";
import { Job } from "../job";
import { JobConstraint } from "../jobConstraint";

export class EntityInstanceJobConstraint implements JobConstraint {
    constructor(private entity: Entity) {}

    isEntityApplicableForJob(job: Job, entity: Entity): boolean {
        return entity === this.entity;
    }
}
