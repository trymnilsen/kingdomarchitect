import { InventoryItem } from "../../../data/inventory/inventoryItem.js";
import { EntityComponent } from "../entityComponent.js";

type EquipmentBundle = {
    mainItem: InventoryItem | null;
    otherItem: InventoryItem | null;
}

export class EquipmentComponent extends EntityComponent<EquipmentBundle> {
    private _mainItem: InventoryItem | null = null;
    private _otherItem: InventoryItem | null = null;

    get mainItem(): InventoryItem | null {
        return this._mainItem;
    }

    set mainItem(v: InventoryItem | null) {
        // TODO: Drop current item when a new one is set
        this._mainItem = v;
    }

    get otherItem(): InventoryItem | null {
        return this._otherItem;
    }

    set otherItem(v: InventoryItem | null) {
        this._otherItem = v;
    }

    override fromComponentBundle(bundle: EquipmentBundle): void {
        this._mainItem = bundle.mainItem;
        this._otherItem = bundle.otherItem;
    }
    override toComponentBundle(): EquipmentBundle {
        return {
            mainItem: this._mainItem,
            otherItem: this._otherItem,
        };
    }
}
