import type { InventoryItem } from "../../data/inventory/inventoryItem.ts";

export type EquipmentComponent = {
    id: typeof EquipmentComponentId;
    slots: {
        primary: InventoryItem | null;
        secondary: InventoryItem | null;
    };
};

export function createEquipmentComponent(): EquipmentComponent {
    return {
        id: EquipmentComponentId,
        slots: {
            primary: null,
            secondary: null,
        },
    };
}

export const EquipmentComponentId = "equipment";
