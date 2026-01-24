import { checkAdjacency, type Point } from "../../../../common/point.ts";
import { GoapAgentComponentId } from "../../../component/goapAgentComponent.ts";
import {
    damage,
    HealthComponentId,
} from "../../../component/healthComponent.ts";
import {
    addInventoryItem,
    InventoryComponentId,
} from "../../../component/inventoryComponent.ts";
import { JobQueueComponentId } from "../../../component/jobQueueComponent.ts";
import { ResourceComponentId } from "../../../component/resourceComponent.ts";
import { RegrowComponentId } from "../../../component/regrowComponent.ts";
import {
    getResourceById,
    ResourceHarvestMode,
} from "../../../../data/inventory/items/naturalResource.ts";
import {
    CollectResourceJobId,
    type CollectResourceJob,
} from "../../../job/collectResourceJob.ts";
import type {
    GoapActionDefinition,
    GoapActionExecutionResult,
} from "../../goapAction.ts";
import { createWorldState, getState, setState } from "../../goapWorldState.ts";
import type { GoapContext } from "../../goapContext.ts";
import { unclaimJob } from "../../goapJob.ts";
import { doMovement, MovementResult } from "../../../job/movementHelper.ts";

/**
 * Execution data for collecting a resource.
 */
export type CollectResourceActionData = {
    /** Index of the job in the queue */
    jobIndex: number;
};

/**
 * Collect resource action - harvest a resource from a claimed CollectResourceJob.
 * This action can only be executed after claiming a job of type CollectResourceJob.
 */
export const collectResourceAction: GoapActionDefinition<CollectResourceActionData> =
    {
        id: "collect_resource",
        name: "Collect Resource",
        // Base cost, movement handled by claim action
        // will rate based on occupation++ in the future
        getCost: () => 5,

        preconditions: (state, ctx) => {
            // Must have a claimed job
            const claimedJobIndex = getState(state, "claimedJob");
            if (!claimedJobIndex) {
                return false;
            }

            // Verify the job is a CollectResourceJob
            const jobQueue = ctx.root.getEcsComponent(JobQueueComponentId);
            if (!jobQueue) {
                return false;
            }

            const jobIndex = parseInt(claimedJobIndex);
            const job = jobQueue.jobs[jobIndex];
            if (!job || job.id !== CollectResourceJobId) {
                return false;
            }

            return true;
        },

        getEffects: () => {
            const effects = createWorldState();
            // Completing the job clears the claimed job
            // Use a sentinel value to distinguish "job completed" from "no job"
            setState(effects, "claimedJob", "__COMPLETE__");
            return effects;
        },

        createExecutionData: (ctx) => {
            // Read the claimed job from the agent's state
            const goapAgent =
                ctx.agent.requireEcsComponent(GoapAgentComponentId);
            const jobIndex = goapAgent.claimedJob ?? 0;
            return {
                jobIndex,
            };
        },

        execute: (data, ctx) => {
            return movementExecutor(
                data,
                ctx,
                jobPosition(data, ctx),
                collectResourceExecutor,
            );
        },

        postActionDelay: () => 1000, // 1 second between harvest actions
    };

/**
 * Creates a function that returns the position of the job's target entity.
 * This abstracts away the logic of finding the claimed job and getting its target position.
 * Returns null if the job or resource is invalid/missing.
 */
function jobPosition(
    data: CollectResourceActionData,
    ctx: GoapContext,
): () => Point | null {
    return () => {
        const jobQueue = ctx.root.requireEcsComponent(JobQueueComponentId);
        const job = jobQueue.jobs[data.jobIndex] as CollectResourceJob;
        if (!job) {
            return null;
        }

        if (!job.entityId) {
            return null;
        }

        const resourceEntity = ctx.root.findEntity(job.entityId);
        if (!resourceEntity) {
            return null;
        }
        return resourceEntity.worldPosition;
    };
}

/**
 * Movement executor wrapper that handles adjacency checking and movement.
 * If the agent is adjacent to the target, it calls through to the actual executor.
 * Otherwise, it attempts to move closer to the target.
 *
 * If target position is null, skips movement and calls the executor directly.
 * This allows the executor to handle the error with appropriate context.
 */
function movementExecutor<T>(
    data: T,
    ctx: GoapContext,
    target: () => Point | null,
    executor: (data: T, ctx: GoapContext) => GoapActionExecutionResult,
): GoapActionExecutionResult {
    const targetPosition = target();

    // If target position is null, skip movement and let executor handle the error
    // This allows for better error messages with context about what went wrong
    if (!targetPosition) {
        return executor(data, ctx);
    }

    const agentPosition = ctx.agent.worldPosition;

    // Check if we're adjacent to the target
    if (checkAdjacency(targetPosition, agentPosition) === null) {
        // Not adjacent, move towards the target
        const movement = doMovement(ctx.agent, targetPosition);
        if (movement === MovementResult.Failure) {
            console.log(
                `Failed to move to target at ${targetPosition.x},${targetPosition.y}`,
            );
            // Clear the claimed job since we can't reach it
            const agentComponent =
                ctx.agent.requireEcsComponent(GoapAgentComponentId);
            agentComponent.claimedJob = undefined;
            ctx.agent.invalidateComponent(GoapAgentComponentId);
            return "complete";
        }
        return "in_progress";
    }

    // Adjacent to the target, execute the actual action
    return executor(data, ctx);
}

