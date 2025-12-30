import { adjacentPoints, Point } from "../../../../../common/point.ts";
import { stoneResource } from "../../../../../data/inventory/items/naturalResource.ts";
import { ResourceComponentId } from "../../../../component/resourceComponent.ts";
import { Entity } from "../../../../entity/entity.ts";
import { queryEntity } from "../../../../map/query/queryEntity.ts";
import { BuildingApplicability } from "../buildingApplicability.ts";

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
