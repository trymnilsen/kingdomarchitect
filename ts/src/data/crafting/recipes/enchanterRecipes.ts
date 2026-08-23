import { spriteRefs } from "../../../asset/sprite.ts";
import {
    berryItem,
    gemResource,
    goldCoins,
    greaterHealthPotion,
    healthPotion,
    manaPotion,
    moonpetalItem,
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

/**
 * Moonpetal steeped over a crushed gem. One half of it grows in the woods and
 * the other half has to be taken off a goblin, so mana is the point where the
 * peaceful and the violent side of the settlement meet.
 */
export const manaPotionRecipe: CraftingRecipe = {
    id: "craft_mana_potion",
    name: "Mana Potion",
    icon: spriteRefs.mana_potion,
    inputs: [
        { item: moonpetalItem, amount: 3 },
        { item: gemResource, amount: 1 },
    ],
    outputs: [{ item: manaPotion, amount: 2 }],
    duration: 6,
};

export const enchanterRecipes: readonly CraftingRecipe[] = [
    healthPotionRecipe,
    greaterHealthPotionRecipe,
    manaPotionRecipe,
] as const;
