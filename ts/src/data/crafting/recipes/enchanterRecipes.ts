import { spriteRefs } from "../../../asset/sprite.ts";
import {
    berryItem,
    goldCoins,
    greaterHealthPotion,
    healthPotion,
    mushroomFoodItem,
} from "../../inventory/items/resources.ts";
import type { CraftingRecipe } from "../craftingRecipe.ts";

export const healthPotionRecipe: CraftingRecipe = {
    id: "craft_health_potion",
    name: "Health Potion",
    icon: spriteRefs.health_potion,
    inputs: [
        { item: berryItem, amount: 3 },
        { item: mushroomFoodItem, amount: 1 },
    ],
    outputs: [{ item: healthPotion, amount: 2 }],
    duration: 5,
};

export const greaterHealthPotionRecipe: CraftingRecipe = {
    id: "craft_greater_health_potion",
    name: "Greater Health Potion",
    icon: spriteRefs.health_potion,
    inputs: [
        { item: healthPotion, amount: 1 },
        { item: goldCoins, amount: 2 },
    ],
    outputs: [{ item: greaterHealthPotion, amount: 1 }],
    duration: 5,
};

export const enchanterRecipes: readonly CraftingRecipe[] = [
    healthPotionRecipe,
    greaterHealthPotionRecipe,
] as const;
