import type { SpriteRef } from "../../asset/sprite.ts";
import type { Point } from "../../common/point.ts";
import type { StatModifiers } from "../../game/stat/statType.ts";

export type InventoryItem = {
    readonly id: string;
    readonly name: string;
    readonly asset: SpriteRef;
    readonly hint?: string;
    readonly tag?: readonly ItemTag[];
    readonly category?: ItemCategory;
    readonly visual?: ItemVisual;
    readonly rarity?: ItemRarity;
    readonly statModifiers?: StatModifiers;
    /**
     * Names a LightSourceDefinition the holder emits while this item is
     * equipped. Resolved at read time by `resolveLightSource`, never written
     * into a component: an item grants light the same way it grants stats, as
     * a function of what is held rather than as state copied onto the holder.
     */
    readonly light?: string;
};

export type ItemVisual = {
    sprite: SpriteRef;
    offset: Point;
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
