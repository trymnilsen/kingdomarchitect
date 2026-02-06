import { spriteRefs } from "../../../asset/sprite.ts";
import {
    swordItem,
    bowItem,
    wizardHat,
    hammerItem,
} from "../../inventory/items/equipment.ts";
import {
    woodResourceItem,
    stoneResource,
} from "../../inventory/items/resources.ts";
import type { CraftingRecipe } from "../craftingRecipe.ts";

export const swordRecipe: CraftingRecipe = {
    id: "craft_sword",
    name: "Sword",
    icon: spriteRefs.sword_skill,
    inputs: [
        { item: woodResourceItem, amount: 5 },
        { item: stoneResource, amount: 10 },
    ],
    outputs: [{ item: swordItem, amount: 1 }],
    duration: 5, // 5 seconds at 1 tick/second
};

export const bowRecipe: CraftingRecipe = {
    id: "craft_bow",
    name: "Bow",
    icon: spriteRefs.archer_skill,
    inputs: [{ item: woodResourceItem, amount: 15 }],
    outputs: [{ item: bowItem, amount: 1 }],
    duration: 4, // 4 seconds
};

export const wizardHatRecipe: CraftingRecipe = {
    id: "craft_wizard_hat",
    name: "Wizard Hat",
    icon: spriteRefs.wizard_hat_skill,
    inputs: [{ item: woodResourceItem, amount: 10 }],
    outputs: [{ item: wizardHat, amount: 1 }],
    duration: 6, // 6 seconds - complex item
};

export const hammerRecipe: CraftingRecipe = {
    id: "craft_hammer",
    name: "Hammer",
    icon: spriteRefs.worker_skill,
    inputs: [
        { item: woodResourceItem, amount: 8 },
        { item: stoneResource, amount: 5 },
    ],
    outputs: [{ item: hammerItem, amount: 1 }],
    duration: 3, // 3 seconds - simple tool
};

export const blacksmithRecipes: readonly CraftingRecipe[] = [
    swordRecipe,
    bowRecipe,
    wizardHatRecipe,
    hammerRecipe,
] as const;
