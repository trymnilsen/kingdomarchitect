import { wallAdjacency } from "./adjacency/wallAdjacency.js";
import { Building } from "./building.js";
import { foodBuildings } from "./food/food.js";
import { goldBuildings } from "./gold/gold.js";
import { stoneBuildings } from "./stone/stone.js";
import { stoneWall } from "./stone/wall.js";
import { woodenBuildings } from "./wood/wood.js";

export const buildings = [
    ...foodBuildings,
    ...goldBuildings,
    ...stoneBuildings,
    ...woodenBuildings,
] as const satisfies Building[];

export type BuildingIds = (typeof buildings)[number]["id"];

export function getBuildingById(id: string): Building | undefined {
    return buildings.find((building) => building.id === id);
}

export const buildingAdjecency = {
    [stoneWall.id]: wallAdjacency,
};
