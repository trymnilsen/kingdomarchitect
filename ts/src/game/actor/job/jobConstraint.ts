import { Actor } from "../actor";
import { FarmerActor } from "../farmerActor";
import { Job } from "./job";

export interface JobConstraint {
    isActorApplicableForJob(job: Job, actor: Actor): boolean;
}
