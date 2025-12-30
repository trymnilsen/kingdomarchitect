import type { Sprite2 } from "../../asset/sprite.ts";
import type { Point } from "../../common/point.ts";

export type InventoryItem = {
    readonly id: string;
    readonly name: string;
    readonly asset: Sprite2;
    readonly hint?: string;
    readonly tag?: readonly ItemTag[];
    readonly category?: ItemCategory;
    readonly visual?: ItemVisual;
};

export type ItemVisual = {
    sprite: Sprite2;
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
