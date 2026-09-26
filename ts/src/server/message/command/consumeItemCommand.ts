import type { EquipmentSlot } from "../../../game/component/equipmentComponent.ts";
import type { Entity } from "../../../game/entity/entity.ts";

export type ConsumeItemCommand = {
    id: typeof ConsumeItemCommandId;
    slot: EquipmentSlot;
    entity: string;
};

export function ConsumeItemCommand(
    slot: EquipmentSlot,
    entity: Entity,
): ConsumeItemCommand {
    return {
        id: ConsumeItemCommandId,
        slot,
        entity: entity.id,
    };
}

export const ConsumeItemCommandId = "consumeItem";
