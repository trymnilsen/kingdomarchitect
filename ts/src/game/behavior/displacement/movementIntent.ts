import type { Point } from "../../../common/point.ts";
import { getBehaviorAgent } from "../../component/behaviorAgentComponent.ts";
import type { Entity } from "../../entity/entity.ts";

/**
 * Where this entity is trying to step next, or null when it has no committed
 * direction. Displacement negotiation uses it to spot a head-on pass: if a
 * blocker intends to step onto the requester's tile, the two can swap.
 *
 * The head of the cached path is the answer rather than a stored field, because
 * the cached path is the route the entity will actually follow. An entity with
 * no cached path takes no part in a swap this tick and gets out of the way
 * through ordinary displacement instead.
 */
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
