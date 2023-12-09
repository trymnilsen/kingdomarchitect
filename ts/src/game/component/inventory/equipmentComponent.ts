import { BoundMethod } from "../../../../util/boundDecorator.js";
import {
    InventoryItem,
    ItemTag,
} from "../../../data/inventory/inventoryItem.js";
import { EntityComponent } from "../entityComponent.js";
import { InventoryComponent } from "./inventoryComponent.js";

export class EquipmentComponent extends EntityComponent<EquipmentBundle> {
    private _mainItem: InternalEquipmentSlot;
    private _otherItem: InternalEquipmentSlot;

    get mainItem(): EquipmentSlot {
        return this._mainItem;
    }

    get otherItem(): EquipmentSlot {
        return this._otherItem;
    }

    constructor() {
        super();

        this._mainItem = new InternalEquipmentSlot(
            [ItemTag.SkillGear],
            this.removeCurrentlyEquipedItemIfNeeded,
        );
        this._otherItem = new InternalEquipmentSlot(
            [ItemTag.Consumable],
            this.removeCurrentlyEquipedItemIfNeeded,
        );
    }

    override fromComponentBundle(bundle: EquipmentBundle): void {
        this._mainItem.setItemWithoutCallback(bundle.mainItem);
        this._otherItem.setItemWithoutCallback(bundle.otherItem);
    }

    override toComponentBundle(): EquipmentBundle {
        return {
            mainItem: this._mainItem.getItem(),
            otherItem: this._otherItem.getItem(),
        };
    }

    private removeCurrentlyEquipedItemIfNeeded = (
        previousItem: EquipmentSlotItem,
        _newItem: EquipmentSlotItem,
    ) => {
        if (!!previousItem) {
            //Return the item to the inventory
            const inventoryComponent =
                this.entity.getAncestorComponent(InventoryComponent);

            inventoryComponent?.addInventoryItem(previousItem, 1);
        }
    };
}

export interface EquipmentSlot {
    setItem(items: EquipmentSlotItem);
    getItem(): EquipmentSlotItem;
    applicableItemTags(): ItemTag[];
}

export type EquipmentSlotItem = InventoryItem | null;

type EquipmentBundle = {
    mainItem: EquipmentSlotItem;
    otherItem: EquipmentSlotItem;
};

class InternalEquipmentSlot implements EquipmentSlot {
    private _value: EquipmentSlotItem = null;

    constructor(
        private itemTags: ItemTag[],
        private setCallback: (
            previousItem: EquipmentSlotItem,
            newItem: EquipmentSlotItem,
        ) => void,
    ) {}

    setItemWithoutCallback(item: EquipmentSlotItem) {
        this._value = item;
    }

    setItem(item: EquipmentSlotItem) {
        this.setCallback(this._value, item);
        this._value = item;
    }

    getItem(): EquipmentSlotItem {
        return this._value;
    }

    applicableItemTags(): ItemTag[] {
        return this.itemTags;
    }
}
