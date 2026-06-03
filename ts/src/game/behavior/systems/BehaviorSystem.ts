import type { EcsSystem } from "../../../common/ecs/ecsSystem.ts";
import { Entity } from "../../entity/entity.ts";
import {
    type BehaviorAgentComponent,
    BehaviorAgentComponentId,
} from "../../component/BehaviorAgentComponent.ts";
import type { Behavior } from "../behaviors/Behavior.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import { executeAction } from "../actions/ActionExecutor.ts";
import { log } from "../../../common/logging/logger.ts";
import type { BehaviorActionData } from "../actions/ActionData.ts";

/**
 * Reconciles a freshly expanded action queue against the currently running
 * one. When the head action is shape-equal across both queues we keep the
 * running reference so any in-progress state on it (e.g. a moveTo's
 * cachedPath) survives the replan; only the tail is replaced. If the heads
 * differ — or either queue is empty — we adopt the new queue wholesale.
 *
 * The shape compare uses JSON.stringify rather than reference equality
 * because expand() builds fresh objects each call. A literal-shape compare
 * is enough for current ECS action data — none of the action types embed
 * circular references or non-serializable values.
 */
export function reconcileQueue(
    current: BehaviorActionData[],
    next: BehaviorActionData[],
): BehaviorActionData[] {
    if (current.length === 0 || next.length === 0) {
        return next;
    }
    if (JSON.stringify(current[0]) !== JSON.stringify(next[0])) {
        return next;
    }
    return [current[0], ...next.slice(1)];
}

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
        log.debug(`Entity ${entity.id} replanning`);
        replan(entity, agent, resolver);
    }

    // Execute the current action in the queue
    if (agent.actionQueue.length > 0) {
        const action = agent.actionQueue[0];

        let result: ReturnType<typeof executeAction>;
        try {
            result = executeAction(action, entity, tick);
        } catch (error) {
            log.error(`Action threw exception for entity ${entity.id}`, {
                error,
            });
            result = { kind: "failed", cause: { type: "unknown" } };
        }

        if (result.kind === "complete") {
            log.info(`Entity ${entity.id} completed action "${action.type}"`);
            agent.actionQueue.shift();
            if (agent.actionQueue.length === 0) {
                log.debug(`Entity ${entity.id} actionQueue empty`);
                // The plan finished normally. Clear the active/display state so the
                // selection UI doesn't show this just-finished behavior against an
                // empty queue until next tick's replan, but keep `hysteresis` so the
                // behavior is still favored when we re-select.
                concludeActivePlan(agent);
                agent.pendingReplan = { kind: "replan" };
            }
        } else if (result.kind === "failed") {
            log.warn(
                `Action failed for entity ${entity.id}, cleaning up and replanning`,
            );
            unclaimCurrentJob(entity);
            clearBehavior(agent);
            agent.pendingReplan = {
                kind: "replanAfterFailure",
                failure: { actionType: action.type, cause: result.cause },
                since: tick,
            };
        } else if (result.kind === "subaction") {
            log.info(
                `Entity ${entity.id} action "${action.type}" suspended, inserting ${result.actions.length} subactions`,
            );
            // Suspend the current action by inserting subactions before it.
            // When the subactions complete the suspended action will resume.
            agent.actionQueue.splice(0, 0, ...result.actions);
        }
        entity.invalidateComponent(BehaviorAgentComponentId);
        // result.kind === "running" — keep action in queue, it will run again next tick
    }
}

/**
 * Reset the active plan: the behavior that is currently executing and its queue.
 * Clears currentBehaviorName (so the selection UI stops showing a behavior the
 * instant its plan ends) and currentBehaviorUtility (so a newly-idle entity
 * doesn't retain stale displacement resistance), and empties the queue. Crucially
 * it leaves `hysteresis` intact, so a plan that ended normally is still favored on
 * the next replan. Use this when a plan finishes; use clearBehavior when it ends
 * abnormally.
 */
function concludeActivePlan(agent: BehaviorAgentComponent): void {
    agent.currentBehaviorName = null;
    agent.currentBehaviorUtility = 0;
    agent.actionQueue = [];
}

/**
 * Reset all behavior state on an agent, including the hysteresis memory. This is
 * concludeActivePlan plus forgetting which behavior to favor — so the next replan
 * starts from a clean slate with no anti-thrashing bonus. Used on the abnormal
 * termination paths (action failure, no valid behavior, behavior expanded to
 * nothing), matching the pre-split behavior where clearing currentBehaviorName
 * dropped the bonus on exactly those paths.
 */
