import { distance } from "../../../../common/point.ts";
import { GoapAgentComponentId } from "../../../component/goapAgentComponent.ts";
import { JobQueueComponentId } from "../../../component/jobQueueComponent.ts";
import { isJobClaimed, type Jobs } from "../../../job/job.ts";
import type { GoapActionDefinition } from "../../goapAction.ts";
import type { GoapContext } from "../../goapContext.ts";
import { createWorldState, getState, setState } from "../../goapWorldState.ts";

/**
 * Execution data for claiming a specific job.
 */
export type ClaimOrderActionData = {
    /** The job being claimed */
    job: Jobs;
    /** The ID of the job for logging */
    jobIndex: number;
};

/**
 * Generate dynamic claim actions for all unclaimed jobs in the queue.
 * Creates one action per unclaimed job, allowing the planner to choose
 * the best job based on cost (distance + queue position).
 *
 * @param ctx - The planning context
 * @returns Array of claim actions, one per unclaimed job
 */
export function generateClaimOrderActions(
    ctx: GoapContext,
): GoapActionDefinition<ClaimOrderActionData>[] {
    const scene = ctx.root;
    const jobQueue = scene.getEcsComponent(JobQueueComponentId);

    if (!jobQueue) {
        return [];
    }

    const actions: GoapActionDefinition<ClaimOrderActionData>[] = [];

    // Generate one action per unclaimed job
    for (let i = 0; i < jobQueue.jobs.length; i++) {
        const job = jobQueue.jobs[i];

        // Skip if job is already claimed by someone
        if (isJobClaimed(job)) {
            continue;
        }

        // Skip if job has a constraint that doesn't match this agent
        if (
            job.constraint &&
            job.constraint.type === "entity" &&
            job.constraint.id !== ctx.agent.id
        ) {
            continue;
        }

        // Get the target position for this job
        const targetPosition = getJobTargetPosition(ctx, job);
        if (!targetPosition) {
            continue; // Can't determine where this job is
        }

        // Calculate cost: base cost + distance + queue position
        const baseCost = 10;
        const distanceCost = distance(ctx.agent.worldPosition, targetPosition);
        const queuePositionCost = i; // Earlier jobs are cheaper
        const totalCost = baseCost + distanceCost + queuePositionCost;

        // Create a dynamic action for this specific job
        actions.push(createClaimOrderAction(job, i, totalCost));
    }

    return actions;
}

/**
 * Get the target position for a job (where the worker needs to go).
 */
function getJobTargetPosition(
    ctx: GoapContext,
    job: Jobs,
): { x: number; y: number } | null {
    switch (job.id) {
        case "collectResource":
        case "collectItem":
        case "buildBuildingJob": {
            const entity = ctx.root.findEntity(job.entityId);
            return entity?.worldPosition ?? null;
        }
        case "attackJob": {
            const entity = ctx.root.findEntity(job.target);
            return entity?.worldPosition ?? null;
        }

        case "moveToJob": {
            return job.position;
        }
        default:
            return null;
    }
}

/**
 * Create a claim action for a specific job.
 */
function createClaimOrderAction(
    job: Jobs,
    jobIndex: number,
    cost: number,
): GoapActionDefinition<ClaimOrderActionData> {
    return {
        id: `claim_job_${jobIndex}`,
        name: `Claim job ${jobIndex} (${job.id})`,

        getCost: () => cost,

        preconditions: (state) => {
            // Can only claim if we don't already have a claimed job
            const claimedJob = getState(state, "claimedJob");
            return !claimedJob;
        },

        getEffects: (_state) => {
            const effects = createWorldState();
            // Claiming a job sets the claimedJob state
            setState(effects, "claimedJob", `${jobIndex}`);
            return effects;
        },

        createExecutionData: () => ({
            job,
            jobIndex,
        }),

        execute: (data, ctx) => {
            const goapAgent = ctx.agent.getEcsComponent(GoapAgentComponentId);
            if (!goapAgent) {
                throw new Error(
                    "No GOAP agent component during claim execution",
                );
            }

            const scene = ctx.root;
            const jobQueue = scene.getEcsComponent(JobQueueComponentId);
            if (!jobQueue) {
                throw new Error("No job queue component");
            }

            // Check if job is still available (hasn't been claimed by someone else)
            const currentJob = jobQueue.jobs[data.jobIndex];
            if (!currentJob) {
                console.warn(
                    `Job at index ${data.jobIndex} no longer exists in queue`,
                );
                return "complete"; // Job gone, nothing to claim
            }

            if (currentJob.claimedBy) {
                console.warn(
                    `Job ${data.jobIndex} already claimed by ${currentJob.claimedBy}`,
                );
                return "complete"; // Already claimed by someone else
            }

            // Claim the job
            goapAgent.claimedJob = data.jobIndex;
            currentJob.claimedBy = ctx.agent.id;
            currentJob.state = "claimed";

            // Invalidate components
            ctx.agent.invalidateComponent(GoapAgentComponentId);
            scene.invalidateComponent(JobQueueComponentId);

            console.log(
                `Agent ${ctx.agent.id} claimed job ${data.jobIndex} (${data.job.id})`,
            );

            return "complete";
        },

        postActionDelay: () => 5, // Brief pause after claiming
    };
}
