import { adjacentPoints, Point } from "../../../../../common/point.js";
import { stoneResource } from "../../../../../data/inventory/items/naturalResource.js";
import { ResourceComponentId } from "../../../../component/resourceComponent.js";
import { Entity } from "../../../../entity/entity.js";
import { queryEntity } from "../../../../map/query/queryEntity.js";
import { BuildingApplicability } from "../buildingApplicability.js";

export const quaryApplicability: BuildingApplicability = (
    point: Point,
    world: Entity,
) => {
    const points = adjacentPoints(point);
    const hasAdjacent = points.some((adjacentPoint) => {
        const entities = queryEntity(world, adjacentPoint);

        const entityContainsStone = entities.some(
            (entity) =>
                entity.getEcsComponent(ResourceComponentId)?.resourceId ===
                stoneResource.id,
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
