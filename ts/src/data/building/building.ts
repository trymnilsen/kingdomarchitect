import { Sprite2 } from "../../asset/sprite.js";
import { Adjacency } from "../../common/adjacency.js";

export interface Building {
    icon: Sprite2;
    name: string;
    id: string;
    scale: 1 | 2;
    adjacencySprite?: (adjacentBuildings: Adjacency) => Sprite2;
}
