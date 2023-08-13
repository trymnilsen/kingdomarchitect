import { foodBuildings } from "./food.js";
import { goldBuildings } from "./gold.js";
import { stoneBuildings } from "./stone.js";
import { woodenBuildings } from "./wood.js";

export const buildings = [
    ...foodBuildings,
    ...goldBuildings,
    ...stoneBuildings,
    ...woodenBuildings,
];
