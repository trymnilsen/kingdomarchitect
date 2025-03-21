import { Sprite2, emptySprite } from "../../module/asset/sprite.js";
import { Adjacency } from "../../common/adjacency.js";
import { InventoryItemIds } from "../inventory/inventoryItems.js";

export type Building = {
    icon: Sprite2;
    name: string;
    id: string;
    scale: 1 | 2 | 4;
    adjacencySprite?: (adjacentBuildings: Adjacency) => Sprite2;
    resources?: { [key in InventoryItemIds]?: number };
};

export const nullBuildingId = "nullBuilding";
export const nullBuilding: Building = {
    icon: emptySprite,
    name: nullBuildingId,
    id: nullBuildingId,
    scale: 1,
};
