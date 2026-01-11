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
import {
    getJobById,
    JobQueueComponentId,
    type JobQueueComponent,
} from "../../../component/jobQueueComponent.ts";
import { ResourceComponentId } from "../../../component/resourceComponent.ts";
import { RegrowComponentId } from "../../../component/regrowComponent.ts";
import { entityWithId } from "../../../entity/child/withId.ts";
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
import type { Jobs } from "../../../job/job.ts";

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
            const scene = ctx.root;
            const jobQueue = scene.getEcsComponent(JobQueueComponentId);
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

        createExecutionData: () => {
            // During planning, we don't know the actual claimed job yet.
            // The execute method will read it from the agent when it runs.
            return {
                jobIndex: 0, // Placeholder
            };
        },

        execute: (data, ctx) => {
            return movementExecutor(
                ctx,
                jobPosition(data, ctx),
                collectResourceExecutor,
            );
        },

        postActionDelay: () => 1000, // 1 second between harvest actions
    };

function jobPosition(
    data: CollectResourceActionData,
    ctx: GoapContext,
): () => Point {
    throw new Error("implement");
}

//TODO move to a common place when finished
function movementExecutor<T>(
    context: GoapContext,
    target: () => Point,
    executor: (data: T, ctx: GoapContext) => GoapActionExecutionResult,
): GoapActionExecutionResult {
    throw new Error("implement");
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

    // Get resource definition
    const resource = getResourceById(resourceComponent.resourceId);
    if (!resource) {
        console.error(
            `No resource definition for ${resourceComponent.resourceId}`,
        );
        unclaimJob(ctx.agent, jobIndex);
        return "complete";
    }

    // Adjacent to the resource, perform harvest action
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
