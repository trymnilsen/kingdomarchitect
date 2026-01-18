import { checkAdjacency, type Point } from "../../../../common/point.ts";
import {
    type AdjacencyMask,
    adjacencyMaskToEnum,
    createAdjacencyMask,
} from "../../../../common/adjacency.ts";
import { buildingAdjecency } from "../../../../data/building/buildings.ts";
import { queryAdjacentEntities } from "../../../map/query/queryEntity.ts";
import { BuildingComponentId } from "../../../component/buildingComponent.ts";
import { GoapAgentComponentId } from "../../../component/goapAgentComponent.ts";
import {
    heal,
    HealthComponentId,
} from "../../../component/healthComponent.ts";
import { SpriteComponentId } from "../../../component/spriteComponent.ts";
import { JobQueueComponentId } from "../../../component/jobQueueComponent.ts";
import type { Entity } from "../../../entity/entity.ts";
import {
    BuildBuildingJobId,
    type BuildBuildingJob,
} from "../../../job/buildBuildingJob.ts";
import type {
    GoapActionDefinition,
    GoapActionExecutionResult,
} from "../../goapAction.ts";
import { createWorldState, getState, setState } from "../../goapWorldState.ts";
import type { GoapContext } from "../../goapContext.ts";
import { unclaimJob } from "../../goapJob.ts";
import { doMovement, MovementResult } from "../../../job/movementHelper.ts";

/**
 * Execution data for building a building.
 */
export type BuildBuildingActionData = {
    /** Index of the job in the queue */
    jobIndex: number;
};

/**
 * Build building action - construct a building from a claimed BuildBuildingJob.
 * This action can only be executed after claiming a job of type BuildBuildingJob.
 */
export const buildBuildingAction: GoapActionDefinition<BuildBuildingActionData> =
    {
        id: "build_building",
        name: "Build Building",
        // Base cost, movement handled by claim action
        // Will rate based on occupation in the future
        getCost: () => 5,

        preconditions: (state, ctx) => {
            // Must have a claimed job
            const claimedJobIndex = getState(state, "claimedJob");
            if (!claimedJobIndex) {
                return false;
            }

            // Verify the job is a BuildBuildingJob
            const scene = ctx.root;
            const jobQueue = scene.getEcsComponent(JobQueueComponentId);
            if (!jobQueue) {
                return false;
            }

            const jobIndex = parseInt(claimedJobIndex);
            const job = jobQueue.jobs[jobIndex];
            if (!job || job.id !== BuildBuildingJobId) {
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
                buildBuildingExecutor,
            );
        },

        postActionDelay: () => 1000, // 1 second between build actions
    };

/**
 * Creates a function that returns the position of the job's target building entity.
 * This abstracts away the logic of finding the claimed job and getting its target position.
 * Returns null if the job or building is invalid/missing.
 */
