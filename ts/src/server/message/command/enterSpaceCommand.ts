import type { Entity } from "../../../game/entity/entity.js";

export type LoadSpaceCommand = {
    id: typeof LoadSpaceCommandId;
    entity: string;
};

export function LoadSpaceCommand(entity: Entity): LoadSpaceCommand {
    return {
        id: LoadSpaceCommandId,
        entity: entity.id,
    };
}

export const LoadSpaceCommandId = "loadSpace";
