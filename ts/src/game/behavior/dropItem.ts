import { adjacentPoints, pointEquals, type Point } from "../../common/point.ts";
import { log } from "../../common/logging/logger.ts";
import type { InventoryItem } from "../../data/inventory/inventoryItem.ts";
import {
    addCollectableItem,
    CollectableComponentId,
} from "../component/collectableComponent.ts";
import { GroundItemComponentId } from "../component/groundItemComponent.ts";
import { ResourceComponentId } from "../component/resourceComponent.ts";
import { BuildingComponentId } from "../component/buildingComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { findClosestAvailablePosition } from "../map/query/closestPositionQuery.ts";
import { queryEntity } from "../map/query/queryEntity.ts";
import { getWeightAtPoint } from "../map/path/graph/weight.ts";
import { collectableItemPrefab } from "../prefab/collectableItemPrefab.ts";

/**
 * Maximum Manhattan radius the drop search will scan from the worker's
 * position when looking for somewhere to leave an item. Generous enough
 * that real gameplay never hits the bound; if it does, the planner throws
 * rather than silently lose the item.
 */
export const DROP_SEARCH_RADIUS = 64;

/**
 * How many separate item piles a single tile may carry. Capping piles per tile
 * spreads a large spill across several tiles, so haulers fan out spatially
 * instead of converging on one tile and fighting over its adjacent slots.
 */
export const MAX_GROUND_ITEMS_PER_TILE = 4;

function isWalkable(root: Entity, point: Point): boolean {
    const weight = getWeightAtPoint(point, root);
    return weight !== 0 && weight < 5;
}

/**
 * The pile of `itemId` lying at `point`, if there is one. A pile holds a single
 * stack, so this is the lookup that decides whether a drop merges into an
 * existing pile or spawns a new one beside it.
 */
function findGroundPileAt(
    root: Entity,
    point: Point,
    itemId: string,
): Entity | null {
    for (const occupant of queryEntity(root, point)) {
        if (!occupant.hasComponent(GroundItemComponentId)) continue;
        const collectable = occupant.getEcsComponent(CollectableComponentId);
        if (!collectable) continue;
        if (collectable.items.some((stack) => stack.item.id === itemId)) {
            return occupant;
        }
    }
    return null;
}

/**
 * Whether the tile can take this drop without exceeding its pile cap.
 *
 * A full tile still takes more of something it already holds, because that
 * merges into the existing pile rather than adding one. Only genuinely new
 * types have to go elsewhere.
 *
 * Kept separate from tileBlocksDrop because the two answer different questions:
 * that one asks whether the tile is a legal place to put things at all, which
 * DropMode.Exact is allowed to override; this one is a hard capacity limit that
 * no drop may exceed.
 */
function tileHasPileRoom(
    root: Entity,
    point: Point,
    item: InventoryItem,
): boolean {
    let groundItems = 0;
    for (const occupant of queryEntity(root, point)) {
        if (!occupant.hasComponent(GroundItemComponentId)) continue;

        groundItems++;
        const collectable = occupant.getEcsComponent(CollectableComponentId);
        if (collectable?.items.some((stack) => stack.item.id === item.id)) {
            return true;
        }
    }
    return groundItems < MAX_GROUND_ITEMS_PER_TILE;
}

function tileBlocksDrop(
    root: Entity,
    point: Point,
    item: InventoryItem,
): boolean {
    if (!isWalkable(root, point)) return true;

    for (const occupant of queryEntity(root, point)) {
        if (occupant.hasComponent(BuildingComponentId)) return true;
        if (occupant.hasComponent(ResourceComponentId)) return true;
    }

    return !tileHasPileRoom(root, point, item);
}

/**
 * Find the nearest tile to `from` that can accept a drop of `item`.
 * Walkable, no buildings or resources, and either below the per-tile pile cap
 * or already holding a pile of the same item. Bounded to Manhattan radius 64.
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
 * Controls what happens when the target tile is occupied.
 *
 * - `Exact`: place at the given position, taking the caller's word that the tile
 *   is a legal place to leave things (a worker standing on a building, say).
 *   The per-tile pile cap still applies — see resolveDropPosition.
 * - `Nearest`: search outward from the given position and place at the closest
 *   valid tile. Returns `false` if none found within DROP_SEARCH_RADIUS.
 * - `Fail`: return `false` immediately if the tile is blocked.
 */
