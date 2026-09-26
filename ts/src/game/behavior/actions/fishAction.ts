import { log } from "../../../common/logging/logger.ts";
import { isPointAdjacentTo, type Point } from "../../../common/point.ts";
import { spendEntityEnergy } from "../../component/energyComponent.ts";
import {
    addToHeldItem,
    canAddToHeld,
    HeldItemComponentId,
} from "../../component/heldItemComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { checkFishingSpot } from "../../fishing/checkFishingSpot.ts";
import { resolveFishingProfile } from "../../fishing/resolveFishingProfile.ts";
import { ActionComplete, ActionRunning, type ActionResult } from "./action.ts";
import { freeHandSubaction } from "./freeHandSubaction.ts";

export type FishActionData = {
    type: "fish";
    // The water tile, the worker stands on the bank beside it
    target: Point;
    progress?: number;
};

// Tackle is re-read every tick so unequipping the rod mid-cast ends the action
export function executeFishAction(
    action: FishActionData,
    entity: Entity,
): ActionResult {
    const spot = checkFishingSpot(entity.getRootEntity(), action.target);
    if (!spot.isFishingSpot) {
        log.info(`Fishing spot no longer usable: ${spot.reason}`, {
            target: action.target,
        });
        return {
            kind: "failed",
            cause: { type: "notFishingSpot", target: action.target },
        };
    }

    if (!isPointAdjacentTo(action.target, entity.worldPosition)) {
        log.warn(`Worker not adjacent to fishing spot`);
        return { kind: "failed", cause: { type: "notAdjacent" } };
    }

    const profile = resolveFishingProfile(entity);
    if (!profile) {
        return { kind: "failed", cause: { type: "noFishingTackle" } };
    }

    const held = entity.requireEcsComponent(HeldItemComponentId);
    const catchItem = profile.catch.item;
    if (held.item && !canAddToHeld(held, catchItem)) {
        return freeHandSubaction(entity, held.item, action.target, "fishing");
    }

    if (action.progress === undefined) {
        action.progress = 0;
    }
    action.progress++;
    spendEntityEnergy(entity, 2);

    if (action.progress < profile.duration) {
        return ActionRunning;
    }

    addToHeldItem(held, catchItem, profile.catch.amount);
    entity.invalidateComponent(HeldItemComponentId);
    return ActionComplete;
}
