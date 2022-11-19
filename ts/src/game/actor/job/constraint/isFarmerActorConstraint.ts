import { Actor } from "../../actor";
import { FarmerActor } from "../../actors/farmerActor";
import { Job } from "../job";
import { JobConstraint } from "../jobConstraint";

export class IsFarmerJobConstraint implements JobConstraint {
    isActorApplicableForJob(job: Job, actor: Actor): boolean {
        return actor instanceof FarmerActor;
    }
}

export const isFarmerJobConstraint = new IsFarmerJobConstraint();
