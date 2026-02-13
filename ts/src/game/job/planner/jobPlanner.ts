import type { BehaviorActionData } from "../../behavior/actions/Action.ts";
import type { Entity } from "../../entity/entity.ts";
import type { Jobs } from "../job.ts";
import { planAttack } from "./attackPlanner.ts";
import { planBuildBuilding } from "./buildBuildingPlanner.ts";
import { planCollectItem } from "./collectItemPlanner.ts";
import { planCollectResource } from "./collectResourcePlanner.ts";
import { planCrafting } from "./craftingPlanner.ts";
import { planProduction } from "./productionPlanner.ts";

/**
 * Dispatcher that routes to the appropriate job planner based on job type.
 * Returns action sequence up to the next decision point.
 */
export function planJob(
    root: Entity,
    worker: Entity,
    job: Jobs,
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
        case "attackJob":
            return planAttack(root, worker, job);
        case "buildBuildingJob":
            return planBuildBuilding(root, worker, job);
        case "moveToJob":
            // Simple move job - just move to the target position
            return [{ type: "moveTo", target: job.position }];
        default:
            console.warn(`[JobPlanner] Unknown job type: ${(job as Jobs).id}`);
            return [];
    }
}
