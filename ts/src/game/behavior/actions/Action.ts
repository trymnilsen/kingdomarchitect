import type { Entity } from "../../entity/entity.ts";
import type { Point } from "../../../common/point.ts";

export type ActionStatus = "complete" | "running" | "failed";

/**
 * Action data types - these are serializable plain objects that can be stored in components.
 * Each action type has its own data structure with the information needed to execute it.
 */
export type BehaviorActionData =
    | { type: "wait"; until: number }
    | { type: "moveTo"; target: Point }
    | { type: "playerMove"; target: Point }
    | { type: "claimJob"; jobIndex: number }
    | { type: "executeJob" }
    | { type: "sleep" };

/**
 * Action executor function type - takes action data, entity, and tick, returns status.
 */
export type BehaviorActionExecutor = (
    action: BehaviorActionData,
    entity: Entity,
    tick: number,
) => ActionStatus;
