import { sprites2 } from "../../asset/sprite.js";
import { wallAdjacency } from "./adjacency/wallAdjacency.js";
export const stoneBuildings = [
    {
        id: "stonewall",
        icon: sprites2.stone_wood_walls,
        name: "Stone wall",
        scale: 1,
        adjacencySprite: wallAdjacency
    },
    {
        id: "stonetower",
        icon: sprites2.building_tower,
        name: "Stone tower",
        scale: 2
    },
    {
        id: "blacksmith",
        icon: sprites2.building_blacksmith,
        name: "Blacksmith",
        scale: 2
    },
    {
        id: "cementary",
        icon: sprites2.building_tombstone,
        name: "Cemetary",
        scale: 2
    },
    {
        id: "quary",
        icon: sprites2.building_quarry,
        name: "Quary",
        scale: 2
    }
];
