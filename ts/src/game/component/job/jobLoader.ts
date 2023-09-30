import { ConstructorFunction } from "../../../common/constructor.js";
import { LookForFoodJob } from "../actor/mob/LookForFoodJob.js";
import { AttackJob } from "../actor/mob/attackJob.js";
import { Job, JobBundle } from "./job.js";
import { BuildJob } from "./jobs/buildJob.js";
import { CollectChestJob } from "./jobs/chest/collectChestJob.js";
import { ChopTreeJob } from "./jobs/chopTreeJob.js";
import { MoveJob } from "./jobs/moveJob.js";

export const jobLoaderJobs: ConstructorFunction<Job>[] = [
    AttackJob,
    LookForFoodJob,
    CollectChestJob,
    BuildJob,
    ChopTreeJob,
    MoveJob,
];

export function createJobFromBundle(jobBundle: JobBundle): Job {
    const jobConstructorFn = jobLoaderJobs.find(
        (fn) => fn.name == jobBundle.type,
    );
    if (!jobConstructorFn) {
        throw new Error(`Job constructor not found for ${jobBundle.type}`);
    }

    const jobInstance = new jobConstructorFn();
    jobInstance.fromJobBundle(jobBundle);
    return jobInstance;
}
