import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import { isPointAdjacentTo, type Point } from "../../common/point.ts";
import {
    GoapAgentComponentId,
    type GoapAgentComponent,
} from "../component/goapAgentComponent.ts";
import type { Entity } from "../entity/entity.ts";
import type { GoapActionDefinition } from "../goap/goapAction.ts";
import { type GoapContext, createGoapContext } from "../goap/goapContext.ts";
import type { GoapPlanner } from "../goap/goapPlanner.ts";

/**
 * Creates a GOAP system that manages planning and execution for GOAP agents.
 * Uses a factory pattern to inject the planner dependency.
 */
export function createGoapSystem(planner: GoapPlanner): EcsSystem {
    return {
        onUpdate: (root: Entity, tick: number) => {
            updateGoapAgents(root, planner, tick);
        },
    };
}

/**
 * Update all GOAP agents: handle planning, execution, and state management.
 */
function updateGoapAgents(root: Entity, planner: GoapPlanner, tick: number) {
    const agents = root.queryComponents(GoapAgentComponentId);

    for (const [entity, agent] of agents) {
        // Check if we need to replan
        if (shouldReplan(agent, tick, planner, root, entity)) {
            replan(entity, agent, planner, root, tick);
        }

        // Execute current action if we have a plan
        if (agent.currentPlan) {
            executeCurrentAction(entity, agent, planner, root, tick);
        }
    }
}

/**
 * Determine if the agent should replan.
 */
function shouldReplan(
    agent: GoapAgentComponent,
    tick: number,
    planner: GoapPlanner,
    root: Entity,
    entity: Entity,
): boolean {
    // Check cooldown
    const timeSinceLastPlan = tick - agent.lastPlanTime;
    if (timeSinceLastPlan < agent.planningCooldown) {
        return false;
    }

    // Replan if we have no plan
    if (!agent.currentPlan) {
        return true;
    }

    // Replan if we've completed all steps
    if (agent.currentStepIndex >= agent.currentPlan.steps.length) {
        return true;
    }

    // Replan if last action failed
    if (agent.lastActionFailed) {
        return true;
    }

    // Replan if current goal is no longer valid or is now satisfied
    const currentGoal = planner.getGoal(agent.currentPlan.goalId);
    if (currentGoal) {
        const ctx = createGoapContext(entity, root, tick);
        if (!currentGoal.isValid(ctx) || currentGoal.isSatisfied(ctx)) {
            return true;
        }
    }

    return false;
}

/**
 * Generate a new plan for the agent.
 */
function replan(
    entity: Entity,
    agent: GoapAgentComponent,
    planner: GoapPlanner,
    root: Entity,
    tick: number,
) {
    const ctx = createGoapContext(entity, root, tick);

    const plan = planner.plan(ctx);

    if (plan) {
        agent.currentPlan = plan;
        agent.currentStepIndex = 0;
        agent.lastActionFailed = false;
        agent.failureReason = undefined;
        console.log(
            `Agent ${entity.id} planned for goal "${plan.goalId}" with ${plan.steps.length} steps`,
        );
    } else {
        agent.currentPlan = null;
        agent.currentStepIndex = 0;
        console.warn(`Agent ${entity.id} could not find a valid plan`);
    }

    agent.lastPlanTime = tick;
    entity.invalidateComponent(GoapAgentComponentId);
}

/**
 * Execute the next action in the current plan.
 */
function executeCurrentAction(
    entity: Entity,
    agent: GoapAgentComponent,
    planner: GoapPlanner,
    root: Entity,
    tick: number,
) {
    if (!agent.currentPlan) {
        return;
    }

    // Check if we're still in post-action delay
    if (agent.postActionDelay > 0) {
        const timeSinceCompletion = tick - agent.lastActionCompletedAt;
        if (timeSinceCompletion < agent.postActionDelay) {
            return; // Still waiting
        }
        // Delay expired, move to next action
        agent.postActionDelay = 0;
        agent.currentStepIndex++;
        entity.invalidateComponent(GoapAgentComponentId);
    }

    // Check if we've completed all steps
    if (agent.currentStepIndex >= agent.currentPlan.steps.length) {
        return; // Plan complete, will replan next update
    }

    const step = agent.currentPlan.steps[agent.currentStepIndex];
    const actionDef = planner.getAction(step.actionId);

    if (!actionDef) {
        console.error(`Action ${step.actionId} not found in planner`);
        agent.lastActionFailed = true;
        agent.failureReason = `Action ${step.actionId} not found`;
        entity.invalidateComponent(GoapAgentComponentId);
        return;
    }

    const ctx = createGoapContext(entity, root, tick);

    // Set action start time if this is the first update for this action
    if (agent.currentActionStartTick === 0) {
        agent.currentActionStartTick = tick;
    }

    // Execute the action synchronously
    try {
        const result = actionDef.execute(step.executionData, ctx);

        if (result === "complete") {
            // Action completed successfully
            agent.lastActionFailed = false;
            agent.lastActionCompletedAt = tick;
            agent.currentActionStartTick = 0; // Reset for next action

            // Calculate post-action delay
            if (actionDef.postActionDelay) {
                agent.postActionDelay = actionDef.postActionDelay(
                    step.executionData,
                    ctx,
                );
            }

            console.log(
                `Agent ${entity.id} completed action "${actionDef.name}"`,
            );
        }
        // If result is "in_progress", action continues next update
    } catch (error: any) {
        // Action failed
        agent.lastActionFailed = true;
        agent.failureReason = error.message || "Unknown error";
        agent.currentActionStartTick = 0; // Reset on failure
        console.error(
            `Agent ${entity.id} failed action "${actionDef.name}":`,
            error,
        );
    }

    entity.invalidateComponent(GoapAgentComponentId);
}
