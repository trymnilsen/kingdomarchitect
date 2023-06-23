import { InventoryItem } from "../../../../data/inventory/inventoryItem.js";
import { EntityComponent } from "../entityComponent.js";

export class EquipmentComponent extends EntityComponent {
    private _mainItem: InventoryItem | null = null;
    private _otherItem: InventoryItem | null = null;

    public get mainItem(): InventoryItem | null {
        return this._mainItem;
    }

    public set mainItem(v: InventoryItem | null) {
        // TODO: Drop current item when a new one is set
        this._mainItem = v;
    }

    public get otherItem(): InventoryItem | null {
        return this._otherItem;
    }

    public set otherItem(v: InventoryItem | null) {
        this._otherItem = v;
    }
}
