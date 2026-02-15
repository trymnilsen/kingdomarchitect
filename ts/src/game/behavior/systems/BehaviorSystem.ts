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
            console.log(
                `[BehaviorSystem] Entity ${entity.id} completed action "${action.type}"`,
            );
            agent.actionQueue.shift();
            // When the last action finishes, replan to find next work
            if (agent.actionQueue.length === 0) {
                agent.shouldReplan = true;
            }
        } else if (status === "failed") {
            console.warn(
                `[BehaviorSystem] Action failed for entity ${entity.id}, cleaning up and replanning`,
            );
            unclaimCurrentJob(entity);
            agent.actionQueue = [];
            agent.shouldReplan = true;
        }
        // status === "running" - keep action in queue, it will run again next tick
    }

    // Replan after action execution so same-tick completion triggers same-tick replan
    if (agent.shouldReplan) {
        console.log(`[BehaviorSystem] Entity ${entity.id} replanning`);
        replan(entity, agent, behaviors);
        agent.shouldReplan = false;
    }

    entity.invalidateComponent(BehaviorAgentComponentId);
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
        const newActions = bestBehavior.behavior.expand(entity);
        agent.actionQueue = newActions;
        console.log(
            `[BehaviorSystem] Entity ${entity.id} selected behavior ${bestBehavior.behavior.name} with utility ${bestBehavior.utility}`,
            newActions,
        );
    } else if (agent.actionQueue.length === 0 && currentBehavior) {
        // Current behavior is still best, but queue is empty - re-expand
        const newActions = currentBehavior.expand(entity);
        agent.actionQueue = newActions;
        console.log(
            `[BehaviorSystem] Entity ${entity.id} re-expanding behavior "${currentBehavior.name}"`,
            newActions,
        );
    }
}
