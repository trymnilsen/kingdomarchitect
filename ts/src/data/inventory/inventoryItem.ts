import { Sprite2 } from "../../asset/sprite.js";
import type { Point } from "../../common/point.js";

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

export enum ItemTag {
    SkillGear,
    Consumable,
}

export enum ItemCategory {
    Melee,
    Magic,
    Productivity,
    Ranged,
}
