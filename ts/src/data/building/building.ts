import { Sprite2, emptySprite } from "../../asset/sprite.js";
import { Adjacency } from "../../common/adjacency.js";

export interface Building {
    icon: Sprite2;
    name: string;
    id: string;
    scale: 1 | 2;
    adjacencySprite?: (adjacentBuildings: Adjacency) => Sprite2;
}

export const nullBuildingId = "nullBuilding";
export const nullBuilding: Building = {
    icon: emptySprite,
    name: nullBuildingId,
    id: nullBuildingId,
    scale: 1,
};
