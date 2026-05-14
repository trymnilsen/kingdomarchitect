import type { EquipmentComponent } from "../../../game/component/equipmentComponent.ts";
import type { Entity } from "../../../game/entity/entity.ts";

type SlotType = keyof EquipmentComponent["slots"];

/**
 * Move an item out of an equipment slot into the worker's held slot.
 * Instant — no movement required. Fails if held is occupied (caller
 * needs to drop held first).
 */
export type UnequipItemCommand = {
    id: typeof UnequipItemCommandId;
    entity: string;
    slot: SlotType;
};

export function UnequipItemCommand(
    entity: Entity,
    slot: SlotType,
): UnequipItemCommand {
    return {
        id: UnequipItemCommandId,
        entity: entity.id,
        slot,
    };
}

export const UnequipItemCommandId = "unequipItem";
