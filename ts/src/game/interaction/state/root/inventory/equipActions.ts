import {
    InventoryItem,
    ItemTag,
} from "../../../../../data/inventory/inventoryItem.js";
import {
    EquipmentComponent,
    EquipmentSlot,
} from "../../../../component/inventory/equipmentComponent.js";
import { InventoryComponent2 } from "../../../../component/inventory/inventoryComponent.js";
import { Entity } from "../../../../entity/entity.js";
import { StateContext } from "../../../handler/stateContext.js";
import { EquipItemConfirmState } from "./equipItemConfirmState.js";
import { InventoryEquipAction } from "./inventoryState.js";

export class ConfirmEquipAction implements InventoryEquipAction {
    isApplicable(item: InventoryItem): boolean {
        return item.tag?.some((tag) => tag === ItemTag.SkillGear) || false;
    }

    onEquip(item: InventoryItem, stateContext: StateContext) {
        stateContext.stateChanger.push(new EquipItemConfirmState(item));
    }
}

export class EquipOnActorAction implements InventoryEquipAction {
    constructor(
        private entity: Entity,
        private equipmentSlot: EquipmentSlot,
    ) {}

    isApplicable(item: InventoryItem): boolean {
        const applicableItemTags = this.equipmentSlot.applicableItemTags();
        return (
            item.tag?.some((selectedItemTag) =>
                applicableItemTags.some(
                    (equipmentSlotItemTag) =>
                        selectedItemTag === equipmentSlotItemTag,
                ),
            ) || false
        );
    }

    onEquip(item: InventoryItem, stateContext: StateContext) {
        const inventoryComponent =
            this.entity.getComponent(InventoryComponent2);

        inventoryComponent?.removeInventoryItem(item.id, 1);
        this.equipmentSlot.setItem(item);
        stateContext.stateChanger.pop(null);
    }
}
