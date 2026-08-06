import { log } from "../../../common/logging/logger.ts";
import type { PrioritiseJobCommand } from "../../../server/message/command/prioritiseJobCommand.ts";
import type { QueueJobCommand } from "../../../server/message/command/queueJobCommand.ts";
import {
    addJob,
    JobQueueComponentId,
    moveJobToFront,
} from "../../component/jobQueueComponent.ts";
import { findPlayerKingdom } from "../../component/playerKingdomComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { isTargetOfJob } from "../../job/job.ts";

/**
 * Handlers that add work to the player kingdom's job queue or reorder it.
 */
export function queueJob(root: Entity, command: QueueJobCommand) {
    const playerKingdom = findPlayerKingdom(root);
    if (!playerKingdom) {
        log.error("Player kingdom not found for job queue");
        return;
    }
    const jobQueue = playerKingdom.requireEcsComponent(JobQueueComponentId);
    addJob(jobQueue, command.job);

    // No explicit worker notification: idle workers re-select every tick, so
    // they pick up the newly queued job on their own next tick.
    playerKingdom.invalidateComponent(JobQueueComponentId);
}

export function prioritiseJob(root: Entity, command: PrioritiseJobCommand) {
    const playerKingdom = findPlayerKingdom(root);
    if (!playerKingdom) {
        log.error("Player kingdom not found, cannot prioritise job");
        return;
    }

    const entity = root.findEntity(command.entityId);
    if (!entity) {
        log.warn("Entity not found for PrioritiseJob", {
            entityId: command.entityId,
        });
        return;
    }

    const jobQueue = playerKingdom.requireEcsComponent(JobQueueComponentId);

    // Bump the first job that targets this entity to the front of the queue.
    // Searching only the player kingdom's own queue is itself the ownership
    // check: a job here is the player's work. Resources sit on world chunks
    // rather than under the kingdom, so an ancestor-based check would wrongly
    // reject chop and mine jobs. No match means there is nothing to do.
    const job = jobQueue.jobs.find((job) => isTargetOfJob(job, entity));
    if (!job) {
        return;
    }

    moveJobToFront(jobQueue, job);
    playerKingdom.invalidateComponent(JobQueueComponentId);
}