function jobPosition(
    data: BuildBuildingActionData,
    ctx: GoapContext,
): () => Point | null {
    return () => {
        const jobQueue = ctx.root.requireEcsComponent(JobQueueComponentId);
        const job = jobQueue.jobs[data.jobIndex] as BuildBuildingJob;
        if (!job) {
            return null;
        }

        if (!job.entityId) {
            return null;
        }

        const buildingEntity = ctx.root.findEntity(job.entityId);
        if (!buildingEntity) {
            return null;
        }
        return buildingEntity.worldPosition;
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

function buildBuildingExecutor(
    data: BuildBuildingActionData,
    ctx: GoapContext,
): GoapActionExecutionResult {
    const agentComponent = ctx.agent.requireEcsComponent(GoapAgentComponentId);
    const jobQueue = ctx.root.requireEcsComponent(JobQueueComponentId);
    const jobIndex = data.jobIndex;
    const job = jobQueue.jobs[data.jobIndex];

    if (!job || job.id !== BuildBuildingJobId) {
        console.error(`Job ${job?.id} is not a BuildBuildingJob`);
        // Clear the claimed job since it's invalid
        agentComponent.claimedJob = undefined;
        ctx.agent.invalidateComponent(GoapAgentComponentId);
        return "complete";
    }

    const buildingEntity = ctx.root.findEntity(job.entityId);
    if (!buildingEntity) {
        console.error(`Building entity ${job.entityId} not found`);
        // Clear the job and complete
        unclaimJob(ctx.agent, jobIndex);
        return "complete";
    }

    const buildingComponent =
        buildingEntity.getEcsComponent(BuildingComponentId);
    if (!buildingComponent) {
        console.error(`No building component on entity ${job.entityId}`);
        unclaimJob(ctx.agent, jobIndex);
        return "complete";
    }

    // Verify adjacency - agent must be next to the building to build it
    const adjacentDirection = checkAdjacency(
        ctx.agent.worldPosition,
        buildingEntity.worldPosition,
    );
    if (adjacentDirection === null) {
        console.error(
            `Agent ${ctx.agent.id} attempted to build building ${job.entityId} but is not adjacent`,
        );
        // This should not happen if movement executor is working correctly
        // Clear the job and let the agent re-plan
        unclaimJob(ctx.agent, jobIndex);
        return "complete";
    }

    // Perform building action - heal the building by 10 HP
    const healthComponent =
        buildingEntity.requireEcsComponent(HealthComponentId);
    heal(healthComponent, 10);
    buildingEntity.invalidateComponent(HealthComponentId);

    // Check if building is complete
    if (healthComponent.currentHp >= healthComponent.maxHp) {
        const spriteComponent =
            buildingEntity.getEcsComponent(SpriteComponentId);
        buildingComponent.scaffolded = false;

        // Update the sprite of the building
        if (spriteComponent) {
            const adjacency = buildingAdjecency[buildingComponent.building.id];
            if (adjacency) {
                // Update this building and any adjacent ones with the same building type
                updateBuildingAdjacency(
                    ctx.root,
                    buildingEntity,
                    buildingComponent.building.id,
                );
            } else {
                spriteComponent.sprite = buildingComponent.building.icon;
            }
        }

        buildingEntity.invalidateComponent(BuildingComponentId);
        buildingEntity.invalidateComponent(SpriteComponentId);

        // Clear the claimed job and remove from queue
        unclaimJob(ctx.agent, jobIndex);

        console.log(`Agent ${ctx.agent.id} completed building construction`);
        return "complete";
    }

    // Still working on it
    ctx.root.invalidateComponent(JobQueueComponentId);
    return "in_progress";
}

/**
 * Calculate the adjacency mask for a building at a given position
 */
function calculateAdjacencyMask(
    root: Entity,
    position: Point,
    buildingId: string,
): AdjacencyMask {
    const adjacentEntities = queryAdjacentEntities(root, position);

    const hasMatchingBuilding = (entities: Entity[]): boolean => {
        return entities.some((entity) => {
            const bc = entity.getEcsComponent(BuildingComponentId);
            return bc && bc.building.id === buildingId && !bc.scaffolded;
        });
    };

    return createAdjacencyMask(
        hasMatchingBuilding(adjacentEntities.left),
        hasMatchingBuilding(adjacentEntities.right),
        hasMatchingBuilding(adjacentEntities.up),
        hasMatchingBuilding(adjacentEntities.down),
    );
}

/**
 * Update the adjacency and sprite for a single building entity
 */
function updateSingleBuildingAdjacency(
    entity: Entity,
    buildingId: string,
    root: Entity,
): void {
    const buildingComponent = entity.getEcsComponent(BuildingComponentId);
    const spriteComponent = entity.getEcsComponent(SpriteComponentId);
    const adjacencyFunction = buildingAdjecency[buildingId];

    if (!buildingComponent || !spriteComponent || !adjacencyFunction) {
        return;
    }

    // Calculate new adjacency
    const adjacencyMask = calculateAdjacencyMask(
        root,
        entity.worldPosition,
        buildingId,
    );
    const adjacencyEnum = adjacencyMaskToEnum(adjacencyMask);

    // Update the building component
    buildingComponent.adjacency = adjacencyEnum;

    // Update the sprite
    spriteComponent.sprite = adjacencyFunction(adjacencyEnum);

    // Invalidate components to trigger updates
    entity.invalidateComponent(BuildingComponentId);
    entity.invalidateComponent(SpriteComponentId);
}

/**
 * Update building adjacency for the target building and all adjacent buildings of the same type
 */
function updateBuildingAdjacency(
    root: Entity,
    targetEntity: Entity,
    buildingId: string,
): void {
    // Update the target building first
    updateSingleBuildingAdjacency(targetEntity, buildingId, root);

    // Find and update all adjacent buildings of the same type
    const adjacentEntities = queryAdjacentEntities(
        root,
        targetEntity.worldPosition,
    );
    const allAdjacent = [
        ...adjacentEntities.left,
        ...adjacentEntities.right,
        ...adjacentEntities.up,
        ...adjacentEntities.down,
    ];

    for (const entity of allAdjacent) {
        const bc = entity.getEcsComponent(BuildingComponentId);
        if (bc && bc.building.id === buildingId && !bc.scaffolded) {
            updateSingleBuildingAdjacency(entity, buildingId, root);
        }
    }
}
