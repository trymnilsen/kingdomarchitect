import type { InventoryItem } from "../../../data/inventory/inventoryItem.js";
import type { EquipmentComponent } from "../../../game/component/equipmentComponent.js";
import type { Entity } from "../../../game/entity/entity.js";

type SlotType = keyof EquipmentComponent["slots"];

export type EquipItemCommand = {
    id: typeof EquipItemCommandId;
    itemId: string | null;
    slot: SlotType;
    entity: string;
};

export function EquipItemCommand(
    item: InventoryItem | null,
    entity: Entity,
    slot: SlotType,
): EquipItemCommand {
    return {
        id: EquipItemCommandId,
        itemId: item?.id ?? null,
        entity: entity.id,
        slot: slot,
    };
}

export const EquipItemCommandId = "equipItem";
