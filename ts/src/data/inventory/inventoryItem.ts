import { Sprite2 } from "../../asset/sprite.js";

export type InventoryItem = {
    id: string;
    name: string;
    asset: Sprite2;
    hint?: string;
    tag?: ItemTag[];
    category?: ItemCategory;
};

export enum ItemTag {
    SkillGear,
}

export enum ItemCategory {
    Melee,
    Magic,
    Productivity,
    Ranged,
}
