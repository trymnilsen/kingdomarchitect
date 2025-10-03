import type { EquipmentComponent } from "../../../game/component/equipmentComponent.js";
import type { Entity } from "../../../game/entity/entity.js";

type SlotType = keyof EquipmentComponent["slots"];

export type ConsumeItemCommand = {
    id: typeof ConsumeItemCommandId;
    slot: SlotType;
    entity: string;
};

export function ConsumeItemCommand(
    slot: SlotType,
    entity: Entity,
): ConsumeItemCommand {
    return {
        id: ConsumeItemCommandId,
        slot,
        entity: entity.id,
    };
}

export const ConsumeItemCommandId = "consumeItem";