function clearBehavior(agent: BehaviorAgentComponent): void {
    concludeActivePlan(agent);
    agent.hysteresis = null;
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
            log.info(`Unclaimed job ${job.id} for entity ${entity.id}`);
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
    // Guard: if a craftItem action with inputs already consumed is in the queue,
    // don't discard it. Inputs are no longer in the building or worker inventory,
    // so a normal replan would cause planCrafting to permanently fail the job.
    // Instead, rebuild the queue as [moveTo(building), craftItem] so the worker
    // returns to the building and finishes the craft with progress preserved.
    const inProgressCraftItem = agent.actionQueue.find(
        (a): a is Extract<BehaviorActionData, { type: "craftItem" }> =>
            a.type === "craftItem" &&
            (a as Extract<BehaviorActionData, { type: "craftItem" }>)
                .inputsConsumed === true,
    );
    if (inProgressCraftItem) {
        const root = entity.getRootEntity();
        const buildingEntity = root.findEntity(inProgressCraftItem.buildingId);
        if (buildingEntity) {
            log.info(
                `Entity ${entity.id} displaced mid-craft — returning to building ${inProgressCraftItem.buildingId}`,
            );
            agent.actionQueue = [
                {
                    type: "moveTo",
                    target: buildingEntity.worldPosition,
                    stopAdjacent: "cardinal",
                },
                inProgressCraftItem,
            ];
            agent.pendingReplan = undefined;
            return;
        }
    }

    // Resolve applicable behaviors for this entity type
    const behaviors = resolver(entity);

    // Find all valid behaviors
    const validBehaviors = behaviors.filter((behavior) =>
        behavior.isValid(entity),
    );

    if (validBehaviors.length === 0) {
        clearBehavior(agent);
        agent.pendingReplan = undefined;
        return;
    }

    // The behavior to favor for hysteresis — the planner's last pick, which
    // survives a plan completing (see concludeActivePlan), unlike currentBehaviorName.
    const hysteresisName = agent.hysteresis?.behaviorName ?? null;
    const hysteresisBehavior = hysteresisName
        ? behaviors.find((b) => b.name === hysteresisName)
        : null;

    // Hysteresis: give the previously-selected behavior a bonus to prevent
    // "thrashing" — rapidly switching back and forth between two behaviors with
    // similar utilities. For example, a goblin at warmth=51 (just above threshold)
    // after warming up shouldn't oscillate between keepWarm and performJob every replan.
    const REPLAN_THRESHOLD = 5; // Only switch if a new behavior is 5+ utility higher
    // Calculate utilities for all valid behaviors
    const behaviorUtilities = validBehaviors.map((behavior) => {
        let utility = behavior.utility(entity);
        if (behavior.name == hysteresisBehavior?.name) {
            utility = utility + REPLAN_THRESHOLD;
        }
        return {
            behavior,
            utility,
        };
    });

    // Sort by utility (highest first)
    behaviorUtilities.sort((a, b) => b.utility - a.utility);

    log.debug(`Entity ${entity.id} sorted behaviors`, {
        behaviors: JSON.stringify(behaviorUtilities),
    });
    const bestBehavior = behaviorUtilities[0];

    const sameBehavior =
        hysteresisBehavior?.name === bestBehavior.behavior.name;
    // pendingReplan is still set here so behaviors can read failure context
    // from the component inside expand()
    const newActions = bestBehavior.behavior.expand(entity);

    // Behavior produced no actions — nothing to run this round. Treat the worker as
    // idle: clear all behavior/display state so it never shows a behavior name (e.g.
    // "performJob") with no job or action context. This also empties the action queue
    // (a stale queue would otherwise execute next tick against work that is gone).
    if (newActions.length === 0) {
        clearBehavior(agent);
        agent.pendingReplan = undefined;
        log.info(
            `Entity ${entity.id} behavior ${bestBehavior.behavior.name} expanded to empty — idle`,
        );
        return;
    }

    agent.currentBehaviorName = bestBehavior.behavior.name;
    agent.currentBehaviorUtility = bestBehavior.utility;
    // Remember this pick so the next replan can apply the hysteresis bonus, even
    // if this plan completes and clears currentBehaviorName before then.
    agent.hysteresis = { behaviorName: bestBehavior.behavior.name };
    if (sameBehavior) {
        agent.actionQueue = reconcileQueue(agent.actionQueue, newActions);
        log.debug(
            `Entity ${entity.id} reconciled queue for behavior ${bestBehavior.behavior.name}`,
        );
    } else {
        agent.actionQueue = newActions;
        log.info(
            `Entity ${entity.id} replaced queue (behavior ${hysteresisBehavior?.name ?? "none"} → ${bestBehavior.behavior.name})`,
        );
    }
    // Clear after expand so the failure context is consumed
    agent.pendingReplan = undefined;
    log.info(
        `Entity ${entity.id} selected behavior ${bestBehavior.behavior.name} with utility ${bestBehavior.utility}`,
        { actions: JSON.stringify(newActions) },
    );
}
