import { sprites2 } from "../../asset/sprite";
import { wallAdjacency } from "./adjacency/wallAdjacency";
import { Building } from "./building";

export const stoneBuildings: Building[] = [
    {
        icon: sprites2.stone_wood_walls,
        name: "Stone wall",
        scale: 1,
        adjacencySprite: wallAdjacency,
    },
    {
        icon: sprites2.building_tower,
        name: "Stone tower",
        scale: 2,
    },
    {
        icon: sprites2.building_blacksmith,
        name: "Blacksmith",
        scale: 2,
    },
    {
        icon: sprites2.building_tombstone,
        name: "Cemetary",
        scale: 2,
    },
    {
        icon: sprites2.building_quarry,
        name: "Quary",
        scale: 2,
    },
];
