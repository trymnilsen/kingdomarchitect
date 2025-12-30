import type { GameCommand } from "../gameCommand.ts";

export type StartCraftingCommand = {
    id: typeof StartCraftingCommandId;
    /** Entity ID of the building to start crafting */
    entityId: string;
    /** ID of the recipe to craft */
    recipeId: string;
};

export function StartCraftingCommand(
    entityId: string,
    recipeId: string,
): StartCraftingCommand {
    return {
        id: StartCraftingCommandId,
        entityId,
        recipeId,
    };
}

export const StartCraftingCommandId = "StartCrafting";
