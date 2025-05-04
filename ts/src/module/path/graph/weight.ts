import type { Point } from "../../../common/point.js";
import {
    ChunkMapComponentId,
    getEntitiesAt,
} from "../../../game/component/chunkMapComponent.js";
import { ResourceComponentId } from "../../../game/component/resourceComponent.js";
import {
    getTile,
    TileComponentId,
    type TileComponent,
} from "../../../game/component/tileComponent.js";
import type { Entity } from "../../../game/entity/entity.js";

export function getWeightAtPoint(point: Point, rootEntity: Entity): number {
    let weight = 25;
    const tileComponent = rootEntity.requireEcsComponent(TileComponentId);
    const ground = getTile(tileComponent, {
        x: point.x,
        y: point.y,
    });
    if (!ground) {
        weight = 0;
    } else {
        weight = 2;
    }

    const chunkMap = rootEntity.requireEcsComponent(ChunkMapComponentId);
    const entities = getEntitiesAt(chunkMap, point.x, point.y);

    if (entities.length > 0) {
        let entityWeight = 0;
        for (const entity of entities) {
            /*
            const weightComponent = entity.getComponent(WeightComponent);
            if (!!weightComponent) {
                entityWeight = weightComponent.weight;
                continue;
            }

            const buildingComponent = entity.getComponent(BuildingComponent);

            if (buildingComponent) {
                entityWeight = 100;
            }

            const workerComponent = entity.getComponent(
                WorkerBehaviorComponent,
            );

            if (workerComponent) {
                entityWeight = 20;
            }

            const treeComponent = entity.getComponent(TreeComponent);
            if (treeComponent) {
                entityWeight = 30;
            }*/
            const resourceComponent =
                entity.getEcsComponent(ResourceComponentId);
            if (!!resourceComponent) {
                entityWeight = 30;
            }
        }

        if (entityWeight > 0) {
            weight = entityWeight;
        }
    }

    return weight;
}
