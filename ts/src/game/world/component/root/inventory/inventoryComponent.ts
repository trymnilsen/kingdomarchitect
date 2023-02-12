import { InventoryItem } from "../../../../../data/inventory/inventoryItem";
import { woodResourceItem } from "../../../../../data/inventory/resources";
import { EntityComponent } from "../../entityComponent";

type InventoryEntry = { amount: number; item: InventoryItem };

export class InventoryComponent extends EntityComponent {
    private _items: { [id: string]: InventoryEntry } = {};

    get items(): ReadonlyArray<Readonly<InventoryEntry>> {
        return Object.values(this._items);
    }

    addInventoryItem(item: InventoryItem, amount: number) {
        if (!this._items[item.id]) {
            this._items[item.id] = {
                amount,
                item,
            };
        } else {
            this._items[item.id].amount += amount;
        }
    }

    hasAmount(itemId: string, amount: number): boolean {
        if (!!this._items[itemId]) {
            return this._items[itemId].amount >= amount;
        } else {
            return false;
        }
    }

    removeInventoryItem(itemId: string, amount: number): boolean {
        const item = this._items[itemId];
        if (!!item) {
            if (item.amount > amount) {
                item.amount -= amount;
                return true;
            } else if (item.amount == amount) {
                delete this._items[itemId];
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
}
