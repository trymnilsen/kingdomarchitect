import { spriteRefs } from "../../../asset/sprite.ts";
import { ItemCategory, ItemTag } from "./../inventoryItem.ts";

export const swordItem = {
    asset: spriteRefs.sword_skill,
    id: "sword",
    name: "Sword",
    tag: [ItemTag.SkillGear],
    category: ItemCategory.Melee,
} as const;

export const bowItem = {
    asset: spriteRefs.archer_skill,
    id: "bow",
    name: "Bow",
    tag: [ItemTag.SkillGear],
    category: ItemCategory.Ranged,
} as const;

export const wizardHat = {
    asset: spriteRefs.wizard_hat_skill,
    id: "hat",
    name: "Wizard Hat",
    hint:
        "A tall, pointed hat of deeply suspicious provenance. The guild insists " +
        "it merely 'focuses the mind', though the previous owner focused his " +
        "mind so hard he is now a small decorative pond behind the carpenter's " +
        "hut.\n\n" +
        "The brim is stitched with stars that are, on close inspection, slightly " +
        "in the wrong constellations — a known side effect of buying enchanted " +
        "millinery from a man whose cart has no wheels and no horse and is, in " +
        "fact, also a hat.\n\n" +
        "Wearing it grants no measurable magical power, but everyone in town " +
        "will now address you as 'the wizard' and quietly stop asking why the " +
        "well tastes of cinnamon. This is, by local standards, a promotion.\n\n" +
        "Care instructions: do not wear in lightning, do not wear in libraries, " +
        "and under no circumstances allow the cat to wear it. We do not speak of " +
        "the cat. The cat speaks of us.\n\n" +
        "Warranty void if the hat begins offering opinions, makes long-term " +
        "plans, or files for tenure.",
    tag: [ItemTag.SkillGear],
    category: ItemCategory.Magic,
} as const;

export const hammerItem = {
    asset: spriteRefs.worker_skill,
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
