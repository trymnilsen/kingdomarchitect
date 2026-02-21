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
 * Resolves which behaviors are applicable for a given entity.
 * This determines what behaviors an entity *could ever* run,
 * distinct from isValid which checks if they're appropriate right now.
 */
export type BehaviorResolver = (entity: Entity) => Behavior[];

/**
 * BehaviorSystem manages behavior selection and execution for entities with BehaviorAgent components.
 * It evaluates behaviors, selects the highest utility behavior, and executes actions from the queue.
 *
 * Per-tick order for each agent:
 *   1. Replan if pendingReplan is set (includes first-tick initialization)
 *   2. Execute the first action in the queue
 *
 * Replanning happens before action execution so that a freshly spawned entity
 * picks its first behavior and begins executing it in the same tick it was created,
 * rather than sitting idle for one tick.
 */
export function createBehaviorSystem(resolver: BehaviorResolver): EcsSystem {
    return {
        onUpdate: (root, tick) => {
            const agents = root.queryComponents(BehaviorAgentComponentId);

            for (const [entity, agent] of agents) {
                updateBehaviorAgent(entity, agent, resolver, tick);
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
    resolver: BehaviorResolver,
    tick: number,
): void {
    if (agent.pendingReplan !== undefined) {
        console.log(`[BehaviorSystem] Entity ${entity.id} replanning`);
        replan(entity, agent, resolver);
    }

    // Execute the current action in the queue
    if (agent.actionQueue.length > 0) {
        const action = agent.actionQueue[0];

        let result: ReturnType<typeof executeAction>;
        try {
            result = executeAction(action, entity, tick);
        } catch (error) {
            console.error(
                `[BehaviorSystem] Action threw exception for entity ${entity.id}:`,
                error,
            );
            result = { kind: "failed", cause: { type: "unknown" } };
        }

        if (result.kind === "complete") {
            console.log(
                `[BehaviorSystem] Entity ${entity.id} completed action "${action.type}"`,
            );
            agent.actionQueue.shift();
            if (agent.actionQueue.length === 0) {
                console.log(
                    `[BehaviorSystem] Entity ${entity.id} actionQueue empty"`,
                );
                agent.pendingReplan = { kind: "replan" };
            }
        } else if (result.kind === "failed") {
            console.warn(
                `[BehaviorSystem] Action failed for entity ${entity.id}, cleaning up and replanning`,
            );
            unclaimCurrentJob(entity);
            agent.currentBehaviorName = null;
            agent.actionQueue = [];
            agent.pendingReplan = {
                kind: "replanAfterFailure",
                failure: { actionType: action.type, cause: result.cause },
                since: tick,
            };
        }
        entity.invalidateComponent(BehaviorAgentComponentId);
        // result.kind === "running" — keep action in queue, it will run again next tick
    }
}

/**
 * Unclaim the current job if the entity has one.
 * This is called when an action fails to ensure jobs aren't left in a claimed state.
 *
 * Uses ancestor traversal rather than a direct component lookup because entities
 * don't own their job queue — it lives on their parent (worker → root, goblin → camp).
 * The loop breaks after the first match because an entity can only claim one job at a time.
 */
function unclaimCurrentJob(entity: Entity): void {
    const queueEntity = entity.getAncestorEntity(JobQueueComponentId);
    if (!queueEntity) {
        return;
    }

    const jobQueue = queueEntity.getEcsComponent(JobQueueComponentId);
    if (!jobQueue) {
        return;
    }

    // Find any job claimed by this entity and unclaim it
    for (const job of jobQueue.jobs) {
        if (job.claimedBy === entity.id) {
            job.claimedBy = undefined;
            queueEntity.invalidateComponent(JobQueueComponentId);
            console.log(
                `[BehaviorSystem] Unclaimed job ${job.id} for entity ${entity.id}`,
            );
            break;
        }
    }
}

/**
 * Select and activate a new behavior for the agent.
 * pendingReplan is cleared after expand() so behaviors can read failure context
 * from the component inside their expand() implementation.
 */
function replan(
    entity: Entity,
    agent: BehaviorAgentComponent,
    resolver: BehaviorResolver,
): void {
    // Resolve applicable behaviors for this entity type
    const behaviors = resolver(entity);

    // Find all valid behaviors
    const validBehaviors = behaviors.filter((behavior) =>
        behavior.isValid(entity),
    );

    if (validBehaviors.length === 0) {
        agent.currentBehaviorName = null;
        agent.actionQueue = [];
        agent.pendingReplan = undefined;
        return;
    }

    const currentBehavior = agent.currentBehaviorName
        ? behaviors.find((b) => b.name === agent.currentBehaviorName)
        : null;

    // Hysteresis: give the current behavior a bonus to prevent "thrashing" —
    // rapidly switching back and forth between two behaviors with similar utilities.
    // For example, a goblin at warmth=51 (just above threshold) after warming up
    // shouldn't oscillate between keepWarm and performJob every replan.
    const REPLAN_THRESHOLD = 5; // Only switch if a new behavior is 5+ utility higher
    // Calculate utilities for all valid behaviors
    const behaviorUtilities = validBehaviors.map((behavior) => {
        let utility = behavior.utility(entity);
        if (behavior.name == currentBehavior?.name) {
            utility = utility + REPLAN_THRESHOLD;
        }
        return {
            behavior,
            utility,
        };
    });

    // Sort by utility (highest first)
    behaviorUtilities.sort((a, b) => b.utility - a.utility);

    console.log(
        `[BehaviorSystem] Entity ${entity.id} sorted behaviors:`,
        JSON.stringify(behaviorUtilities),
    );
    const bestBehavior = behaviorUtilities[0];

    agent.currentBehaviorName = bestBehavior.behavior.name;
    agent.currentBehaviorUtility = bestBehavior.utility;
    // pendingReplan is still set here so behaviors can read failure context
    // from the component inside expand()
    const newActions = bestBehavior.behavior.expand(entity);
    agent.actionQueue = newActions;
    // Clear after expand so the failure context is consumed
    agent.pendingReplan = undefined;
    console.log(
        `[BehaviorSystem] Entity ${entity.id} selected behavior ${bestBehavior.behavior.name} with utility ${bestBehavior.utility}`,
        JSON.stringify(newActions),
    );
}