function collectResourceExecutor(
    data: CollectResourceActionData,
    ctx: GoapContext,
): GoapActionExecutionResult {
    const agentComponent = ctx.agent.requireEcsComponent(GoapAgentComponentId);
    const jobQueue = ctx.root.requireEcsComponent(JobQueueComponentId);
    const jobIndex = data.jobIndex;
    const job = jobQueue.jobs[data.jobIndex];

    if (!job || job.id !== CollectResourceJobId) {
        console.error(`Job ${job?.id} is not a CollectResourceJob`);
        // Clear the claimed job since it's invalid
        agentComponent.claimedJob = undefined;
        ctx.agent.invalidateComponent(GoapAgentComponentId);
        return "complete";
    }

    const resourceEntity = ctx.root.findEntity(job.entityId);
    if (!resourceEntity) {
        console.error(`Resource entity ${job.entityId} not found`);
        // Clear the job and complete
        unclaimJob(ctx.agent, jobIndex);
        return "complete";
    }

    const resourceComponent =
        resourceEntity.getEcsComponent(ResourceComponentId);
    if (!resourceComponent) {
        console.error(`No resource component on entity ${job.entityId}`);
        unclaimJob(ctx.agent, jobIndex);
        return "complete";
    }

    // Verify adjacency - agent must be next to the resource to harvest it
    const adjacentDirection = checkAdjacency(
        ctx.agent.worldPosition,
        resourceEntity.worldPosition,
    );
    if (adjacentDirection === null) {
        console.error(
            `Agent ${ctx.agent.id} attempted to harvest resource ${job.entityId} but is not adjacent`,
        );
        // This should not happen if movement executor is working correctly
        // Clear the job and let the agent re-plan
        unclaimJob(ctx.agent, jobIndex);
        return "complete";
    }

    // Get resource definition
    const resource = getResourceById(resourceComponent.resourceId);
    if (!resource) {
        console.error(
            `No resource definition for ${resourceComponent.resourceId}`,
        );
        unclaimJob(ctx.agent, jobIndex);
        return "complete";
    }

    // Perform harvest action
    const workDuration = resource.workDuration ?? 1;

    // Initialize work progress if not set
    if (job.workProgress === undefined) {
        job.workProgress = 0;
    }

    // Increment work progress
    job.workProgress++;

    // Special handling for Chop action - uses HealthComponent
    if (job.harvestAction === ResourceHarvestMode.Chop) {
        const healthComponent =
            resourceEntity.getEcsComponent(HealthComponentId);
        if (!healthComponent) {
            console.log("Resource had no health component for chopping");
            unclaimJob(ctx.agent, jobIndex);
            return "complete";
        }

        // Deal damage to the resource
        damage(healthComponent, 10);
        resourceEntity.invalidateComponent(HealthComponentId);

        // If resource is destroyed, complete the job
        if (healthComponent.currentHp <= 0) {
            // Grant yields
            ctx.agent.updateComponent(InventoryComponentId, (inventory) => {
                for (const yieldItem of resource.yields) {
                    addInventoryItem(
                        inventory,
                        yieldItem.item,
                        yieldItem.amount,
                    );
                }
            });

            resourceEntity.remove();

            // Clear the claimed job and remove from queue
            unclaimJob(ctx.agent, jobIndex);

            console.log(`Agent ${ctx.agent.id} completed resource collection`);
            return "complete";
        }
    } else {
        // For other harvest actions (Mine, Cut, Pick), check work progress
        if (job.workProgress >= workDuration) {
            // Work complete - grant items and apply lifecycle
            ctx.agent.updateComponent(InventoryComponentId, (inventory) => {
                for (const yieldItem of resource.yields) {
                    addInventoryItem(
                        inventory,
                        yieldItem.item,
                        yieldItem.amount,
                    );
                }
            });

            // Apply lifecycle behavior
            const lifecycle = resource.lifecycle;
            if (lifecycle.type === "Finite") {
                resourceEntity.remove();
            } else if (lifecycle.type === "Infinite") {
                job.workProgress = 0;
            } else if (lifecycle.type === "Remove") {
                resourceEntity.remove();
            } else if (lifecycle.type === "Regrow") {
                const regrowComponent =
                    resourceEntity.getEcsComponent(RegrowComponentId);
                if (regrowComponent) {
                    regrowComponent.harvestedAtTick = ctx.tick;
                    resourceEntity.invalidateComponent(RegrowComponentId);
                }
            }

            // Clear the claimed job and remove from queue
            unclaimJob(ctx.agent, jobIndex);

            console.log(`Agent ${ctx.agent.id} completed resource collection`);
            return "complete";
        }
    }

    // Still working on it
    ctx.agent.getRootEntity().invalidateComponent(JobQueueComponentId);
    return "in_progress";
}
