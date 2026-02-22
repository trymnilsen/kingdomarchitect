import { distance } from "../../../common/point.ts";
import type { Entity } from "../../entity/entity.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import type { JobQueueComponent } from "../../component/jobQueueComponent.ts";
import type { Jobs } from "../../job/job.ts";
import type { BehaviorActionData } from "../actions/Action.ts";
import type { Behavior } from "./Behavior.ts";
import {
    canExecuteBuildJob,
    type BuildBuildingJob,
} from "../../job/buildBuildingJob.ts";
import { findJobClaimedBy, claimJobInQueue } from "../../job/jobLifecycle.ts";
import { planJob } from "../../job/planner/jobPlanner.ts";
import type { BuildJobPlanner } from "../../job/planner/jobPlanner.ts";

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
            return hasAvailableJobs(entity, jobQueue);
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
 * Check if there are available jobs for this entity.
 */
function hasAvailableJobs(
    entity: Entity,
    jobQueue: JobQueueComponent,
): boolean {
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

        if (!canExecuteJob(root, job, entity, buildJobValidator)) {
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
): boolean {
    switch (job.id) {
        case "buildBuildingJob":
            return buildJobValidator(
                root,
                job as BuildBuildingJob,
                workerEntity,
            );
        default:
            return true;
    }
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
        case "attackJob": {
            const entity = root.findEntity(job.target);
            return entity?.worldPosition ?? null;
        }
        case "moveToJob": {
            return job.position;
        }
        default:
            return null;
    }
}
