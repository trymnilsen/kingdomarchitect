import { spriteRefs } from "../../../asset/sprite.ts";
import {
    swordItem,
    wizardHat,
    hammerItem,
} from "../../inventory/items/equipment.ts";
import {
    woodResourceItem,
    stoneResource,
    ironOreItem,
} from "../../inventory/items/resources.ts";
import {
    ironBarsItem,
    charcoalItem,
    gearsItem,
    planksItem,
} from "../../inventory/items/processedMaterials.ts";
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

export const ironBarRecipe: CraftingRecipe = {
    id: "smelt_iron_bar",
    name: "Iron Bars",
    icon: spriteRefs.iron_bars,
    inputs: [
        { item: ironOreItem, amount: 2 },
        { item: charcoalItem, amount: 1 },
    ],
    outputs: [{ item: ironBarsItem, amount: 1 }],
    duration: 5,
};

/**
 * Iron teeth set in a wooden hub. Machinery is the one thing a kingdom cannot
 * fake with raw material, so gears are what stand between piled stone and a
 * mill that actually turns.
 */
export const gearsRecipe: CraftingRecipe = {
    id: "craft_gears",
    name: "Gears",
    icon: spriteRefs.stone_resource,
    inputs: [
        { item: ironBarsItem, amount: 2 },
        { item: planksItem, amount: 2 },
    ],
    outputs: [{ item: gearsItem, amount: 2 }],
    duration: 6,
};

export const blacksmithRecipes: readonly CraftingRecipe[] = [
    swordRecipe,
    wizardHatRecipe,
    hammerRecipe,
    ironBarRecipe,
    gearsRecipe,
] as const;
