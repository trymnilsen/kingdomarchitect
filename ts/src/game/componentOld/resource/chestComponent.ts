import { InventoryItem } from "../../../data/inventory/inventoryItem.js";
import { EntityComponent } from "../entityComponent.js";

export class ChestComponent extends EntityComponent {
    private _items: InventoryItem[];

    public get items(): ReadonlyArray<InventoryItem> {
        return this._items;
    }

    constructor(items: InventoryItem[]) {
        super();
        this._items = items;
    }
}
