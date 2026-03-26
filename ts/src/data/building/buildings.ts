import type { Building } from "./building.ts";
import { wallAdjacency } from "./adjacency/wallAdjacency.ts";
import { foodBuildings } from "./food/food.ts";
import { goldBuildings } from "./gold/gold.ts";
import { growBuildings } from "./grow/grow.ts";
import { stoneBuildings } from "./stone/stone.ts";
import { stoneWall } from "./stone/wall.ts";
import { woodenBuildings } from "./wood/wood.ts";
import { goblinBuildings } from "./goblin/goblin.ts";

export const buildings = [
    ...foodBuildings,
    ...goldBuildings,
    ...growBuildings,
    ...stoneBuildings,
    ...woodenBuildings,
    ...goblinBuildings,
] as const satisfies Building[];

export type BuildingIds = (typeof buildings)[number]["id"];

export function getBuildingById(id: string): Building | undefined {
    return buildings.find((building) => building.id === id);
}

export const buildingAdjecency = {
    [stoneWall.id]: wallAdjacency,
};
