import type { BehaviorActionData } from "../../behavior/actions/ActionData.ts";
import {
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import type { BuildBuildingJob } from "../buildBuildingJob.ts";
import type { Jobs } from "../job.ts";
import { jobsRequiringEmptyHeld } from "../jobsRequiringEmptyHeld.ts";
import { planCollectItem } from "./collectItemPlanner.ts";
import { planCollectResource } from "./collectResourcePlanner.ts";
import { planCrafting } from "./craftingPlanner.ts";
import { planDepositHeld } from "./planDepositHeld.ts";
import { planProduction } from "./productionPlanner.ts";
import { planFarmPlant } from "./farmPlantJobPlanner.ts";
import { planFarmHarvest } from "./farmHarvestJobPlanner.ts";
import { planWindmill } from "./windmillPlanner.ts";
import { planDismantleBuilding } from "./dismantleBuildingPlanner.ts";
import { log } from "../../../common/logging/logger.ts";

/**
 * Function signature for planning build jobs. Injected to allow different
 * strategies (player workers vs goblins).
 */
export type BuildJobPlanner = (
    root: Entity,
    worker: Entity,
    job: BuildBuildingJob,
) => BehaviorActionData[];

/**
 * Dispatcher that routes to the appropriate job planner based on job type.
 * Returns action sequence up to the next decision point.
 *
 * @param buildPlanner Injected planner for build jobs
 */
export function planJob(
    root: Entity,
    worker: Entity,
    job: Jobs,
    buildPlanner: BuildJobPlanner,
): BehaviorActionData[] {
    const actions = dispatchByJobId(root, worker, job, buildPlanner);
    if (actions.length === 0) {
        return actions;
    }

    if (jobsRequiringEmptyHeld.has(job.id)) {
        const held = worker.getEcsComponent(HeldItemComponentId);
        if (held && !isHeldEmpty(held)) {
            return [...planDepositHeld(worker), ...actions];
        }
    }

    return actions;
}

function dispatchByJobId(
    root: Entity,
    worker: Entity,
    job: Jobs,
    buildPlanner: BuildJobPlanner,
): BehaviorActionData[] {
    switch (job.id) {
        case "collectResource":
            return planCollectResource(root, worker, job);
        case "productionJob":
            return planProduction(root, worker, job);
        case "craftingJob":
            return planCrafting(root, worker, job);
        case "collectItem":
            return planCollectItem(root, worker, job);
        case "buildBuildingJob":
            return buildPlanner(root, worker, job);
        case "farmPlantJob":
            return planFarmPlant(root, worker, job);
        case "farmHarvestJob":
            return planFarmHarvest(root, worker, job);
        case "windmillJob":
            return planWindmill(root, worker, job);
        case "dismantleBuildingJob":
            return planDismantleBuilding(root, worker, job);
        case "moveToJob":
            return [{ type: "moveTo", target: job.position }];
        default:
            log.warn("Unknown job type", { jobId: (job as Jobs).id });
            return [];
    }
}
