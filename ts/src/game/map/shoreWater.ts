import { adjacentPoints, type Point } from "../../common/point.ts";
import {
    getTerrainAt,
    type TileComponent,
} from "../component/tileComponent.ts";
import { Terrain } from "./terrain.ts";

// Cardinal neighbours only, since that is the adjacency a worker needs to reach it
export function isShoreWater(
    tileComponent: TileComponent,
    point: Point,
): boolean {
    if (getTerrainAt(tileComponent, point) !== Terrain.Water) {
        return false;
    }
    return adjacentPoints(point).some(
        (neighbour) => getTerrainAt(tileComponent, neighbour) === Terrain.Land,
    );
}
