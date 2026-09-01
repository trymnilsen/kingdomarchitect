import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../../behavior/actions/actionData.ts";
import type { WindmillJob } from "../windmillJob.ts";
import { planWorkAtBuilding } from "./planWorkAtBuilding.ts";

/**
 * Plan actions for working a windmill.
 * The worker walks adjacent to the windmill, steps onto its tile, then runs
 * workWindmill which handles planting and harvesting the surrounding farms.
 */
export function planWindmill(
    root: Entity,
    worker: Entity,
    job: WindmillJob,
): BehaviorActionData[] {
    return planWorkAtBuilding(root, worker, job, [
        { type: "stepOnto", targetId: job.targetBuilding },
        {
            type: "workWindmill",
            windmillId: job.targetBuilding,
        },
    ]);
}
