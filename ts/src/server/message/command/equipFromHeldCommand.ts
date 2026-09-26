import type { EquipmentSlot } from "../../../game/component/equipmentComponent.ts";
import type { Entity } from "../../../game/entity/entity.ts";

/**
 * Equip the worker's currently-held item into a slot. Routed through the
 * playerCommand pipeline because evicting an occupied slot may require
 * walking to a drop position (multi-step).
 */
export type EquipFromHeldCommand = {
    id: typeof EquipFromHeldCommandId;
    entity: string;
    slot: EquipmentSlot;
};

export function EquipFromHeldCommand(
    entity: Entity,
    slot: EquipmentSlot,
): EquipFromHeldCommand {
    return {
        id: EquipFromHeldCommandId,
        entity: entity.id,
        slot,
    };
}

export const EquipFromHeldCommandId = "equipFromHeld";
