import type { EcsSystem } from "../../../ecs/ecsSystem.ts";
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
 * ever needs profiling. Every (re-)selection routes through one call tree
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
 *   1. (Re-)select a behavior when forced (pendingReplan set by the first tick,
 *      an action failure, or an imperative interrupt such as taking damage) OR
 *      whenever the action queue is empty.
 *   2. Execute the first action in the queue.
 *
 * A worker that just finished its plan, or that found nothing valid to do,
 * re-selects on the next tick instead of freezing. That is gated on the queue
 * being empty, not on pendingReplan, so an idle worker keeps pendingReplan
 * undefined and the displacement system still counts it as displaceable rather
 * than transient.
 *
 * A busy worker (non-empty queue, no pending replan) is never re-selected
 * mid-plan. Needs like hunger and energy only influence the next selection at a
 * plan boundary; interrupting a running plan takes an explicit requestReplan.
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
    // empty-queue branch un-sticks idle workers without setting pendingReplan,
    // which would reclassify them as transient for displacement.
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
                // The plan finished normally. Clear the display state so the
                // selection UI doesn't show this behavior against an empty
                // queue, but keep `hysteresis` so it is still favored on the
                // next selection. pendingReplan stays unset: the empty queue
                // triggers re-selection, and setting it would reclassify this
                // settled worker as transient for displacement.
                concludeActivePlan(agent);
            }
        } else if (result.kind === "failed") {
            log.warn(
                `Action ${action.type} failed for entity ${entity.id} (${result.cause.type}), cleaning up and replanning`,
            );
            unclaimCurrentJob(entity);
            clearBehavior(agent);
            agent.pendingReplan = { kind: "replan" };
        } else if (result.kind === "subaction") {
            log.info(
                `Entity ${entity.id} action "${action.type}" suspended, inserting ${result.actions.length} subactions`,
            );
            // Suspend the current action by inserting subactions before it.
            // When the subactions complete the suspended action will resume.
            agent.actionQueue.splice(0, 0, ...result.actions);
        }
        entity.invalidateComponent(BehaviorAgentComponentId);
        // result.kind === "running". Keep the action in the queue; it runs again next tick.
    }
}

/**
 * Reset the plan that just finished: the behavior name (so the selection UI
 * stops showing it), its utility (so a newly-idle entity keeps no stale
 * displacement resistance), and the queue. `hysteresis` survives, so a plan
 * that ended normally is still favored on the next replan. Use clearBehavior
 * instead when a plan ends abnormally.
 */
function concludeActivePlan(agent: BehaviorAgentComponent): void {
    agent.currentBehaviorName = null;
    agent.currentBehaviorUtility = 0;
    agent.actionQueue = [];
}

/**
 * Reset all behavior state on an agent, including the hysteresis memory, so the
 * next replan starts with no anti-thrashing bonus. Used on the abnormal
 * termination paths: action failure, no valid behavior, or a behavior that
 * expanded to nothing.
 */
function clearBehavior(agent: BehaviorAgentComponent): void {
    concludeActivePlan(agent);
    agent.hysteresis = null;
}

/**
 * Unclaim the current job if the entity has one, so a failed action does not
 * leave the job claimed by a worker that is no longer doing it.
 *
 * The queue lives on an ancestor, not on the entity: a worker's is on the root,
 * a goblin's on its camp. An entity can only claim one job, so the search stops
 * at the first match.
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
 * action queue is empty) or on a forced replan (pendingReplan set).
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
                `Entity ${entity.id} displaced mid-craft, returning to building ${inProgressCraftItem.buildingId}`,
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

    const behaviors = resolver(entity);
    const validBehaviors = behaviors.filter((behavior) =>
        behavior.isValid(entity),
    );

    if (validBehaviors.length === 0) {
        clearBehavior(agent);
        agent.pendingReplan = undefined;
        return;
    }

    // The behavior to favor for hysteresis. This is the planner's last pick, which
    // survives a plan completing (see concludeActivePlan), unlike currentBehaviorName.
    const hysteresisName = agent.hysteresis?.behaviorName ?? null;
    const hysteresisBehavior = hysteresisName
        ? behaviors.find((b) => b.name === hysteresisName)
        : null;

    // Hysteresis: give the previously-selected behavior a bonus to prevent
    // "thrashing", where it rapidly switches back and forth between two behaviors with
    // similar utilities. For example, a goblin at warmth=51 (just above threshold)
    // after warming up shouldn't oscillate between keepWarm and performJob every replan.
    const REPLAN_THRESHOLD = 5;
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

    behaviorUtilities.sort((a, b) => b.utility - a.utility);

    log.debug(`Entity ${entity.id} sorted behaviors`, {
        behaviors: JSON.stringify(behaviorUtilities),
    });

    // Walk behaviors from highest utility down and adopt the first one that
    // expands to a non-empty plan. A behavior can be valid yet produce nothing
    // (its target vanished between isValid and expand, or every job it could
    // take turned out unplannable); going idle in that case would starve
    //
    // Each expand is guarded because selection runs outside the per-action
    // try/catch in updateBehaviorAgent: an uncaught throw here would escape
    // onUpdate and abort the tick for every agent in the world. A throwing
    // behavior is treated like an empty expansion and the next one is tried.
    for (const candidate of behaviorUtilities) {
        stats.expandsRun++;
        let newActions: BehaviorActionData[];
        try {
            newActions = candidate.behavior.expand(entity);
        } catch (error) {
            log.error(
                `Behavior ${candidate.behavior.name} expand threw for entity ${entity.id}`,
                { error },
            );
            continue;
        }

        if (newActions.length === 0) {
            log.debug(
                `Entity ${entity.id} behavior ${candidate.behavior.name} expanded to empty, trying next`,
            );
            continue;
        }

        agent.currentBehaviorName = candidate.behavior.name;
        agent.currentBehaviorUtility = candidate.utility;
        // Remember this pick so the next selection can apply the hysteresis bonus,
        // even if this plan completes and clears currentBehaviorName before then.
        agent.hysteresis = { behaviorName: candidate.behavior.name };
        // Always adopt the freshly expanded plan. Selection only runs at a plan
        // boundary (empty queue) or on a forced replan; in both cases a fresh plan
        // is what we want. A displaced worker needs a new path rather than the stale
        // cachedPath from its previous moveTo. There is no running head to preserve.
        agent.actionQueue = newActions;
        agent.pendingReplan = undefined;
        log.info(
            `Entity ${entity.id} selected behavior ${candidate.behavior.name} with utility ${candidate.utility}`,
            { actions: JSON.stringify(newActions) },
        );
        return;
    }

    // Nothing produced actions this round. Treat the worker as idle: clear all
    // behavior/display state so it never shows a behavior name (e.g.
    // "performJob") with no job or action context. This also empties the action
    // queue (a stale queue would otherwise execute next tick against work that
    // is gone).
    clearBehavior(agent);
    agent.pendingReplan = undefined;
    log.info(
        `Entity ${entity.id} all valid behaviors expanded to empty, going idle`,
    );
}
