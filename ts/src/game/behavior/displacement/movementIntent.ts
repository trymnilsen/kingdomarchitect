/**
 * Reading a moving entity's intended next step, on demand.
 *
 * An entity's committed next step is already its current `moveTo` action's
 * `cachedPath[0]`. We read that directly rather than storing a duplicate
 * "intended tile" field, so the signal can never drift out of sync with the
 * path the entity actually follows.
 *
 * Returns null when the entity is not in a `moveTo`, or is in one without a cached
 * path yet (no committed direction — it stays put for swap purposes, though it is
 * still cheap to displace via the normal resistance path). A worker doing a
 * stationary task such as crafting likewise returns null.
 */
import type { Point } from "../../../common/point.ts";
import { getBehaviorAgent } from "../../component/BehaviorAgentComponent.ts";
import type { Entity } from "../../entity/entity.ts";

export function deriveIntendedNextStep(entity: Entity): Point | null {
    const agent = getBehaviorAgent(entity);
    const action = agent?.actionQueue[0];
    if (
        action?.type === "moveTo" &&
        action.cachedPath &&
        action.cachedPath.length > 0
    ) {
        return action.cachedPath[0];
    }
    return null;
}
