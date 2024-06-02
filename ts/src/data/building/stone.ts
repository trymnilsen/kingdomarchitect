import { sprites2 } from "../../asset/sprite.js";
import { wallAdjacency } from "./adjacency/wallAdjacency.js";
import { Building } from "./building.js";

export const stoneBuildings: Building[] = [
    {
        id: "stonewall",
        icon: sprites2.stone_wood_walls,
        name: "Stone wall",
        scale: 1,
        adjacencySprite: wallAdjacency,
    },
    {
        id: "gate",
        icon: sprites2.gate_horizontal_preview,
        name: "Gate",
        scale: 4,
    },
    {
        id: "stonetower",
        icon: sprites2.building_tower,
        name: "Stone tower",
        scale: 2,
    },
    {
        id: "blacksmith",
        icon: sprites2.building_blacksmith,
        name: "Blacksmith",
        scale: 2,
    },
    {
        id: "cementary",
        icon: sprites2.building_tombstone,
        name: "Cemetary",
        scale: 2,
    },
    {
        id: "quary",
        icon: sprites2.building_quarry,
        name: "Quary",
        scale: 2,
    },
];
