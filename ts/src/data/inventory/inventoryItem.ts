import { Sprite2 } from "../../asset/sprite.js";

export type InventoryItem = {
    readonly id: string;
    readonly name: string;
    readonly asset: Sprite2;
    readonly hint?: string;
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
