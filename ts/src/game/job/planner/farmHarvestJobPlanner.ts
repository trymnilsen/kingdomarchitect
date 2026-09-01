import type { BehaviorActionData } from "../../behavior/actions/actionData.ts";
import type { Entity } from "../../entity/entity.ts";
import type { FarmHarvestJob } from "../farmHarvestJob.ts";
import { planWorkAtBuilding } from "./planWorkAtBuilding.ts";

export function planFarmHarvest(
    root: Entity,
    worker: Entity,
    job: FarmHarvestJob,
): BehaviorActionData[] {
    return planWorkAtBuilding(root, worker, job, [
        {
            type: "harvestCrop",
            buildingId: job.targetBuilding,
        },
    ]);
}
