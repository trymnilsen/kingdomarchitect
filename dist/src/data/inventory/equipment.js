import { sprites2 } from "../../asset/sprite.js";
import { ItemCategory, ItemTag } from "./inventoryItem.js";
export const swordItem = {
    asset: sprites2.sword_skill,
    id: "sword",
    name: "Sword",
    tag: [
        ItemTag.SkillGear
    ],
    category: ItemCategory.Melee
};
export const bowItem = {
    asset: sprites2.archer_skill,
    id: "bow",
    name: "Bow",
    tag: [
        ItemTag.SkillGear
    ],
    category: ItemCategory.Ranged
};
export const wizardHat = {
    asset: sprites2.wizard_hat_skill,
    id: "hat",
    name: "Wizard Hat",
    tag: [
        ItemTag.SkillGear
    ],
    category: ItemCategory.Magic
};
export const hammerItem = {
    asset: sprites2.worker_skill,
    id: "hammer",
    name: "Hammer",
    tag: [
        ItemTag.SkillGear
    ],
    category: ItemCategory.Productivity
};
