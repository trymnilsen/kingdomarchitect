import { Job } from "../../actor/job/job";

export interface JobQuery {
    matches(job: Job): boolean;
}
