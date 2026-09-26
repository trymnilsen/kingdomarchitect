import type { EquipmentSlot } from "../../../game/component/equipmentComponent.ts";
import type { Entity } from "../../../game/entity/entity.ts";

/**
 * Issue an equip command. The worker walks to the source (a stockpile or
 * a ground pile), picks up one unit of the item, evicts the target slot
 * to the ground if occupied, then equips. Use UnequipItemCommand to unequip.
 */
export type EquipItemCommand = {
    id: typeof EquipItemCommandId;
    entity: string;
    sourceEntityId: string;
    itemId: string;
    slot: EquipmentSlot;
};

export function EquipItemCommand(
    entity: Entity,
    sourceEntityId: string,
    itemId: string,
    slot: EquipmentSlot,
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
