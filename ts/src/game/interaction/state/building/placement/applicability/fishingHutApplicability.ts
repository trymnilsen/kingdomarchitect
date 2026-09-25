import { adjacentPoints, type Point } from "../../../../../../common/point.ts";
import {
    getTerrainAt,
    TileComponentId,
} from "../../../../../component/tileComponent.ts";
import type { Entity } from "../../../../../entity/entity.ts";
import { Terrain } from "../../../../../map/terrain.ts";
import type { BuildingApplicability } from "../buildingApplicability.ts";

export const fishingHutApplicability: BuildingApplicability = (
    point: Point,
    world: Entity,
) => {
    const tileComponent = world.requireEcsComponent(TileComponentId);
    if (getTerrainAt(tileComponent, point) !== Terrain.Water) {
        return {
            isApplicable: false,
            reason: "Needs to be built on water",
        };
    }

    const hasShore = adjacentPoints(point).some(
        (neighbour) => getTerrainAt(tileComponent, neighbour) === Terrain.Land,
    );
    if (!hasShore) {
        return {
            isApplicable: false,
            reason: "Needs to be next to land",
        };
    }
    return { isApplicable: true };
};
