import { sprites2 } from "../../../asset/sprite.js";
import { wallAdjacency } from "../adjacency/wallAdjacency.js";

export const stoneWall = {
    id: "stonewall",
    icon: sprites2.stone_wood_walls,
    name: "Stone wall",
    scale: 1,
    adjacencySprite: wallAdjacency,
} as const;
