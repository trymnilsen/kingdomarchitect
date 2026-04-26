import type { BehaviorActionData } from "../../behavior/actions/ActionData.ts";
import type { Entity } from "../../entity/entity.ts";
import type { BuildBuildingJob } from "../buildBuildingJob.ts";
import type { Jobs } from "../job.ts";
import { planCollectItem } from "./collectItemPlanner.ts";
import { planCollectResource } from "./collectResourcePlanner.ts";
import { planCrafting } from "./craftingPlanner.ts";
import { planProduction } from "./productionPlanner.ts";
import { planFarmPlant } from "./farmPlantJobPlanner.ts";
import { planFarmHarvest } from "./farmHarvestJobPlanner.ts";
import { planWindmill } from "./windmillPlanner.ts";
import { createLogger } from "../../../common/logging/logger.ts";

const log = createLogger("job");

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
        case "moveToJob":
            return [{ type: "moveTo", target: job.position }];
        default:
            log.warn("Unknown job type", { jobId: (job as Jobs).id });
            return [];
    }
}
