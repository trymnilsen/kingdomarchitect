import {
    type InventoryItem,
    ItemRarity,
} from "../../data/inventory/inventoryItem.ts";
import { InventoryComponentId } from "../component/inventoryComponent.ts";
import type { Entity } from "../entity/entity.ts";

/**
 * One physical contribution to a logical stock entry: the stockpile entity that
 * holds the items and how many it holds. The live entity reference is kept
 * (rather than an id) because a stock aggregate is a transient, read-time view
 * that is never serialized — callers use it immediately to read positions, jump
 * the camera, or sort by distance. This mirrors {@link MaterialSource}.
 */
export type StockSource = {
    entity: Entity;
    amount: number;
};

/**
 * A logical stack of items aggregated across stockpiles, keyed by item identity
 * and rarity. `total` is the sum of every source's amount; `sources` records
 * where the items physically live so the UI can show "4 here, 6 there" and jump
 * to each location.
 */
export type StockEntry = {
    item: InventoryItem;
    rarity: ItemRarity;
    total: number;
    sources: StockSource[];
};

/**
 * The result of aggregating stock, keyed by `${itemId}|${rarity}`. A Map keeps
 * lookups O(1) for the logistics helpers while still being cheap to iterate for
 * the UI.
 */
export type StockAggregate = Map<string, StockEntry>;

function stockKey(itemId: string, rarity: ItemRarity): string {
    return `${itemId}|${rarity}`;
}

/**
 * Stable key for a logical entry, usable as a selection identity that survives
 * filtering and re-sorting (unlike a positional index).
 */
export function stockEntryKey(entry: StockEntry): string {
    return stockKey(entry.item.id, entry.rarity);
}

/**
 * Aggregate the contents of the given stockpiles into logical entries keyed by
 * (item id, rarity). This is a single sweep — one pass over the stockpiles and
 * one pass over each inventory's stacks — so cost is O(stockpiles * stacks)
 * regardless of how many distinct items callers later look up. Resolve the
 * stockpile set once per recompute (see resolveStockSources) and reuse the
 * aggregate for every item, chip and predicate rather than re-querying per item.
 *
 * A Common and a Rare entry of the same id stay distinct, matching the way a
 * single inventory stacks items (addInventoryItem keys on id + rarity).
 */
export function aggregateStock(stockpiles: Entity[]): StockAggregate {
    const aggregate: StockAggregate = new Map();

    for (const stockpile of stockpiles) {
        const inventory = stockpile.getEcsComponent(InventoryComponentId);
        if (!inventory) {
            continue;
        }

        for (const stack of inventory.items) {
            if (stack.amount <= 0) {
                continue;
            }

            const rarity = stack.item.rarity ?? ItemRarity.Common;
            const key = stockKey(stack.item.id, rarity);
            let entry = aggregate.get(key);
            if (!entry) {
                entry = {
                    item: stack.item,
                    rarity,
                    total: 0,
                    sources: [],
                };
                aggregate.set(key, entry);
            }

            entry.total += stack.amount;
            entry.sources.push({ entity: stockpile, amount: stack.amount });
        }
    }

    return aggregate;
}

/**
 * Flat list of every logical entry, for rendering the inventory grid.
 */
export function stockEntries(aggregate: StockAggregate): StockEntry[] {
    return Array.from(aggregate.values());
}

/**
 * The entry for an exact (item id, rarity), or undefined if none is held.
 */
export function entryFor(
    aggregate: StockAggregate,
    itemId: string,
    rarity: ItemRarity = ItemRarity.Common,
): StockEntry | undefined {
    return aggregate.get(stockKey(itemId, rarity));
}

/**
 * Total amount of an item across every rarity. Use this for rarity-agnostic
 * logistics (construction recipes ask for "wood", not "common wood"); reading a
 * single rarity bucket would under-count when multiple rarities are held.
 */
export function totalForId(aggregate: StockAggregate, itemId: string): number {
    let total = 0;
    for (const entry of aggregate.values()) {
        if (entry.item.id === itemId) {
            total += entry.total;
        }
    }
    return total;
}

/**
 * Every source holding an item, across all rarities, merged so each stockpile
 * appears once with its combined amount. Without the merge a stockpile holding
 * both common and rare of the same id would show up twice, which breaks
 * nearest-source logic that treats sources as distinct locations.
 */
export function sourcesForId(
    aggregate: StockAggregate,
    itemId: string,
): StockSource[] {
    const byEntity = new Map<Entity, number>();
    for (const entry of aggregate.values()) {
        if (entry.item.id !== itemId) {
            continue;
        }
        for (const source of entry.sources) {
            byEntity.set(
                source.entity,
                (byEntity.get(source.entity) ?? 0) + source.amount,
            );
        }
    }

    const merged: StockSource[] = [];
    for (const [entity, amount] of byEntity) {
        merged.push({ entity, amount });
    }
    return merged;
}
