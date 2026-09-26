import type { EquipmentSlot } from "../../../game/component/equipmentComponent.ts";
import type { Entity } from "../../../game/entity/entity.ts";

/**
 * Move an item out of an equipment slot into the worker's held slot.
 * Instant, no movement required. Fails if held is occupied (caller
 * needs to drop held first).
 */
export type UnequipItemCommand = {
    id: typeof UnequipItemCommandId;
    entity: string;
    slot: EquipmentSlot;
};

export function UnequipItemCommand(
    entity: Entity,
    slot: EquipmentSlot,
): UnequipItemCommand {
    return {
        id: UnequipItemCommandId,
        entity: entity.id,
        slot,
    };
}

export const UnequipItemCommandId = "unequipItem";
