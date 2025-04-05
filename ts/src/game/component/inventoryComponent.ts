import type {
    InventoryItemList,
    InventoryItemQuantity,
} from "../../data/inventory/inventoryItemQuantity.js";

export class InventoryComponent {
    private _items: InventoryItemQuantity[] = [];
    get items(): InventoryItemList {
        return this._items;
    }
}
