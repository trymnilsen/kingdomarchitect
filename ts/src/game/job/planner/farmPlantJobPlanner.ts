import type { BehaviorActionData } from "../../behavior/actions/ActionData.ts";
import type { Entity } from "../../entity/entity.ts";
import type { FarmPlantJob } from "../farmPlantJob.ts";
import { planWorkAtBuilding } from "./planWorkAtBuilding.ts";

export function planFarmPlant(
    root: Entity,
    worker: Entity,
    job: FarmPlantJob,
): BehaviorActionData[] {
    return planWorkAtBuilding(root, worker, job, [
        {
            type: "plantCrop",
            buildingId: job.targetBuilding,
        },
    ]);
}
