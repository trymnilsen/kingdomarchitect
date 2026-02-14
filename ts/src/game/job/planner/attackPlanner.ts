import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../../behavior/actions/Action.ts";
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
    _worker: Entity,
    job: AttackJob,
): BehaviorActionData[] {
    const targetEntity = root.findEntity(job.target);

    if (!targetEntity) {
        failJobFromQueue(root, job);
        return [];
    }

    return [
        { type: "moveTo", target: targetEntity.worldPosition },
        { type: "attackTarget", targetId: job.target },
    ];
}
