import { Job } from "./job.js";
import { JobBundle } from "./jobBundle.js";
import { jobLoaders } from "../../../../generated/jobLoader.js";

export function createJobFromBundle(jobBundle: JobBundle): Job {
    const jobConstructorFn = jobLoaders.find((fn) => fn.name == jobBundle.type);
    if (!jobConstructorFn) {
        throw new Error(`Job constructor not found for ${jobBundle.type}`);
    }

    const jobInstance = new jobConstructorFn();
    jobInstance.fromJobBundle(jobBundle);
    return jobInstance;
}
