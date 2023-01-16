import { World } from "../../world";
import { Actor } from "../actor";
import { Job } from "../job/job";

export interface UpdateContext {
    readonly actor: Actor;
    readonly world: World;
    readonly currentJob: Job | null;
    stopJob(): void;
    replaceJob(job: Job): void;
}

export interface Behavior {
    getIdleJob(): Job | null;
    update(tick: number, updateContext: UpdateContext): void;
}
