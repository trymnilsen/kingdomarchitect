import { Job } from "../../../job/job.js";

export interface JobQuery {
    matches(job: Job): boolean;
}
