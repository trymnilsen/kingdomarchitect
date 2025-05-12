import type { InventoryItem } from "../../data/inventory/inventoryItem.js";

export type EquipmentComponent = {
    id: typeof EquipmentComponentId;
    mainItem?: InventoryItem;
    offhandItem?: InventoryItem;
};

export function createEquipmentComponent(): EquipmentComponent {
    return {
        id: EquipmentComponentId,
        mainItem: undefined,
        offhandItem: undefined,
    };
}

export const EquipmentComponentId = "equipment";
