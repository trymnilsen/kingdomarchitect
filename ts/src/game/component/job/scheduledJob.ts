import { Job } from "./job.js";
import { JobConstraint } from "./jobConstraint.js";

export type ScheduledJob = {
    job: Job;
    constraint?: JobConstraint;
};
