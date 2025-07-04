import { Point } from "../../../../../common/point.js";
import { Entity } from "../../../../entity/entity.js";
import { BuildingApplicability } from "../buildingApplicability.js";

export const quaryApplicability: BuildingApplicability = (
    _point: Point,
    _world: Entity,
) => {
    //TODO: Reimplement me
    return {
        isApplicable: false,
        reason: "Needs to be next to stone",
    };
    /*
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
    }*/
};
