import { adjacentPoints, Point } from "../../../../common/point.js";
import { Entity } from "../../../entity/entity.js";
import { TilesComponent } from "../../tile/tilesComponent.js";
import { ChunkMapComponent } from "../chunk/chunkMapComponent.js";
import { getWeightAtPoint } from "./weight.js";

export function findClosestAvailablePosition(entity: Entity): Point | null {
    const root = entity.getRootEntity();
    const groundComponent = root.requireComponent(TilesComponent);
    const chunkMap = root.requireComponent(ChunkMapComponent);

    const entitiesToVisit: Entity[] = [entity];
    const visitedEntities = new Set<string>();

    while (entitiesToVisit.length > 0) {
        const nextVisit = entitiesToVisit.pop();
        if (!nextVisit) {
            return null;
        }

        const weight = getWeightAtPoint(
            nextVisit.worldPosition,
            root,
            groundComponent,
        );

        if (weight == 0) {
            continue;
        }

        if (weight < 5) {
            return nextVisit.worldPosition;
        }

        const adjacent = adjacentPoints(nextVisit.worldPosition);
        const adjacentEntities = adjacent.flatMap((adjacentPoint) => {
            return chunkMap.getEntityAt(adjacentPoint);
        });

        for (const adjacentEntity of adjacentEntities) {
            if (!visitedEntities.has(adjacentEntity.id)) {
                visitedEntities.add(adjacentEntity.id);
                entitiesToVisit.push(adjacentEntity);
            }
        }
    }

    return null;
}
