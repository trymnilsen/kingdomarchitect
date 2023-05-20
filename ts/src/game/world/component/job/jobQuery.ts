import { Job } from "../../job/job";

export interface JobQuery {
    matches(job: Job): boolean;
}