export const DropMode = {
    Exact: "exact",
    Nearest: "nearest",
    Fail: "fail",
} as const;

export type DropMode = (typeof DropMode)[keyof typeof DropMode];

/**
 * Decide which tile a drop actually lands on, or null if there is nowhere.
 *
 * This is the single place that answer is worked out, so that no mode can slip
 * a pile onto a tile that is already full. A caller may vouch for a tile being
 * a legal place to put things, but nobody gets to vouch for its capacity: a
 * tile holding more than MAX_GROUND_ITEMS_PER_TILE piles breaks selection
 * (which cycles through the entities on a tile) and defeats the spreading that
 * lets haulers work a spill in parallel.
 *
 * A full tile therefore overflows to the nearest tile with room rather than
 * refusing, so that enforcing the cap can never destroy goods.
 */
function resolveDropPosition(
    root: Entity,
    position: Point,
    item: InventoryItem,
    mode: DropMode,
): Point | null {
    if (mode === DropMode.Nearest) {
        return findDropPosition(root, position, item);
    }

    if (mode === DropMode.Fail) {
        if (tileBlocksDrop(root, position, item)) return null;
        return position;
    }

    if (tileHasPileRoom(root, position, item)) {
        return position;
    }
    return findDropPosition(root, position, item);
}

/**
 * Place `amount` of `item` at `position` in the world. If a ground pile of the
 * same item id already lies at the resolved position, merge into it. Otherwise
 * spawn a new pile beside whatever else the tile holds, up to
 * MAX_GROUND_ITEMS_PER_TILE piles per tile.
 *
 * `mode` decides how hard the drop tries to honour `position` when the tile is
 * occupied — see DropMode and resolveDropPosition. Whichever mode is used, the
 * pile lands on a tile that has room for it.
 *
 * `tick` stamps the pile's decay clock. Merging refreshes it: fresh goods keep
 * the pile alive, and the drip-feed-to-preserve exploit is meaningless because
 * players do not want their goods on the ground in the first place.
 *
 * `reason` is a human-readable explanation of why the item was dropped here. It
 * is stored on the resulting pile's collectable component and shown in the
 * selection tile to make drop-related behaviour easier to debug.
 *
 * Returns `true` when the item was placed, `false` when placement was skipped.
 */
export function dropItemAtPosition(
    root: Entity,
    tick: number,
    position: Point,
    item: InventoryItem,
    amount: number,
    reason: string,
    mode: DropMode = DropMode.Exact,
): boolean {
    if (amount <= 0) return true;

    const dropPos = resolveDropPosition(root, position, item, mode);
    if (!dropPos) {
        log.warn(
            `No valid drop position found near (${position.x},${position.y}) for ${item.id}`,
        );
        return false;
    }

    const existingPile = findGroundPileAt(root, dropPos, item.id);
    if (existingPile) {
        const collectable = existingPile.requireEcsComponent(
            CollectableComponentId,
        );
        addCollectableItem(collectable, { item, amount });
        collectable.reason = reason;
        existingPile.invalidateComponent(CollectableComponentId);

        const groundItem = existingPile.requireEcsComponent(
            GroundItemComponentId,
        );
        groundItem.droppedAtTick = tick;
        existingPile.invalidateComponent(GroundItemComponentId);

        log.info(
            `Merged ${amount}x ${item.id} into pile ${existingPile.id} at (${dropPos.x},${dropPos.y})`,
        );
        return true;
    }

    const pile = collectableItemPrefab(item, amount, tick, reason);
    root.addChild(pile);
    pile.worldPosition = dropPos;
    log.info(
        `Spawned new pile ${pile.id} (${amount}x ${item.id}) at (${dropPos.x},${dropPos.y})`,
    );
    return true;
}

export function isSamePoint(a: Point, b: Point): boolean {
    return pointEquals(a, b);
}
