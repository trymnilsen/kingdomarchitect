import type { Entity } from "../../entity/entity.ts";
import { isManningStation } from "../../component/stationQuery.ts";
import { ActionComplete, ActionRunning, type ActionResult } from "./action.ts";

/**
 * Stand watch on the station the guard is already on.
 *
 * Manning a post is an activity with no steps, and the behavior system has no
 * other way to express one: a behavior expanding to an empty plan is skipped
 * and the next adopted, so the guard would be handed work instead.
 */
export type HoldStationActionData = {
    type: "holdStation";
    untilTick: number;
};

export function executeHoldStationAction(
    action: HoldStationActionData,
    entity: Entity,
    tick: number,
): ActionResult {
    if (!isManningStation(entity)) {
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: entity.id },
        };
    }

    if (tick >= action.untilTick) {
        return ActionComplete;
    }

    return ActionRunning;
}
