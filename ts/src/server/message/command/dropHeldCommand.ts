import type { Entity } from "../../../game/entity/entity.ts";

export type DropHeldCommand = {
    id: typeof DropHeldCommandId;
    entity: string;
};

export function DropHeldCommand(entity: Entity): DropHeldCommand {
    return {
        id: DropHeldCommandId,
        entity: entity.id,
    };
}

export const DropHeldCommandId = "dropHeld";
