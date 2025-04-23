import type { EntityAction } from "../../../module/action/entityAction.js";
import type { Job } from "../../job/job.js";

export interface QueueJobAction extends EntityAction {
    job: Job;
}

export function makeQueueJobAction(job: Job): QueueJobAction {
    return {
        id: ["actor", queueJobId],
        job: job,
    };
}

export const queueJobId = "queueJob";
