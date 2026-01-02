import type { GoapPlan } from "../goap/goapPlanner.ts";

/**
 * Component that stores GOAP planning and execution state for an agent.
 * Attached to entities that use GOAP for autonomous behavior.
 */
export type GoapAgentComponent = {
    id: typeof GoapAgentComponentId;

    /** Current plan being executed */
    currentPlan: GoapPlan | null;

    /** Index of the current step in the plan */
    currentStepIndex: number;

    /** Timestamp when the current action started executing */
    currentActionStartTick: number;

    /** Timestamp when the last action completed (for post-action delays) */
    lastActionCompletedAt: number;

    /** Post-action delay in milliseconds */
    postActionDelay: number;

    /** Cooldown before replanning (milliseconds) */
    planningCooldown: number;

    /** Timestamp of last planning attempt */
    lastPlanTime: number;

    /** Track if the last action failed */
    lastActionFailed: boolean;

    /** Reason for the last failure */
    failureReason?: string;
};

export const GoapAgentComponentId = "GoapAgent";

/**
 * Create a new GOAP agent component with default values.
 */
export function createGoapAgentComponent(): GoapAgentComponent {
    return {
        id: GoapAgentComponentId,
        currentPlan: null,
        currentStepIndex: 0,
        currentActionStartTick: 0,
        lastActionCompletedAt: 0,
        postActionDelay: 0,
        planningCooldown: 1000, // 1 second cooldown between replanning
        lastPlanTime: -Infinity, // Allow immediate planning on first update
        lastActionFailed: false,
    };
}
