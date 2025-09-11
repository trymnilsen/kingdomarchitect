import { Sprite2, emptySprite } from "../../asset/sprite.js";
import { InventoryItemIds } from "../inventory/inventoryItems.js";

export type Building = {
    icon: Sprite2;
    name: string;
    id: string;
    scale: 1 | 2 | 4;
    resources?: { [key in InventoryItemIds]?: number };
};

export const nullBuildingId = "nullBuilding";
export const nullBuilding: Building = {
    icon: emptySprite,
    name: nullBuildingId,
    id: nullBuildingId,
    scale: 1,
};
