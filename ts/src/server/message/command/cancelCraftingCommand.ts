import type { GameCommand } from "../gameCommand.ts";

export type CancelCraftingCommand = {
    id: typeof CancelCraftingCommandId;
    /** Entity ID of the building to cancel crafting */
    entityId: string;
};

export function CancelCraftingCommand(entityId: string): CancelCraftingCommand {
    return {
        id: CancelCraftingCommandId,
        entityId,
    };
}

export const CancelCraftingCommandId = "CancelCrafting";
