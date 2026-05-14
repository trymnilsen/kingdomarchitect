import type { EquipmentComponent } from "../../../game/component/equipmentComponent.ts";
import type { Entity } from "../../../game/entity/entity.ts";

type SlotType = keyof EquipmentComponent["slots"];

/**
 * Issue an equip command. The worker walks to the source (a stockpile or
 * a ground pile), picks up one unit of the item, evicts the target slot
 * to the ground if occupied, then equips. Use UnequipItemCommand to
 * unequip — the null-itemId path no longer exists.
 */
export type EquipItemCommand = {
    id: typeof EquipItemCommandId;
    entity: string;
    sourceEntityId: string;
    itemId: string;
    slot: SlotType;
};

export function EquipItemCommand(
    entity: Entity,
    sourceEntityId: string,
    itemId: string,
    slot: SlotType,
): EquipItemCommand {
    return {
        id: EquipItemCommandId,
        entity: entity.id,
        sourceEntityId,
        itemId,
        slot,
    };
}

export const EquipItemCommandId = "equipItem";
