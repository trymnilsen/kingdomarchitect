import {
    adjacentPoints,
    encodePosition,
    Point,
} from "../../../../common/point.js";
import { Entity } from "../../../entity/entity.js";
import { TilesComponent } from "../../tile/tilesComponent.js";
import { SpatialChunkMapComponent } from "../../world/spatialChunkMapComponent.js";
import { getWeightAtPoint } from "./weight.js";

export function findClosestAvailablePosition(entity: Entity): Point | null {
    const root = entity.getRootEntity();
    const groundComponent = root.requireComponent(TilesComponent);
    const chunkMap = root.requireComponent(SpatialChunkMapComponent);

    const PointsToVisit: Point[] = [entity.worldPosition];
    const visitedPoints = new Set<number>();

    while (PointsToVisit.length > 0) {
        const nextVisit = PointsToVisit.pop();
        if (!nextVisit) {
            return null;
        }

        const weight = getWeightAtPoint(nextVisit, root, groundComponent);

        if (weight == 0) {
            continue;
        }

        if (weight < 5) {
            //TODO we should do a path search so we dont spawn characters within a small hole
            return nextVisit;
        }

        const adjacent = adjacentPoints(nextVisit);
        const adjacentEntities = adjacent.filter((adjacentPoint) => {
            return (
                chunkMap.getEntitiesAt(adjacentPoint.x, adjacentPoint.y)
                    .length == 0
            );
        });

        for (const adjacentEntity of adjacentEntities) {
            const pointId = encodePosition(adjacentEntity.x, adjacentEntity.y);
            if (!visitedPoints.has(pointId)) {
                visitedPoints.add(pointId);
                PointsToVisit.push(adjacentEntity);
            }
        }
    }

    return null;
}
