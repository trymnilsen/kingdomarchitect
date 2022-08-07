import { Actor } from "../../actor";
import { Job } from "../job";
import { JobConstraint } from "../jobConstraint";

export class ActorInstanceJobConstraint implements JobConstraint {
    private _actor: Actor;

    constructor(actor: Actor) {
        this._actor = actor;
    }
    isActorApplicableForJob(job: Job, actor: Actor): boolean {
        return actor === this._actor;
    }
}
