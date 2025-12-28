import { sprites2 } from "../../../asset/sprite.js";
import {
    swordItem,
    bowItem,
    wizardHat,
    hammerItem,
} from "../../inventory/items/equipment.js";
import {
    woodResourceItem,
    stoneResource,
} from "../../inventory/items/resources.js";
import type { CraftingRecipe } from "../craftingRecipe.js";

export const swordRecipe: CraftingRecipe = {
    id: "craft_sword",
    name: "Sword",
    icon: sprites2.sword_skill,
    inputs: [
        { item: woodResourceItem, amount: 5 },
        { item: stoneResource, amount: 10 },
    ],
    outputs: [{ item: swordItem, amount: 1 }],
    duration: 100, // 100 ticks ~= 20 seconds at 5 ticks/second
};

export const bowRecipe: CraftingRecipe = {
    id: "craft_bow",
    name: "Bow",
    icon: sprites2.archer_skill,
    inputs: [{ item: woodResourceItem, amount: 15 }],
    outputs: [{ item: bowItem, amount: 1 }],
    duration: 80,
};

export const wizardHatRecipe: CraftingRecipe = {
    id: "craft_wizard_hat",
    name: "Wizard Hat",
    icon: sprites2.wizard_hat_skill,
    inputs: [{ item: woodResourceItem, amount: 10 }],
    outputs: [{ item: wizardHat, amount: 1 }],
    duration: 120,
};

export const hammerRecipe: CraftingRecipe = {
    id: "craft_hammer",
    name: "Hammer",
    icon: sprites2.worker_skill,
    inputs: [
        { item: woodResourceItem, amount: 8 },
        { item: stoneResource, amount: 5 },
    ],
    outputs: [{ item: hammerItem, amount: 1 }],
    duration: 60,
};

export const blacksmithRecipes: readonly CraftingRecipe[] = [
    swordRecipe,
    bowRecipe,
    wizardHatRecipe,
    hammerRecipe,
] as const;
