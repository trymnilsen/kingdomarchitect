import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../../behavior/actions/Action.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import type { AttackJob } from "../attackJob.ts";
import { failJobFromQueue } from "../jobLifecycle.ts";

/**
 * Plan actions for attacking a target.
 *
 * @example
 * // Typical return: [moveTo(target), attackTarget(target)]
 */
export function planAttack(
    root: Entity,
    worker: Entity,
    job: AttackJob,
): BehaviorActionData[] {
    const targetEntity = root.findEntity(job.target);

    if (!targetEntity) {
        const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
        if (queueEntity) {
            failJobFromQueue(queueEntity, job);
        }
        return [];
    }

    return [
        {
            type: "moveTo",
            target: targetEntity.worldPosition,
            stopAdjacent: "cardinal",
        },
        { type: "attackTarget", targetId: job.target },
    ];
}
