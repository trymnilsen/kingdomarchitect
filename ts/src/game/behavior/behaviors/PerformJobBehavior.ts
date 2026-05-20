import { distance } from "../../../common/point.ts";
import type { Entity } from "../../entity/entity.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import type { JobQueueComponent } from "../../component/jobQueueComponent.ts";
import { isJobValid, type Jobs } from "../../job/job.ts";
import type { BehaviorActionData } from "../actions/ActionData.ts";
import type { Behavior } from "./Behavior.ts";
import {
    canExecuteBuildJob,
    type BuildBuildingJob,
} from "../../job/buildBuildingJob.ts";
import { findJobClaimedBy, claimJobInQueue } from "../../job/jobLifecycle.ts";
import { CraftingJobId, type CraftingJob } from "../../job/craftingJob.ts";
import { WindmillJobId, type WindmillJob } from "../../job/windmillJob.ts";
import { ProductionJobId, type ProductionJob } from "../../job/productionJob.ts";
import { planJob } from "../../job/planner/jobPlanner.ts";
import type { BuildJobPlanner } from "../../job/planner/jobPlanner.ts";
import type { CollectResourceJob } from "../../job/collectResourceJob.ts";
import { ResourceComponentId } from "../../component/resourceComponent.ts";
import {
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import { getResourceById } from "../../../data/inventory/items/naturalResource.ts";
import {
    BehaviorAgentComponentId,
} from "../../component/BehaviorAgentComponent.ts";
import { getJobDisplayName } from "../../job/jobDisplayName.ts";

type BuildJobValidator = (
    root: Entity,
    job: BuildBuildingJob,
    worker: Entity,
) => boolean;

/**
 * PerformJobBehavior handles job execution for entities.
 * Uses ancestor traversal to find the nearest JobQueueComponent in the
 * entity hierarchy — player workers find the root queue, goblins find
 * their camp's queue.
 *
 * @param buildPlanner Injected planner for build jobs. Player workers
 *   use planBuildBuilding (stockpile-only), goblins use planGoblinBuildJob
 *   (gather from environment).
 * @param buildJobValidator Pre-check for build jobs. Defaults to
 *   canExecuteBuildJob (stockpile check). Pass `() => true` for goblins
 *   that gather from the environment.
 */
export function createPerformJobBehavior(
    buildPlanner: BuildJobPlanner,
    buildJobValidator: BuildJobValidator = canExecuteBuildJob,
): Behavior {
    return {
        name: "performJob",

        isValid(entity: Entity): boolean {
            const jobQueue =
                entity.getAncestorEcsComponent(JobQueueComponentId);

            if (!jobQueue) {
                return false;
            }

            // Valid if has claimed job
            const hasClaimedJob = jobQueue.jobs.some(
                (job) => job.claimedBy === entity.id,
            );
            if (hasClaimedJob) {
                return true;
            }

            // Valid if there are unclaimed jobs we can take
            return hasAvailableJobs(entity, jobQueue, buildJobValidator);
        },

        utility(_entity: Entity): number {
            return 50;
        },

        expand(entity: Entity): BehaviorActionData[] {
            const root = entity.getRootEntity();
            const queueEntity = entity.getAncestorEntity(JobQueueComponentId);

            if (!queueEntity) {
                return [];
            }

            const jobQueue = queueEntity.getEcsComponent(JobQueueComponentId);

            if (!jobQueue) {
                console.info(
                    `[PerformJobBehavior] entity ${entity.id} had no job queue`,
                );
                return [];
            }

            // Find job claimed by this entity
            const claimedJob = findJobClaimedBy(queueEntity, entity.id);
            if (claimedJob) {
                console.info(
                    `[PerformJobBehavior] entity ${entity.id} had claimed job ${claimedJob.id}`,
                    JSON.stringify(claimedJob),
                );
                const agent = entity.getEcsComponent(BehaviorAgentComponentId);
                if (agent) {
                    agent.currentJobName = getJobDisplayName(root, claimedJob);
                }
                const actions = planJob(root, entity, claimedJob, buildPlanner);
                console.info(
                    `[PerformJobBehavior] entity ${entity.id} planned actions`,
                    JSON.stringify(actions),
                );
                return actions;
            }

            // No claimed job, try to claim a new one
            const bestJobIndex = findBestJob(
                entity,
                jobQueue,
                buildJobValidator,
            );
            if (bestJobIndex === -1) {
                console.info(
                    `[PerformJobBehavior] entity ${entity.id} had no possible jobs, returning []`,
                );
                return [];
            }

            const job = jobQueue.jobs[bestJobIndex];
            console.info(
                `[PerformJobBehavior] entity ${entity.id} claiming job`,
                JSON.stringify(job),
            );
            claimJobInQueue(job, entity.id, queueEntity);
            const agent = entity.getEcsComponent(BehaviorAgentComponentId);
            if (agent) {
                agent.currentJobName = getJobDisplayName(root, job);
            }
            const actions = planJob(root, entity, job, buildPlanner);
            console.info(
                `[PerformJobBehavior] entity ${entity.id} planned actions`,
                JSON.stringify(actions),
            );
            return actions;
        },
    };
}

/**
 * Check if there are available jobs for this entity. The buildJobValidator
 * mirrors the one used by findBestJob so isValid() and findBestJob() agree
 * on whether a build job can be executed by this worker — goblins that
 * gather from the environment pass `() => true` to bypass the stockpile
 * pre-check that player workers rely on.
 */
function hasAvailableJobs(
    entity: Entity,
    jobQueue: JobQueueComponent,
    buildJobValidator: BuildJobValidator,
): boolean {
    const root = entity.getRootEntity();
    for (const job of jobQueue.jobs) {
        if (job.claimedBy !== undefined) {
            continue;
        }

        if (
            job.constraint &&
            job.constraint.type === "entity" &&
            job.constraint.id !== entity.id
        ) {
            continue;
        }

        if (job.id === "buildBuildingJob") {
            if (!buildJobValidator(root, job as BuildBuildingJob, entity)) {
                continue;
            }
        } else if (job.id === CraftingJobId) {
            if (!canExecuteCraftingJob(jobQueue, job as CraftingJob)) {
                continue;
            }
        } else if (job.id === WindmillJobId) {
            if (!canExecuteWindmillJob(jobQueue, job as WindmillJob)) {
                continue;
            }
        } else if (job.id === ProductionJobId) {
            if (!canExecuteProductionJob(jobQueue, job as ProductionJob)) {
                continue;
            }
        } else if (!isJobValid(job, entity)) {
            continue;
        }

        return true;
    }

    return false;
}

/**
 * Find the best job for an entity based on distance and queue position.
 * Returns the index of the best job, or -1 if no suitable job found.
 */
function findBestJob(
    entity: Entity,
    jobQueue: JobQueueComponent,
    buildJobValidator: BuildJobValidator,
): number {
    const root = entity.getRootEntity();
    let bestJobIndex = -1;
    let bestCost = Infinity;

    for (let i = 0; i < jobQueue.jobs.length; i++) {
        const job = jobQueue.jobs[i];

        if (job.claimedBy !== undefined) {
            continue;
        }

        if (
            job.constraint &&
            job.constraint.type === "entity" &&
            job.constraint.id !== entity.id
        ) {
            continue;
        }

        if (!canExecuteJob(root, job, entity, buildJobValidator, jobQueue)) {
            continue;
        }

        const targetPosition = getJobTargetPosition(root, job);
        if (!targetPosition) {
            continue;
        }

        // Cost combines distance and queue position so workers prefer nearby jobs
        // but still respect rough priority order (earlier jobs score lower queue cost).
        // baseCost provides a floor so a job at distance 0 doesn't get an unfair
        // advantage purely from its index relative to other close-by jobs.
        const baseCost = 10;
        const distanceCost = distance(entity.worldPosition, targetPosition);
        const queuePositionCost = i;
        const totalCost = baseCost + distanceCost + queuePositionCost;

        if (totalCost < bestCost) {
            bestCost = totalCost;
            bestJobIndex = i;
        }
    }

    return bestJobIndex;
}

/**
 * Check if a job can be executed by a worker.
 * Returns false if the job has prerequisites that aren't met.
 */
function canExecuteJob(
    root: Entity,
    job: Jobs,
    workerEntity: Entity,
    buildJobValidator: BuildJobValidator,
    jobQueue: JobQueueComponent,
): boolean {
    switch (job.id) {
        case "buildBuildingJob":
            return buildJobValidator(
                root,
                job as BuildBuildingJob,
                workerEntity,
            );
        case "collectResource":
            return canHeldAcceptResourceYield(
                root,
                job as CollectResourceJob,
                workerEntity,
            );
        case "craftingJob":
            return canExecuteCraftingJob(jobQueue, job as CraftingJob);
        case "windmillJob":
            return canExecuteWindmillJob(jobQueue, job as WindmillJob);
        case "productionJob":
            return canExecuteProductionJob(jobQueue, job as ProductionJob);
        default:
            return true;
    }
}

/**
 * Reject collect-resource jobs when the worker is already carrying
 * something incompatible with the resource's yield. Without this guard
 * the worker would walk to the tree, swing for several ticks, then fail
 * at the deposit step with full progress wasted.
 */
function canHeldAcceptResourceYield(
    root: Entity,
    job: CollectResourceJob,
    worker: Entity,
): boolean {
    const held = worker.getEcsComponent(HeldItemComponentId);
    if (!held || isHeldEmpty(held)) return true;

    const resourceEntity = root.findEntity(job.entityId);
    if (!resourceEntity) return false;

    const resourceComponent =
        resourceEntity.getEcsComponent(ResourceComponentId);
    if (!resourceComponent) return false;

    const resource = getResourceById(resourceComponent.resourceId);
    if (!resource) return false;

    const heldId = held.item!.id;
    return resource.yields.every((y) => y.item.id === heldId);
}

/**
 * Reject crafting jobs when another worker has already claimed a crafting job
 * at the same building. Only one worker can use a crafting station at a time.
 */
function canExecuteCraftingJob(
    jobQueue: JobQueueComponent,
    job: CraftingJob,
): boolean {
    return !jobQueue.jobs.some(
        (j) =>
            j.claimedBy !== undefined &&
            j.id === CraftingJobId &&
            (j as CraftingJob).targetBuilding === job.targetBuilding,
    );
}

/**
 * Reject windmill jobs when another worker has already claimed a windmill job
 * at the same building. Only one worker can operate a windmill at a time.
 */
function canExecuteWindmillJob(
    jobQueue: JobQueueComponent,
    job: WindmillJob,
): boolean {
    return !jobQueue.jobs.some(
        (j) =>
            j.claimedBy !== undefined &&
            j.id === WindmillJobId &&
            (j as WindmillJob).targetBuilding === job.targetBuilding,
    );
}

/**
 * Reject production jobs when another worker has already claimed a production job
 * at the same building. Only one worker can operate a production facility at a time.
 */
function canExecuteProductionJob(
    jobQueue: JobQueueComponent,
    job: ProductionJob,
): boolean {
    return !jobQueue.jobs.some(
        (j) =>
            j.claimedBy !== undefined &&
            j.id === ProductionJobId &&
            (j as ProductionJob).targetBuilding === job.targetBuilding,
    );
}

/**
 * Get the target position for a job (where the worker needs to go).
 */
function getJobTargetPosition(
    root: Entity,
    job: Jobs,
): { x: number; y: number } | null {
    switch (job.id) {
        case "collectResource":
        case "collectItem":
        case "buildBuildingJob": {
            const entity = root.findEntity(job.entityId);
            return entity?.worldPosition ?? null;
        }
        case "craftingJob":
        case "productionJob": {
            const entity = root.findEntity(job.targetBuilding);
            return entity?.worldPosition ?? null;
        }
        case "farmPlantJob":
        case "windmillJob":
        case "farmHarvestJob": {
            const entity = root.findEntity(job.targetBuilding);
            return entity?.worldPosition ?? null;
        }
        case "moveToJob": {
            return job.position;
        }
        default:
            return null;
    }
}
