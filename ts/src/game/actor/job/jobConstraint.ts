import { Actor } from "../actor";
import { Job } from "./job";

export interface JobConstraint {
    isActorApplicableForJob(job: Job, actor: Actor): boolean;
}
