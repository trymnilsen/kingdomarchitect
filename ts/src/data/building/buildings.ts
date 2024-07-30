import { Building } from "./building.js";
import { foodBuildings } from "./food/food.js";
import { goldBuildings } from "./gold/gold.js";
import { stoneBuildings } from "./stone/stone.js";
import { woodenBuildings } from "./wood/wood.js";

export const buildings = [
    ...foodBuildings,
    ...goldBuildings,
    ...stoneBuildings,
    ...woodenBuildings,
] as const;

export type BuildingIds = (typeof buildings)[number]["id"];

export function getBuildingById(id: string): Building | undefined {
    return buildings.find((building) => building.id === id);
}
