import type { Point } from "../../../../common/point.js";
import { BuildingComponentId } from "../../../component/buildingComponent.js";
import { PlayerUnitComponentId } from "../../../component/playerUnitComponent.js";
import { ResourceComponentId } from "../../../component/resourceComponent.js";
import { getTile, TileComponentId } from "../../../component/tileComponent.js";
import type { Entity } from "../../../entity/entity.js";
import { queryEntity } from "../../query/queryEntity.js";

export function getWeightAtPoint(point: Point, scope: Entity): number {
    let weight = 25;
    const tileComponent = scope.requireEcsComponent(TileComponentId);
    const ground = getTile(tileComponent, {
        x: point.x,
        y: point.y,
    });
    if (!ground) {
        weight = 0;
    } else {
        weight = 2;
    }

    const entities = queryEntity(scope, point);

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

            const buildingComponent =
                entity.getEcsComponent(BuildingComponentId);

            if (!!buildingComponent) {
                entityWeight = 100;
            }

            if (entity.hasComponent(PlayerUnitComponentId)) {
                entityWeight = 100;
            }
        }

        if (entityWeight > 0) {
            weight = entityWeight;
        }
    }

    return weight;
}
