import { sprites2 } from "../../../asset/sprite.ts";
import { ItemCategory, ItemTag } from "./../inventoryItem.ts";

export const swordItem = {
    asset: sprites2.sword_skill,
    id: "sword",
    name: "Sword",
    tag: [ItemTag.SkillGear],
    category: ItemCategory.Melee,
} as const;

export const bowItem = {
    asset: sprites2.archer_skill,
    id: "bow",
    name: "Bow",
    tag: [ItemTag.SkillGear],
    category: ItemCategory.Ranged,
} as const;

export const wizardHat = {
    asset: sprites2.wizard_hat_skill,
    id: "hat",
    name: "Wizard Hat",
    tag: [ItemTag.SkillGear],
    category: ItemCategory.Magic,
    visual: {
        sprite: sprites2.wizard_hat,
        offset: { x: 6, y: 10 },
    },
} as const;

export const hammerItem = {
    asset: sprites2.worker_skill,
    id: "hammer",
    name: "Hammer",
    tag: [ItemTag.SkillGear],
    category: ItemCategory.Productivity,
} as const;

export const equipmentItems = [
    swordItem,
    bowItem,
    wizardHat,
    hammerItem,
] as const;
