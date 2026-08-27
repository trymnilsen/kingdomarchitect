import { spriteRefs } from "../../../asset/sprite.ts";
import { torchLightSource } from "../../light/lightSourceDefinition.ts";
import { ItemCategory, ItemRarity, ItemTag } from "./../inventoryItem.ts";

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

/**
 * A torch carried in the hand. The `light` field makes it equippable and makes
 * its holder emit {@link torchLightSource} while it sits in a slot. It is not
 * skill gear: it teaches nothing and modifies no stat, it just burns.
 */
export const torchItem = {
    asset: spriteRefs.torches,
    id: "torch",
    name: "Torch",
    hint: "A bundle of straw and pitch on a stick. Burns while you carry it.",
    light: torchLightSource.id,
    // Placeholder in-hand art. `torches` is a 16x16 building icon where
    // character-held sprites are 8x16, so it draws about twice the width of a
    // held sword, and it is an 8-frame fire animation drawn as a static frame
    // 0. Both go away with proper character-scale art.
    visual: { sprite: spriteRefs.torches, offset: { x: 8, y: 8 } },
    rarity: ItemRarity.Common,
} as const;

/**
 * The first weapon a kingdom can make for itself: shaped at the workshop from
 * wood alone, no smith and no ore. It is worse than the blacksmith's sword and
 * that is the point of it existing.
 */
export const woodenSwordItem = {
    asset: spriteRefs.sword_skill,
    id: "woodenSword",
    name: "Wooden Sword",
    hint: "Carved, not forged. It holds an edge for about one argument.",
    tag: [ItemTag.SkillGear],
    category: ItemCategory.Melee,
    statModifiers: { might: { flat: 1 } },
    visual: { sprite: spriteRefs.character_sword, offset: { x: 4, y: 8 } },
    rarity: ItemRarity.Common,
} as const;

export const equipmentItems = [
    swordItem,
    bowItem,
    wizardHat,
    hammerItem,
    torchItem,
    woodenSwordItem,
] as const;
