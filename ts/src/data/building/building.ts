import { Sprite2 } from "../../asset/sprite";
import { Adjacency } from "../../common/adjacency";

export interface Building {
    icon: Sprite2;
    name: string;
    id: string;
    scale: 1 | 2;
    adjacencySprite?: (adjacentBuildings: Adjacency) => Sprite2;
}
