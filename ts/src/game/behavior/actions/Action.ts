import type { Point } from "../../../common/point.ts";
import type { BehaviorActionData } from "./ActionData.ts";

/** Quality of sleep determines restore rates and duration. */
export type SleepQuality =
    | "house"
    | "bedrollFire"
    | "bedrollAlone"
    | "collapse";

/**
 * Why an action gave up. Reported when the behavior system logs the failure,
 * so a stuck worker can be told apart from one whose target vanished.
 */
export type FailureCause =
    | { type: "pathBlocked"; target: Point }
    | { type: "targetGone"; entityId: string }
    | { type: "notAdjacent" }
    | { type: "noResources" }
    | { type: "stockpileFull"; stockpileId: string }
    | { type: "unknown" };

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
