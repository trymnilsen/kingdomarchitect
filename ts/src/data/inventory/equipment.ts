import { sprites2 } from "../../asset/sprite";
import { InventoryItem, ItemTag } from "./inventoryItem";

export const swordItem: InventoryItem = {
    asset: sprites2.sword_skill,
    id: "sword",
    name: "Sword",
    tag: [ItemTag.SkillGear],
};

export const hammerItem: InventoryItem = {
    asset: sprites2.worker_skill,
    id: "hammer",
    name: "Hammer",
    tag: [ItemTag.SkillGear],
};
