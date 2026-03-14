import type { Point } from "../../../common/point.ts";
import type { BehaviorActionData } from "./ActionData.ts";

/** Quality of sleep determines restore rates and duration. */
export type SleepQuality = "house" | "bedrollFire" | "bedrollAlone" | "collapse";

/**
 * Failure causes carry enough context for behaviors to branch intelligently
 * when a replan is triggered. For example, keepWarmBehavior can see that
 * the path to fire was blocked and try a different fire, or fall back to
 * building a new one. Without cause, every failure would look the same.
 */
export type FailureCause =
    | { type: "pathBlocked"; target: Point }
    | { type: "targetGone"; entityId: string }
    | { type: "notAdjacent" }
    | { type: "noResources" }
    | { type: "unknown" };

export type ActionFailure = {
    actionType: string;
    cause: FailureCause;
};

export type ActionResult =
    | { kind: "complete" }
    | { kind: "running" }
    | { kind: "failed"; cause: FailureCause }
    | { kind: "subaction"; actions: BehaviorActionData[] };

/**
 * Action completed successfully. The action will be removed from the queue
 * and the next action (if any) will be executed on the following tick.
 */
export const ActionComplete: ActionResult = { kind: "complete" };

/**
 * Action is still in progress. The action remains in the queue and will
 * be executed again on the next tick.
 */
export const ActionRunning: ActionResult = { kind: "running" };

/**
 * Item transfer specification for inventory actions
 */
export type ItemTransfer = {
    itemId: string;
    amount: number;
};
