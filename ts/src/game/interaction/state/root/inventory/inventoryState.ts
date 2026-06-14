import { type ComponentDescriptor } from "../../../../../ui/declarative/ui.ts";
import { InteractionState } from "../../../handler/interactionState.ts";
import { AlertMessageState } from "../../common/alertMessageState.ts";
import { inventoryView, type InventoryChip } from "./inventoryView.ts";
import type { Entity } from "../../../../entity/entity.ts";
import { ItemTag } from "../../../../../data/inventory/inventoryItem.ts";
import { distance } from "../../../../../common/point.ts";
import { EquipSlotSelectionState } from "../../equip/equipSlotSelectionState.ts";
import { EquipItemCommand } from "../../../../../server/message/command/equipItemCommand.ts";
import { resolveStockSources } from "../../../../building/resolveStockSources.ts";
import {
    aggregateStock,
    stockEntries,
    type StockEntry,
    type StockSource,
} from "../../../../building/stockAggregate.ts";
import type { Point } from "../../../../../common/point.ts";
import {
    applyStockPredicates,
    kingdomStockFilter,
    type StockFilter,
} from "../../../../building/stockFilter.ts";

type EquipSlot = "primary" | "secondary";

/**
 * Shows aggregated stock for a settlement. The view is a read-only projection
 * over the stockpiles selected by the current filter — selecting a building
 * opens its own stock (a dismissable scope chip); dismissing that chip broadens
 * to the whole kingdom. No items are mutated here.
 */
export class InventoryState extends InteractionState {
    private _selectedKey: string | null = null;
    private _anchor: Entity;
    private _filter: StockFilter;
    private _equipSlot?: EquipSlot;

    override get isModal(): boolean {
        return true;
    }

    override get stateName(): string {
        return "Inventory";
    }

    /**
     * @param anchor entity the view is opened from. In equip mode this is the
     *  worker being equipped (its settlement scopes the stockpiles, and the
     *  worker walks from there to fetch the item).
     * @param filter initial scope/predicate filter.
     * @param equipSlot when set, the view is in equip-pick mode: choosing an
     *  item equips it into this slot on the anchor worker instead of browsing.
     */
    constructor(anchor: Entity, filter?: StockFilter, equipSlot?: EquipSlot) {
        super();
        this._anchor = anchor;
        this._filter = filter ?? kingdomStockFilter();
        this._equipSlot = equipSlot;
    }

    override getView(): ComponentDescriptor | null {
        // Recompute the aggregate every render so the view is a live mirror of
        // stock that changes each tick. The stockpile set is resolved once per
        // render; see stockAggregate for why this single sweep is the whole cost.
        const sources = resolveStockSources(this._filter.scope, this._anchor);
        const aggregate = aggregateStock(sources);
        const entries = applyStockPredicates(
            stockEntries(aggregate),
            this._filter.predicates,
        ).sort((a, b) => a.item.name.localeCompare(b.item.name));

        return inventoryView({
            entries,
            chips: this.buildChips(),
            selectedKey: this._selectedKey,
            // A single-inventory scope is one box, so per-location jump targets
            // are pointless — the player is already looking at the box.
            showSources: this._filter.scope.kind !== "single",
            onSelect: (key) => {
                this._selectedKey = key;
            },
            onJump: (entity) => {
                this.context.camera.position = entity.worldPosition;
                this.context.stateChanger.pop(null);
            },
            onEquip: (entry) => this.equip(entry),
            // Dropping is meaningless while picking an item to equip, so the
            // button is hidden in equip mode by omitting the callback.
            onDrop: this._equipSlot
                ? undefined
                : () => {
                      this.context.stateChanger.push(
                          new AlertMessageState("Ops", "not implemented"),
                      );
                  },
        });
    }

    private equip(entry: StockEntry): void {
        if (this._equipSlot) {
            this.equipIntoSlot(entry, this._equipSlot);
            return;
        }

        // Browse mode: item-first flow — pick the slot, then tap a unit.
        if (!entry.item.tag?.includes(ItemTag.SkillGear)) {
            return;
        }
        this.context.stateChanger.replace(
            new EquipSlotSelectionState(this._anchor.id, entry.item.id),
        );
    }

    /**
     * Equip the chosen item into the worker's slot, fetching it from the
     * nearest stockpile that holds it. The worker (the anchor) walks to that
     * source, picks one up, and equips — the whole modal chain then closes.
     */
    private equipIntoSlot(entry: StockEntry, slot: EquipSlot): void {
        const source = nearestSource(entry, this._anchor.worldPosition);
        if (!source) {
            return;
        }
        this.context.commandDispatcher(
            EquipItemCommand(
                this._anchor,
                source.entity.id,
                entry.item.id,
                slot,
            ),
        );
        this.context.stateChanger.clear();
    }

    private buildChips(): InventoryChip[] {
        const chips: InventoryChip[] = [];

        const scopeChip = this._filter.scopeChip;
        if (scopeChip) {
            chips.push({
                label: scopeChip.label,
                dismissable: scopeChip.dismissable,
                onDismiss: () => {
                    this._filter = {
                        scope: { kind: "allStockpiles" },
                        predicates: this._filter.predicates,
                    };
                },
            });
        }

        for (const predicate of this._filter.predicates) {
            chips.push({
                label: predicate.label,
                dismissable: predicate.dismissable,
                onDismiss: predicate.dismissable
                    ? () => {
                          this._filter = {
                              ...this._filter,
                              predicates: this._filter.predicates.filter(
                                  (other) => other.id !== predicate.id,
                              ),
                          };
                      }
                    : undefined,
            });
        }

        return chips;
    }
}

/**
 * The source stockpile closest to the worker, so equip fetches from the pile
 * with the shortest walk. Returns undefined when the entry has no sources.
 */
function nearestSource(
    entry: StockEntry,
    from: Point,
): StockSource | undefined {
    let nearest: StockSource | undefined;
    let nearestDistance = Infinity;
    for (const source of entry.sources) {
        const d = distance(from, source.entity.worldPosition);
        if (d < nearestDistance) {
            nearest = source;
            nearestDistance = d;
        }
    }
    return nearest;
}
