import type { EntityAction } from "../../../module/action/entityAction.js";
import type { Entity } from "../../entity/entity.js";
import type { Job } from "../../job/job.js";

export interface QueueJobAction extends EntityAction {
    job: Job;
    entityId: string;
}

export function makeQueueJobAction(job: Job, entity: Entity): QueueJobAction {
    return {
        id: ["actor", queueJobId],
        job: job,
        entityId: entity.id,
    };
}

export const queueJobId = "queueJob";
