import { distance } from "../../../common/point.ts";
import { Entity } from "../../entity/entity.ts";
import { JobRunnerComponentId } from "../../component/jobRunnerComponent.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import type { JobQueueComponent } from "../../component/jobQueueComponent.ts";
import { isJobClaimed } from "../../job/job.ts";
import type { Jobs } from "../../job/job.ts";
import type { BehaviorActionData } from "../actions/Action.ts";
import type { Behavior } from "./Behavior.ts";
import {
    canExecuteBuildJob,
    type BuildBuildingJob,
} from "../../job/buildBuildingJob.ts";

/**
 * PerformJobBehavior handles job execution for worker entities.
 * If the entity has a current job, it executes it.
 * Otherwise, it finds and claims the best available job from the queue.
 */
export function createPerformJobBehavior(): Behavior {
    return {
        name: "performJob",

        isValid(entity: Entity): boolean {
            const runner = entity.getEcsComponent(JobRunnerComponentId);
            if (!runner) {
                return false;
            }

            // Valid if we have a current job
            if (runner.currentJob) {
                return true;
            }

            // Valid if there are unclaimed jobs in the queue
            const root = entity.getRootEntity();
            const jobQueue = root.getEcsComponent(JobQueueComponentId);

            if (!jobQueue) {
                return false;
            }

            // Check if there are any unclaimed jobs
            const unclaimedJobs = jobQueue.jobs.filter((job) => {
                if (isJobClaimed(job)) {
                    return false;
                }

                // Skip jobs with entity constraints that don't match
                if (
                    job.constraint &&
                    job.constraint.type === "entity" &&
                    job.constraint.id !== entity.id
                ) {
                    return false;
                }

                return true;
            });

            return unclaimedJobs.length > 0;
        },

        utility(_entity: Entity): number {
            // Medium priority (50) - normal work priority
            return 50;
        },

        expand(entity: Entity): BehaviorActionData[] {
            const runner = entity.getEcsComponent(JobRunnerComponentId);

            if (!runner) {
                return [];
            }

            // If we already have a job, just execute it
            if (runner.currentJob) {
                return [{ type: "executeJob" }];
            }

            // Otherwise, find the best job to claim
            const root = entity.getRootEntity();
            const jobQueue = root.getEcsComponent(JobQueueComponentId);

            if (!jobQueue) {
                return [];
            }

            const bestJobIndex = findBestJob(entity, jobQueue);

            if (bestJobIndex === -1) {
                return [];
            }

            // Claim the job, then execute it
            return [
                { type: "claimJob", jobIndex: bestJobIndex },
                { type: "executeJob" },
            ];
        },
    };
}

/**
 * Find the best job for an entity based on distance and queue position.
 * Returns the index of the best job, or -1 if no suitable job found.
 */
function findBestJob(entity: Entity, jobQueue: JobQueueComponent): number {
    const root = entity.getRootEntity();
    let bestJobIndex = -1;
    let bestCost = Infinity;

    for (let i = 0; i < jobQueue.jobs.length; i++) {
        const job = jobQueue.jobs[i];

        // Skip claimed jobs
        if (isJobClaimed(job)) {
            continue;
        }

        // Skip jobs with entity constraints that don't match
        if (
            job.constraint &&
            job.constraint.type === "entity" &&
            job.constraint.id !== entity.id
        ) {
            continue;
        }

        // Check job-specific validity (e.g., materials available for build jobs)
        if (!canExecuteJob(root, job, entity)) {
            continue;
        }

        // Get the target position for this job
        const targetPosition = getJobTargetPosition(root, job);
        if (!targetPosition) {
            continue;
        }

        // Calculate cost: base + distance + queue position
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
function canExecuteJob(root: Entity, job: Jobs, workerEntity: Entity): boolean {
    switch (job.id) {
        case "buildBuildingJob":
            return canExecuteBuildJob(
                root,
                job as BuildBuildingJob,
                workerEntity,
            );
        default:
            // Other jobs have no special prerequisites
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
        case "craftingJob": {
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
