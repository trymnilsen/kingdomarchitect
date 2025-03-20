import { sprites2 } from "../../../module/asset/sprite.js";
import { wallAdjacency } from "./../adjacency/wallAdjacency.js";
import { blacksmith } from "./blacksmith.js";
import { Building } from "./../building.js";
import { cementary } from "./cementary.js";
import { gate } from "./gate.js";
import { quary } from "./quary.js";
import { stoneTower } from "./tower.js";
import { stoneWall } from "./wall.js";

export const stoneBuildings = [
    stoneWall,
    stoneTower,
    blacksmith,
    quary,
    cementary,
    gate,
];
