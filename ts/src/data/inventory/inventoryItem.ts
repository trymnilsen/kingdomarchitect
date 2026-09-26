import type { SpriteRef } from "../../asset/sprite.ts";
import type { StatModifiers } from "../../game/stat/statType.ts";
import type { EquipmentSpriteVariant } from "../../rendering/character/characterColors.ts";

export type InventoryItem = {
    readonly id: string;
    readonly name: string;
    readonly asset: SpriteRef;
    readonly hint?: string;
    readonly tag?: readonly ItemTag[];
    readonly category?: ItemCategory;
    readonly visual?: EquipmentSpriteVariant;
    readonly rarity?: ItemRarity;
    readonly statModifiers?: StatModifiers;
    /**
     * Names a LightSourceDefinition the holder emits while this is equipped.
     * Resolved at read time by `resolveLightSource` rather than copied onto
     * the holder, the same way stats are.
     */
    readonly light?: string;
    readonly attack?: string;
    readonly fishing?: string;
};

export const ItemTag = {
    SkillGear: 0,
    Consumable: 1,
    Food: 2,
} as const;

export type ItemTag = (typeof ItemTag)[keyof typeof ItemTag];

export const ItemCategory = {
    Melee: 0,
    Magic: 1,
    Productivity: 2,
    Ranged: 3,
} as const;

export type ItemCategory = (typeof ItemCategory)[keyof typeof ItemCategory];

export const ItemRarity = {
    Common: 0,
    Uncommon: 1,
    Rare: 2,
    Epic: 3,
    Legendary: 4,
} as const;

export type ItemRarity = (typeof ItemRarity)[keyof typeof ItemRarity];
