import { checkAdjacency } from "../../../../common/point.ts";
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
import { entityWithId } from "../../../entity/child/withId.ts";
import {
    getResourceById,
    ResourceHarvestMode,
} from "../../../../data/inventory/items/naturalResource.ts";
import type { CollectResourceJob } from "../../../job/collectResourceJob.ts";
import type { GoapActionDefinition } from "../../goapAction.ts";
import { createWorldState, getState, setState } from "../../goapWorldState.ts";

/**
 * Execution data for collecting a resource.
 */
export type CollectResourceActionData = {
    /** Index of the job in the queue */
    jobIndex: string;
};

/**
 * Collect resource action - harvest a resource from a claimed CollectResourceJob.
 * This action can only be executed after claiming a job of type CollectResourceJob.
 */
export const collectResourceAction: GoapActionDefinition<CollectResourceActionData> =
    {
        id: "collect_resource",
        name: "Collect Resource",

        getCost: () => 5, // Base cost, movement handled by claim action

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
            if (!job || job.id !== "chopTreeJob") {
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
                jobIndex: "", // Placeholder
            };
        },

        execute: (_data, ctx) => {
            const agent = entityWithId(ctx.root, ctx.agentId);
            if (!agent) {
                throw new Error("Agent not found during execution");
            }

            const goapAgent = agent.getEcsComponent(GoapAgentComponentId);
            if (!goapAgent) {
                throw new Error("No GOAP agent component");
            }

            const scene = ctx.root;
            const jobQueue = scene.getEcsComponent(JobQueueComponentId);
            if (!jobQueue) {
                throw new Error("No job queue");
            }

            // Read the actual claimed job from the agent (not from execution data)
            const jobIndex = goapAgent.claimedJob
                ? parseInt(goapAgent.claimedJob)
                : -1;
            if (jobIndex < 0) {
                console.error(
                    "No claimed job during collect_resource execution",
                );
                return "complete";
            }
            const job = jobQueue.jobs[jobIndex] as CollectResourceJob;

            if (!job || job.id !== "chopTreeJob") {
                console.error(
                    `Job at index ${jobIndex} is not a CollectResourceJob`,
                );
                // Clear the claimed job since it's invalid
                goapAgent.claimedJob = undefined;
                agent.invalidateComponent(GoapAgentComponentId);
                return "complete";
            }

            const resourceEntity = ctx.root.findEntity(job.entityId);
            if (!resourceEntity) {
                console.error(`Resource entity ${job.entityId} not found`);
                // Clear the job and complete
                goapAgent.claimedJob = undefined;
                jobQueue.jobs.splice(jobIndex, 1);
                agent.invalidateComponent(GoapAgentComponentId);
                scene.invalidateComponent(JobQueueComponentId);
                return "complete";
            }

            const resourceComponent =
                resourceEntity.getEcsComponent(ResourceComponentId);
            if (!resourceComponent) {
                console.error(
                    `No resource component on entity ${job.entityId}`,
                );
                goapAgent.claimedJob = undefined;
                jobQueue.jobs.splice(jobIndex, 1);
                agent.invalidateComponent(GoapAgentComponentId);
                scene.invalidateComponent(JobQueueComponentId);
                return "complete";
            }

            // Get resource definition
            const resource = getResourceById(resourceComponent.resourceId);
            if (!resource) {
                console.error(
                    `No resource definition for ${resourceComponent.resourceId}`,
                );
                goapAgent.claimedJob = undefined;
                jobQueue.jobs.splice(jobIndex, 1);
                agent.invalidateComponent(GoapAgentComponentId);
                scene.invalidateComponent(JobQueueComponentId);
                return "complete";
            }

            // Check if we're adjacent to the resource
            if (
                checkAdjacency(
                    resourceEntity.worldPosition,
                    agent.worldPosition,
                ) === null
            ) {
                // Not adjacent yet - need to move (should be handled by movement system)
                // For now, we'll just return in_progress
                console.log("Not adjacent to resource, need to move");
                return "in_progress";
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
                    console.log(
                        "Resource had no health component for chopping",
                    );
                    goapAgent.claimedJob = undefined;
                    jobQueue.jobs.splice(jobIndex, 1);
                    agent.invalidateComponent(GoapAgentComponentId);
                    scene.invalidateComponent(JobQueueComponentId);
                    return "complete";
                }

                // Deal damage to the resource
                damage(healthComponent, 10);
                resourceEntity.invalidateComponent(HealthComponentId);

                // If resource is destroyed, complete the job
                if (healthComponent.currentHp <= 0) {
                    // Grant yields
                    agent.updateComponent(InventoryComponentId, (inventory) => {
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
                    goapAgent.claimedJob = undefined;
                    jobQueue.jobs.splice(jobIndex, 1);
                    agent.invalidateComponent(GoapAgentComponentId);
                    scene.invalidateComponent(JobQueueComponentId);

                    console.log(
                        `Agent ${ctx.agentId} completed resource collection`,
                    );
                    return "complete";
                }
            } else {
                // For other harvest actions (Mine, Cut, Pick), check work progress
                if (job.workProgress >= workDuration) {
                    // Work complete - grant items and apply lifecycle
                    agent.updateComponent(InventoryComponentId, (inventory) => {
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
                            resourceEntity.invalidateComponent(
                                RegrowComponentId,
                            );
                        }
                    }

                    // Clear the claimed job and remove from queue
                    goapAgent.claimedJob = undefined;
                    jobQueue.jobs.splice(jobIndex, 1);
                    agent.invalidateComponent(GoapAgentComponentId);
                    scene.invalidateComponent(JobQueueComponentId);

                    console.log(
                        `Agent ${ctx.agentId} completed resource collection`,
                    );
                    return "complete";
                }
            }

            // Still working on it
            scene.invalidateComponent(JobQueueComponentId);
            return "in_progress";
        },

        postActionDelay: () => 1000, // 1 second between harvest actions
    };
