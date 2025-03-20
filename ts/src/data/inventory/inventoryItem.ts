import { Sprite2 } from "../../module/asset/sprite.js";

export type InventoryItem = {
    readonly id: string;
    readonly name: string;
    readonly asset: Sprite2;
    readonly hint?: string;
    readonly tag?: readonly ItemTag[];
    readonly category?: ItemCategory;
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
