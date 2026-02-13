import type { EcsSystem } from "../../../common/ecs/ecsSystem.ts";
import { Entity } from "../../entity/entity.ts";
import {
    type BehaviorAgentComponent,
    BehaviorAgentComponentId,
} from "../../component/BehaviorAgentComponent.ts";
import type { Behavior } from "../behaviors/Behavior.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import { executeAction } from "../actions/ActionExecutor.ts";

/**
 * BehaviorSystem manages behavior selection and execution for entities with BehaviorAgent components.
 * It evaluates behaviors, selects the highest utility behavior, and executes actions from the queue.
 */
export function createBehaviorSystem(behaviors: Behavior[]): EcsSystem {
    return {
        onUpdate: (root, tick) => {
            const agents = root.queryComponents(BehaviorAgentComponentId);

            for (const [entity, agent] of agents) {
                updateBehaviorAgent(entity, agent, behaviors, tick);
            }
        },
    };
}

/**
 * Update a single behavior agent.
 */
function updateBehaviorAgent(
    entity: Entity,
    agent: BehaviorAgentComponent,
    behaviors: Behavior[],
    tick: number,
): void {
    // Check if we need to replan
    if (shouldReplan(agent)) {
        replan(entity, agent, behaviors);
        agent.shouldReplan = false;
    }

    // Execute the current action in the queue
    if (agent.actionQueue.length > 0) {
        const action = agent.actionQueue[0];
        let status: "complete" | "running" | "failed";

        try {
            status = executeAction(action, entity, tick);
        } catch (error) {
            console.error(
                `[BehaviorSystem] Action threw exception for entity ${entity.id}:`,
                error,
            );
            status = "failed";
        }

        if (status === "complete") {
            // Remove completed action and continue
            agent.actionQueue.shift();
        } else if (status === "failed") {
            // Action failed, clean up any claimed jobs and replan
            console.warn(
                `[BehaviorSystem] Action failed for entity ${entity.id}, cleaning up and replanning`,
            );
            unclaimCurrentJob(entity);
            agent.actionQueue = [];
            agent.currentBehaviorName = null;
            agent.shouldReplan = true;
        }
        // status === "running" - keep action in queue, it will run again next tick
    }

    // If action queue is empty, select a new behavior
    if (agent.actionQueue.length === 0) {
        replan(entity, agent, behaviors);
    }
}

/**
 * Unclaim the current job if the entity has one.
 * This is called when an action fails to ensure jobs aren't left in a claimed state.
 */
function unclaimCurrentJob(entity: Entity): void {
    const root = entity.getRootEntity();
    const jobQueue = root.getEcsComponent(JobQueueComponentId);
    if (!jobQueue) {
        return;
    }

    // Find any job claimed by this entity and unclaim it
    for (const job of jobQueue.jobs) {
        if (job.claimedBy === entity.id) {
            job.claimedBy = undefined;
            root.invalidateComponent(JobQueueComponentId);
            console.log(
                `[BehaviorSystem] Unclaimed job ${job.id} for entity ${entity.id}`,
            );
            break;
        }
    }
}

/**
 * Determine if the agent should replan.
 */
function shouldReplan(agent: BehaviorAgentComponent): boolean {
    // Replan if explicitly requested
    if (agent.shouldReplan) {
        return true;
    }

    // Replan if no current behavior
    if (!agent.currentBehaviorName) {
        return true;
    }

    // Replan if action queue is empty
    if (agent.actionQueue.length === 0) {
        return true;
    }

    return false;
}

/**
 * Select and activate a new behavior for the agent.
 */
function replan(
    entity: Entity,
    agent: BehaviorAgentComponent,
    behaviors: Behavior[],
): void {
    // Find all valid behaviors
    const validBehaviors = behaviors.filter((behavior) =>
        behavior.isValid(entity),
    );

    if (validBehaviors.length === 0) {
        // No valid behaviors - enter idle state
        agent.currentBehaviorName = null;
        agent.actionQueue = [];
        return;
    }

    // Calculate utilities for all valid behaviors
    const behaviorUtilities = validBehaviors.map((behavior) => ({
        behavior,
        utility: behavior.utility(entity),
    }));

    // Sort by utility (highest first)
    behaviorUtilities.sort((a, b) => b.utility - a.utility);

    const bestBehavior = behaviorUtilities[0];

    // Check if we should switch behaviors
    // Add a small threshold to prevent thrashing
    const currentBehavior = agent.currentBehaviorName
        ? behaviors.find((b) => b.name === agent.currentBehaviorName)
        : null;
    const currentUtility = currentBehavior
        ? currentBehavior.utility(entity)
        : 0;

    const REPLAN_THRESHOLD = 5; // Only switch if new behavior is 5+ utility higher

    if (
        !agent.currentBehaviorName ||
        bestBehavior.utility > currentUtility + REPLAN_THRESHOLD
    ) {
        // Switch to the new behavior
        agent.currentBehaviorName = bestBehavior.behavior.name;
        agent.actionQueue = bestBehavior.behavior.expand(entity);

        console.log(
            `[BehaviorSystem] Entity ${entity.id} selected behavior ${bestBehavior.behavior.name} with utility ${bestBehavior.utility}`,
        );
    } else if (agent.actionQueue.length === 0 && currentBehavior) {
        // Current behavior is still best, but queue is empty - re-expand
        agent.actionQueue = currentBehavior.expand(entity);
    }
}
