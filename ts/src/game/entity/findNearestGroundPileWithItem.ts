import { distance, type Point } from "../../common/point.ts";
import { CollectableComponentId } from "../component/collectableComponent.ts";
import { GroundItemComponentId } from "../component/groundItemComponent.ts";
import type { Entity } from "./entity.ts";

/**
 * Find the nearest ground pile holding at least one of `itemId`, measured from
 * `from`. Returns null when no reachable pile carries the item. Shared by the
 * crafting and build planners, which both fall back to ground piles after
 * checking stockpiles.
 */
export function findNearestGroundPileWithItem(
    root: Entity,
    from: Point,
    itemId: string,
): Entity | null {
    const candidates = root.queryComponents(GroundItemComponentId);
    let best: Entity | null = null;
    let bestDistance = Infinity;
    for (const [entity] of candidates) {
        const collectable = entity.getEcsComponent(CollectableComponentId);
        if (!collectable) continue;
        const matches = collectable.items.some(
            (stack) => stack.item.id === itemId && stack.amount > 0,
        );
        if (!matches) continue;
        const d = distance(from, entity.worldPosition);
        if (d < bestDistance) {
            bestDistance = d;
            best = entity;
        }
    }
    return best;
}
