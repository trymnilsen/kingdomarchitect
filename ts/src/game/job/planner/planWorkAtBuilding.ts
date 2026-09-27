import type { BehaviorActionData } from "../../behavior/actions/actionData.ts";
import type { Entity } from "../../entity/entity.ts";
import type { Jobs } from "../job.ts";
import { removeJobForWorker } from "../jobLifecycle.ts";

/**
 * Plan the work done at the job's building. When the building is gone there is
 * nothing left to work at, so the job is retired instead of handed out. The
 * walk there is each action's own approach.
 */
export function planWorkAtBuilding(
    root: Entity,
    worker: Entity,
    job: Jobs & { targetBuilding: string },
    workAtBuilding: BehaviorActionData[],
): BehaviorActionData[] {
    if (!root.findEntity(job.targetBuilding)) {
        removeJobForWorker(worker, job);
        return [];
    }

    return workAtBuilding;
}
