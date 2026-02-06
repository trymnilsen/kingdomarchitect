import type { SpriteRef } from "../../asset/sprite.ts";
import type { Point } from "../../common/point.ts";

export type InventoryItem = {
    readonly id: string;
    readonly name: string;
    readonly asset: SpriteRef;
    readonly hint?: string;
    readonly tag?: readonly ItemTag[];
    readonly category?: ItemCategory;
    readonly visual?: ItemVisual;
    readonly rarity?: ItemRarity;
};

export type ItemVisual = {
    sprite: SpriteRef;
    offset: Point;
};

export const ItemTag = {
    SkillGear: 0,
    Consumable: 1,
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
