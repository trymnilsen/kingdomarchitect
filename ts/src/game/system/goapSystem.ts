import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import { isPointAdjacentTo, type Point } from "../../common/point.ts";
import {
    GoapAgentComponentId,
    type GoapAgentComponent,
} from "../component/goapAgentComponent.ts";
import { HungerComponentId } from "../component/hungerComponent.ts";
import { EnergyComponentId } from "../component/energyComponent.ts";
import type { Entity } from "../entity/entity.ts";
import type { GoapActionDefinition } from "../goap/goapAction.ts";
import { type GoapContext, createGoapContext } from "../goap/goapContext.ts";
import type { GoapPlanner } from "../goap/goapPlanner.ts";
import { calculateDynamicCooldown } from "./goapReplanTrigger.ts";

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
        } else {
            // Agent has no plan - check if in cooldown
            const timeSinceLastPlan = tick - agent.lastPlanTime;
            if (timeSinceLastPlan < agent.planningCooldown && tick % 10 === 0) {
                // Log every 10 ticks to avoid spam
                console.log(
                    `[GOAP] Agent ${entity.id} idle (planning cooldown: ${agent.planningCooldown - timeSinceLastPlan} ticks remaining)`,
                );
            }
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
    // Check for urgent replan request (bypasses cooldown)
    if (agent.urgentReplanRequested) {
        // Get current action name for better logging
        const currentAction =
            agent.currentPlan &&
            agent.currentStepIndex < agent.currentPlan.steps.length
                ? planner.getAction(
                      agent.currentPlan.steps[agent.currentStepIndex].actionId,
                  )
                : null;

        if (currentAction) {
            console.log(
                `[GOAP] Agent ${entity.id}: Urgent replan (interrupting "${currentAction.name}") - ${agent.urgentReplanReason || "unknown"}`,
            );
        } else {
            console.log(
                `[GOAP] Agent ${entity.id}: Urgent replan - ${agent.urgentReplanReason || "unknown"}`,
            );
        }

        // Clear urgent replan flags
        agent.urgentReplanRequested = false;
        agent.urgentReplanReason = undefined;

        // Cancel current action state
        agent.currentActionStartTick = 0;
        agent.postActionDelay = 0;

        return true;
    }

    // Replan if we have no plan (agent is idle)
    if (!agent.currentPlan) {
        // Check cooldown only when idle (not when plan is complete)
        const effectiveCooldown = calculateDynamicCooldown(agent);
        const timeSinceLastPlan = tick - agent.lastPlanTime;
        if (timeSinceLastPlan < effectiveCooldown) {
            return false;
        }

        console.log(
            `[GOAP] Agent ${entity.id}: Replanning (reason: no current plan - idle)`,
        );
        return true;
    }

    // Replan if we've completed all steps (bypasses cooldown)
    if (agent.currentStepIndex >= agent.currentPlan.steps.length) {
        console.log(
            `[GOAP] Agent ${entity.id}: Replanning (reason: plan completed, goal was "${agent.currentPlan.goalId}")`,
        );
        return true;
    }

    // Check cooldown for other replan conditions (performance optimization)
    const effectiveCooldown = calculateDynamicCooldown(agent);
    const timeSinceLastPlan = tick - agent.lastPlanTime;
    if (timeSinceLastPlan < effectiveCooldown) {
        return false;
    }

    // Replan if last action failed
    if (agent.lastActionFailed) {
        console.log(
            `[GOAP] Agent ${entity.id}: Replanning (reason: action failed - ${agent.failureReason || "unknown error"})`,
        );
        return true;
    }

    // Replan if current goal is no longer valid or is now satisfied
    const currentGoal = planner.getGoal(agent.currentPlan.goalId);
    if (currentGoal) {
        const ctx = createGoapContext(entity, root, tick);
        const isValid = currentGoal.isValid(ctx);
        const isSatisfied = currentGoal.isSatisfied(ctx);

        if (!isValid) {
            console.log(
                `[GOAP] Agent ${entity.id}: Replanning (reason: goal "${agent.currentPlan.goalId}" no longer valid)`,
            );
            return true;
        }

        if (isSatisfied) {
            console.log(
                `[GOAP] Agent ${entity.id}: Replanning (reason: goal "${agent.currentPlan.goalId}" now satisfied)`,
            );
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

    // Log current agent state before planning
    const hunger = entity.getEcsComponent(HungerComponentId);
    const energy = entity.getEcsComponent(EnergyComponentId);
    const stateStr = [
        hunger ? `hunger=${hunger.hunger.toFixed(1)}` : null,
        energy ? `energy=${energy.energy.toFixed(1)}` : null,
    ]
        .filter(Boolean)
        .join(", ");

    console.log(
        `[GOAP] Agent ${entity.id} planning at tick ${tick} (${stateStr})`,
    );

    const plan = planner.plan(ctx);

    if (plan) {
        agent.currentPlan = plan;
        agent.currentStepIndex = 0;
        agent.lastActionFailed = false;
        agent.failureReason = undefined;

        // Log the plan with action names
        const actionNames = plan.steps.map((step) => {
            const action = planner.getAction(step.actionId);
            return action?.name || step.actionId;
        });

        console.log(
            `[GOAP] Agent ${entity.id} → Goal: "${plan.goalId}" | Plan: [${actionNames.join(" → ")}] (cost: ${plan.totalCost})`,
        );
    } else {
        agent.currentPlan = null;
        agent.currentStepIndex = 0;

        // Use longer cooldown for planning failures to avoid spam
        agent.planningCooldown = 60;

        console.log(
            `[GOAP] Agent ${entity.id} ✗ No valid plan found - idle (will retry in ${agent.planningCooldown} ticks) (${stateStr})`,
        );
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
    const isFirstExecution = agent.currentActionStartTick === 0;
    if (isFirstExecution) {
        agent.currentActionStartTick = tick;
        console.log(
            `[GOAP] Agent ${entity.id} ▶ Starting action: "${actionDef.name}" (step ${agent.currentStepIndex + 1}/${agent.currentPlan.steps.length})`,
        );
    }

    // Execute the action synchronously
    try {
        const result = actionDef.execute(step.executionData, ctx);

        if (result === "complete") {
            // Action completed successfully
            const duration = tick - agent.currentActionStartTick;
            agent.lastActionFailed = false;
            agent.lastActionCompletedAt = tick;
            agent.currentActionStartTick = 0; // Reset for next action

            // Calculate post-action delay
            const delay = actionDef.postActionDelay
                ? actionDef.postActionDelay(step.executionData, ctx)
                : 0;

            if (delay > 0) {
                // Action has a delay before moving to next step
                agent.postActionDelay = delay;
            } else {
                // No delay, move to next step immediately
                agent.postActionDelay = 0;
                agent.currentStepIndex++;
            }

            console.log(
                `[GOAP] Agent ${entity.id} ✓ Completed "${actionDef.name}" (took ${duration} ticks)`,
            );
        }
        // If result is "in_progress", action continues next update
    } catch (error: any) {
        // Action failed
        agent.lastActionFailed = true;
        agent.failureReason = error.message || "Unknown error";
        agent.currentActionStartTick = 0; // Reset on failure
        console.error(
            `[GOAP] Agent ${entity.id} ✗ Failed action "${actionDef.name}": ${error.message || error}`,
        );
    }

    entity.invalidateComponent(GoapAgentComponentId);
}
