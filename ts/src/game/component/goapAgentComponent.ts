import type { Point } from "../../common/point.ts";
import type { GoapPlan } from "../goap/goapPlanner.ts";

/**
 * Player command types that can be issued to GOAP agents.
 * These override autonomous behavior with direct player control.
 */
export type PlayerCommand =
    | {
          action: "move";
          targetPosition: Point;
      }
    | {
          action: "attack";
          targetEntityId: string;
      }
    | {
          action: "pickup";
          targetEntityId: string;
      }
    | {
          action: "interact";
          targetEntityId: string;
      };

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

    /** Cooldown before replanning in ticks */
    planningCooldown: number;

    /** Timestamp of last planning attempt */
    lastPlanTime: number;

    /** Track if the last action failed */
    lastActionFailed: boolean;

    /** Reason for the last failure */
    failureReason?: string;

    /** index of the currently claimed job (if any) in the job queue */
    claimedJob?: number;

    /** Flag to force urgent replan (bypasses cooldown) */
    urgentReplanRequested: boolean;

    /** Reason for urgent replan (for debugging) */
    urgentReplanReason?: string;

    /**
     * Pending player command that overrides autonomous behavior.
     * When set, the followPlayerCommand goal becomes valid with highest priority.
     * Cleared when the command is completed.
     */
    playerCommand?: PlayerCommand;
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
        planningCooldown: 30, // Default cooldown (dynamic system will override this)
        lastPlanTime: -Infinity, // Allow immediate planning on first update
        lastActionFailed: false,
        urgentReplanRequested: false,
        urgentReplanReason: undefined,
    };
}
