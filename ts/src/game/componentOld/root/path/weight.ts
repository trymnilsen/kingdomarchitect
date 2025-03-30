import { Point } from "../../../../common/point.js";
import { Entity } from "../../../entity/entity.js";
import { WorkerBehaviorComponent } from "../../behavior/workerBehaviorComponent.js";
import { BuildingComponent } from "../../building/buildingComponent.js";
import { WeightComponent } from "../../movement/weightComponent.js";
import { TreeComponent } from "../../resource/treeComponent.js";
import { TilesComponent } from "../../tile/tilesComponent.js";
import { SpatialChunkMapComponent } from "../../world/spatialChunkMapComponent.js";

export function getWeightAtPoint(
    point: Point,
    rootEntity: Entity,
    groundComponent: TilesComponent,
): number {
    let weight = 25;
    const ground = groundComponent.getTile({
        x: point.x,
        y: point.y,
    });
    if (!ground) {
        weight = 0;
    } else {
        weight = 2;
    }

    const entities = rootEntity
        .requireComponent(SpatialChunkMapComponent)
        .getEntitiesAt(point.x, point.y);

    if (entities.length > 0) {
        let entityWeight = 0;
        for (const entity of entities) {
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
            }
        }

        if (entityWeight > 0) {
            weight = entityWeight;
        }
    }

    return weight;
}
