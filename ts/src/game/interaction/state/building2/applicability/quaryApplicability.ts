import { adjacentPoints, Point } from "../../../../../common/point.js";
import { StoneComponent } from "../../../../componentOld/resource/stoneComponent.js";
import { SpatialChunkMapComponent } from "../../../../componentOld/world/spatialChunkMapComponent.js";
import { Entity } from "../../../../entity/entity.js";
import { BuildingApplicability } from "../buildingApplicability.js";

export const quaryApplicability: BuildingApplicability = (
    point: Point,
    world: Entity,
) => {
    const points = adjacentPoints(point);
    const hasAdjacent = points.some((adjacentPoint) => {
        const entities = world
            .requireComponent(SpatialChunkMapComponent)
            .getEntitiesAt(adjacentPoint.x, adjacentPoint.y);

        const entityContainsStone = entities.some(
            (entity) => !!entity.getComponent(StoneComponent),
        );

        return entityContainsStone;
    });

    if (hasAdjacent) {
        return {
            isApplicable: true,
        };
    } else {
        return {
            isApplicable: false,
            reason: "Needs to be next to stone",
        };
    }
};
