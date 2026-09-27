import type { Point } from "../../../common/point.ts";
import type { BehaviorActionData } from "./actionData.ts";

/** Quality of sleep determines restore rates and duration. */
export type SleepQuality =
    "house" | "bedrollFire" | "bedrollAlone" | "collapse";

/**
 * Why an action gave up, so the behavior that planned it can decide whether to
 * retry. noRoute means no path exists from here. pathBlocked means the route
 * turned impassable mid-walk and a fresh search may find another.
 *
 * Being too far away is not a cause. An action only runs within its reach
 * (see actionApproach.ts), and an entity out of reach is walked into it.
 */
export type FailureCause =
    | { type: "noRoute"; target: Point }
    | { type: "pathBlocked"; target: Point }
    | { type: "targetGone"; entityId: string }
    | { type: "noResources" }
    | { type: "stockpileFull"; stockpileId: string }
    | { type: "nothingToAttack" }
    | { type: "notFishingSpot"; target: Point }
    | { type: "noFishingTackle" }
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
