import { Entity } from "../../entity/entity.js";
import { Job } from "./job.js";

export interface JobConstraint {
    rankEntity(entity: Entity): number;
}
