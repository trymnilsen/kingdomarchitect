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
 * Resolves which behaviors are applicable for a given entity.
 * This determines what behaviors an entity *could ever* run,
 * distinct from isValid which checks if they're appropriate right now.
 */
export type BehaviorResolver = (entity: Entity) => Behavior[];

/**
 * Per-tick re-selection counters, logged periodically so the cost of behavior
 * selection stays observable. Idle workers re-select every tick (that is what
 * lets them recover from idle), so these are the numbers to watch if the system
 * ever needs profiling — every (re-)selection routes through one call tree
 * (selectBehavior), so timing onUpdate captures the full cost.
 */
interface BehaviorTickStats {
    agentsProcessed: number;
    selectionsRun: number;
    expandsRun: number;
}

const BEHAVIOR_STATS_LOG_INTERVAL = 100;

/**
 * BehaviorSystem manages behavior selection and execution for entities with
 * BehaviorAgent components. It selects the highest-utility valid behavior and
 * executes actions from the queue.
 *
 * Per-tick order for each agent:
 *   1. (Re-)select a behavior when forced (pendingReplan set — first tick,
 *      action failure, or an imperative interrupt such as taking damage) OR
 *      whenever the action queue is empty.
 *   2. Execute the first action in the queue.
 *
 * The empty-queue trigger is the heart of the design: a worker that just
 * finished its plan, or that found nothing valid to do, re-selects on the next
 * tick instead of freezing. Crucially this is gated on the queue being empty,
 * NOT on pendingReplan — so an idle worker keeps pendingReplan === undefined and
 * the displacement system still classifies it as displaceable, not transient.
 *
 * A busy worker (non-empty queue, no pending replan) is never re-selected
 * mid-plan: it runs its current plan to completion. Needs (hunger, energy) only
 * influence the next selection at a plan boundary; interrupting a running plan
 * is reserved for explicit, imperative requestReplan calls.
 */
export function createBehaviorSystem(resolver: BehaviorResolver): EcsSystem {
    return {
        onUpdate: (root, tick) => {
            const agents = root.queryComponents(BehaviorAgentComponentId);

            const stats: BehaviorTickStats = {
                agentsProcessed: 0,
                selectionsRun: 0,
                expandsRun: 0,
            };
            for (const [entity, agent] of agents) {
                updateBehaviorAgent(entity, agent, resolver, tick, stats);
            }
            if (tick % BEHAVIOR_STATS_LOG_INTERVAL === 0) {
                log.debug(`BehaviorSystem tick ${tick}`, { ...stats });
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
    stats: BehaviorTickStats,
): void {
    stats.agentsProcessed++;

    // Re-select when forced (pendingReplan) or whenever idle (empty queue). The
    // empty-queue branch is what un-sticks idle workers; it deliberately does
    // NOT set pendingReplan, so an idle worker stays classified as displaceable.
    if (agent.pendingReplan !== undefined || agent.actionQueue.length === 0) {
        log.debug(`Entity ${entity.id} selecting behavior`);
        stats.selectionsRun++;
        selectBehavior(entity, agent, resolver, stats);
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
                // The plan finished normally. Clear the active/display state so
                // the selection UI doesn't show this just-finished behavior
                // against an empty queue, but keep `hysteresis` so the behavior
                // is still favored when we re-select. We deliberately do NOT set
                // pendingReplan: the empty queue itself triggers re-selection on
                // the next tick, and leaving pendingReplan undefined keeps this
                // just-settled worker classified as displaceable (not transient).
                concludeActivePlan(agent);
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
 * Select and activate a behavior for the agent. Runs at a plan boundary (the
 * action queue is empty) or on a forced replan (pendingReplan set). pendingReplan
 * is cleared after expand() so behaviors can read failure context from the
 * component inside their expand() implementation.
 */
function selectBehavior(
    entity: Entity,
    agent: BehaviorAgentComponent,
    resolver: BehaviorResolver,
    stats: BehaviorTickStats,
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

    // pendingReplan is still set here so behaviors can read failure context
    // from the component inside expand()
    stats.expandsRun++;
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
    // Remember this pick so the next selection can apply the hysteresis bonus,
    // even if this plan completes and clears currentBehaviorName before then.
    agent.hysteresis = { behaviorName: bestBehavior.behavior.name };
    // Always adopt the freshly expanded plan. Selection only runs at a plan
    // boundary (empty queue) or on a forced replan; in both cases a fresh plan
    // is what we want — e.g. a displaced worker needs a new path, not the stale
    // cachedPath from its previous moveTo. There is no running head to preserve.
    agent.actionQueue = newActions;
    // Clear after expand so the failure context is consumed
    agent.pendingReplan = undefined;
    log.info(
        `Entity ${entity.id} selected behavior ${bestBehavior.behavior.name} with utility ${bestBehavior.utility}`,
        { actions: JSON.stringify(newActions) },
    );
}
