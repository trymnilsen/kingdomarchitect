import type { InventoryItem } from "../../data/inventory/inventoryItem.ts";

export type EquipmentComponent = {
    id: typeof EquipmentComponentId;
    slots: {
        primary: InventoryItem | null;
        secondary: InventoryItem | null;
    };
};

// Derived from the component so a new slot reaches every caller
export type EquipmentSlot = keyof EquipmentComponent["slots"];

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
