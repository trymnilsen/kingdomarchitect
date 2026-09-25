import type { Point } from "../../../../../../common/point.ts";
import {
    getTerrainAt,
    TileComponentId,
} from "../../../../../component/tileComponent.ts";
import type { Entity } from "../../../../../entity/entity.ts";
import {
    isBuildableTerrain,
    terrainDefinitions,
} from "../../../../../map/terrain.ts";
import type { BuildingApplicability } from "../buildingApplicability.ts";

export const landApplicability: BuildingApplicability = (
    point: Point,
    world: Entity,
) => {
    const tileComponent = world.requireEcsComponent(TileComponentId);
    const terrain = getTerrainAt(tileComponent, point);
    if (terrain === null) {
        return { isApplicable: false, reason: "No land" };
    }

    if (!isBuildableTerrain(terrain)) {
        return {
            isApplicable: false,
            reason: terrainDefinitions[terrain].name,
        };
    }
    return { isApplicable: true };
};

export function onLand(
    applicability: BuildingApplicability,
): BuildingApplicability {
    return (point: Point, world: Entity) => {
        const landResult = landApplicability(point, world);
        if (!landResult.isApplicable) {
            return landResult;
        }
        return applicability(point, world);
    };
}
