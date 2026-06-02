/**
 * Where is this entity trying to step next? Used by displacement negotiation to
 * spot a head-on pass: if a blocker's intended next step is the requester's own
 * tile, the two want to trade places and can swap for free (see
 * `negotiateDisplacement`).
 *
 * Why read `cachedPath[0]` directly rather than keep an "intended tile" field:
 * the cached path IS the route the entity will follow, so reading its head can
 * never disagree with what the entity actually does next. A separate stored field
 * would be a second source of truth that drifts the moment the path changes.
 *
 * Why not recompute the step (run pathfinding here) when the cache is empty: that
 * was tried and rejected. The deliberate contract is that an entity with no cached
 * path has *no committed direction* — it neither initiates nor participates in a
 * swap this tick (returns null). Such a "planless" mover is meant to get out of the
 * way via cheap displacement instead, not via a recomputed swap.
 *
 * Consequence worth knowing: two entities that become adjacent on the SAME tick
 * they first plan (e.g. spawned already face-to-face) have no cached path yet, so
 * the swap is not detected and they can stall. In normal play they approach over
 * several ticks and each has a committed path by the time they meet, so the swap
 * fires. The spawned-adjacent edge is the planless case above.
 *
 * Returns null for a stationary task (crafting, etc.) — its action is not a moveTo.
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
