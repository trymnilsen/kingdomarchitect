import type { InventoryItem } from "../inventory/inventoryItem.ts";
import type { SpriteRef } from "../../asset/sprite.ts";

export type CraftingRecipeInput = {
    item: InventoryItem;
    amount: number;
};

export type CraftingRecipeOutput = {
    item: InventoryItem;
    amount: number;
};

export type CraftingRecipe = {
    id: string;
    name: string;
    icon: SpriteRef;
    inputs: readonly CraftingRecipeInput[];
    outputs: readonly CraftingRecipeOutput[];
    /** Duration in ticks to complete crafting */
    duration: number;
};
