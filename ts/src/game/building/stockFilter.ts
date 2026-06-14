import { ItemTag } from "../../data/inventory/inventoryItem.ts";
import type { StockScope } from "./resolveStockSources.ts";
import type { StockEntry } from "./stockAggregate.ts";

/**
 * An item-predicate filter, rendered as a chip. Predicates act on already
 * aggregated entries (the second filter stage), as opposed to scope which
 * decides which stockpiles feed the aggregate (the first stage).
 *
 * `dismissable` encodes whose decision the filter is: a caller-imposed task
 * constraint (e.g. the equip flow only ever shows equipment) is locked, while a
 * user convenience can be toggled off to broaden the view.
 */
export type StockPredicate = {
    id: string;
    label: string;
    dismissable: boolean;
    match: (entry: StockEntry) => boolean;
};

/**
 * The chip shown for the source scope. Dismissing a dismissable scope chip
 * broadens a single-inventory view to the whole settlement's stockpiles.
 */
export type StockScopeChip = {
    label: string;
    dismissable: boolean;
};

export type StockFilter = {
    scope: StockScope;
    scopeChip?: StockScopeChip;
    predicates: StockPredicate[];
};

/**
 * Filter to a single inventory, shown as a dismissable scope chip. This is how
 * selecting a building opens its own stock; dismissing the chip broadens to the
 * kingdom-wide view.
 */
export function singleInventoryFilter(
    entityId: string,
    label: string,
    predicates: StockPredicate[] = [],
): StockFilter {
    return {
        scope: { kind: "single", entityId },
        scopeChip: { label, dismissable: true },
        predicates,
    };
}

/**
 * Filter showing every stockpile in the settlement, optionally narrowed by
 * predicates (e.g. the equip flow passes a non-dismissable equipment predicate).
 */
export function kingdomStockFilter(
    predicates: StockPredicate[] = [],
): StockFilter {
    return {
        scope: { kind: "allStockpiles" },
        predicates,
    };
}

/**
 * Predicate restricting to equippable gear. Used by the equip flow as a
 * non-dismissable constraint.
 */
export function equipmentPredicate(dismissable = false): StockPredicate {
    return {
        id: "tag:skillgear",
        label: "Equipment",
        dismissable,
        match: (entry) => entry.item.tag?.includes(ItemTag.SkillGear) ?? false,
    };
}

/**
 * Predicate for items a worker can equip into a slot: skill gear or
 * consumables (potions can sit in the secondary slot to be drunk). Used as a
 * non-dismissable constraint when opening the inventory from an equipment slot.
 */
export function equippablePredicate(dismissable = false): StockPredicate {
    return {
        id: "tag:equippable",
        label: "Equipment",
        dismissable,
        match: (entry) =>
            entry.item.tag?.some(
                (tag) =>
                    tag === ItemTag.SkillGear || tag === ItemTag.Consumable,
            ) ?? false,
    };
}

/**
 * Apply every predicate (logical AND) to the aggregated entries.
 */
export function applyStockPredicates(
    entries: StockEntry[],
    predicates: StockPredicate[],
): StockEntry[] {
    if (predicates.length === 0) {
        return entries;
    }
    return entries.filter((entry) =>
        predicates.every((predicate) => predicate.match(entry)),
    );
}
