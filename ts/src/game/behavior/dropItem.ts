import {
    adjacentPoints,
    pointEquals,
    type Point,
} from "../../common/point.ts";
import { createLogger } from "../../common/logging/logger.ts";
import type { InventoryItem } from "../../data/inventory/inventoryItem.ts";
import { addCollectableItem, CollectableComponentId } from "../component/collectableComponent.ts";
import { GroundItemComponentId } from "../component/groundItemComponent.ts";
import { ResourceComponentId } from "../component/resourceComponent.ts";
import { BuildingComponentId } from "../component/buildingComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { findClosestAvailablePosition } from "../map/query/closestPositionQuery.ts";
import { queryEntity } from "../map/query/queryEntity.ts";
import { getWeightAtPoint } from "../map/path/graph/weight.ts";
import { collectableItemPrefab } from "../prefab/collectableItemPrefab.ts";

const log = createLogger("dropItem");

/**
 * Maximum Manhattan radius the drop search will scan from the worker's
 * position when looking for somewhere to leave an item. Generous enough
 * that real gameplay never hits the bound; if it does, the planner throws
 * rather than silently lose the item.
 */
export const DROP_SEARCH_RADIUS = 64;

function isWalkable(root: Entity, point: Point): boolean {
    const weight = getWeightAtPoint(point, root);
    return weight !== 0 && weight < 5;
}

function findGroundPileAt(
    root: Entity,
    point: Point,
    itemId: string,
): Entity | null {
    const occupants = queryEntity(root, point);
    for (const occupant of occupants) {
        if (!occupant.hasComponent(GroundItemComponentId)) continue;
        const collectable = occupant.getEcsComponent(CollectableComponentId);
        if (!collectable) continue;
        const matches = collectable.items.some(
            (stack) => stack.item.id === itemId,
        );
        if (matches) return occupant;
    }
    return null;
}

function tileBlocksDrop(
    root: Entity,
    point: Point,
    item: InventoryItem,
): boolean {
    if (!isWalkable(root, point)) return true;

    const occupants = queryEntity(root, point);
    for (const occupant of occupants) {
        if (occupant.hasComponent(BuildingComponentId)) return true;
        if (occupant.hasComponent(ResourceComponentId)) return true;
        if (occupant.hasComponent(GroundItemComponentId)) {
            const collectable = occupant.getEcsComponent(
                CollectableComponentId,
            );
            if (!collectable) continue;
            const sameItem = collectable.items.some(
                (stack) => stack.item.id === item.id,
            );
            if (!sameItem) return true;
        }
    }
    return false;
}

/**
 * Find the nearest tile to `from` that can accept a drop of `item`.
 * Walkable, no buildings or resources, and either empty of ground piles
 * or holding only matching-id piles. Bounded to Manhattan radius 64.
 * Returns null if no spot exists within range.
 */
export function findDropPosition(
    root: Entity,
    from: Point,
    item: InventoryItem,
): Point | null {
    return findClosestAvailablePosition(
        root,
        from,
        (point) => !tileBlocksDrop(root, point, item),
        DROP_SEARCH_RADIUS,
    );
}

/**
 * Find a free cardinally-adjacent tile to `from` that can accept a drop of
 * `item`. Used by player drop — the worker drops next to themselves rather
 * than searching wide.
 */
export function findFreeAdjacentTile(
    root: Entity,
    from: Point,
    item: InventoryItem,
): Point | null {
    for (const candidate of adjacentPoints(from)) {
        if (!tileBlocksDrop(root, candidate, item)) {
            return candidate;
        }
    }
    return null;
}

/**
 * Place `amount` of `item` at `position` in the world. If a ground pile
 * with the same item id exists at that position, merge into it. Otherwise
 * spawn a new ground pile entity via collectableItemPrefab. Caller is
 * responsible for ensuring `position` is a valid drop tile.
 */
export function dropItemAtPosition(
    root: Entity,
    position: Point,
    item: InventoryItem,
    amount: number,
): void {
    if (amount <= 0) return;

    const existingPile = findGroundPileAt(root, position, item.id);
    if (existingPile) {
        const collectable = existingPile.requireEcsComponent(
            CollectableComponentId,
        );
        addCollectableItem(collectable, { item, amount });
        existingPile.invalidateComponent(CollectableComponentId);
        log.info(
            `Merged ${amount}x ${item.id} into pile ${existingPile.id} at (${position.x},${position.y})`,
        );
        return;
    }

    const pile = collectableItemPrefab(item, amount);
    root.addChild(pile);
    pile.worldPosition = position;
    log.info(
        `Spawned new pile ${pile.id} (${amount}x ${item.id}) at (${position.x},${position.y})`,
    );
}

export function isSamePoint(a: Point, b: Point): boolean {
    return pointEquals(a, b);
}
