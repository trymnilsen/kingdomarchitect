import type { Point } from "../../../common/point.ts";
import type { Entity } from "../../entity/entity.ts";
import { checkFishingSpot } from "../../fishing/checkFishingSpot.ts";
import { resolveFishingProfile } from "../../fishing/resolveFishingProfile.ts";
import type { BehaviorActionData } from "../actions/actionData.ts";

// Empty when the order cannot be carried out, so the caller can drop it
export function planFishing(entity: Entity, spot: Point): BehaviorActionData[] {
    if (!resolveFishingProfile(entity)) {
        return [];
    }

    if (!checkFishingSpot(entity.getRootEntity(), spot).isFishingSpot) {
        return [];
    }

    return [
        { type: "moveTo", target: spot, goal: { kind: "adjacent" } },
        { type: "fish", target: spot },
    ];
}
