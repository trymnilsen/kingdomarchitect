import type { InventoryItem } from "../../data/inventory/inventoryItem.js";

export type EquipmentComponent = {
    id: typeof EquipmentComponentId;
    slots: {
        main: InventoryItem | null;
        other: InventoryItem | null;
    };
};

export function createEquipmentComponent(): EquipmentComponent {
    return {
        id: EquipmentComponentId,
        slots: {
            main: null,
            other: null,
        },
    };
}

export const EquipmentComponentId = "equipment";
