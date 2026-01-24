import type { Point } from "../../../../common/point.ts";
import { BuildingComponentId } from "../../../component/buildingComponent.ts";
import { PlayerUnitComponentId } from "../../../component/playerUnitComponent.ts";
import { ResourceComponentId } from "../../../component/resourceComponent.ts";
import { getTile, TileComponentId } from "../../../component/tileComponent.ts";
import type { Entity } from "../../../entity/entity.ts";
import { queryEntity } from "../../query/queryEntity.ts";

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
                // Roads have weight 1 to prioritize pathfinding through them
                if (buildingComponent.building.id === "road") {
                    entityWeight = 1;
                } else {
                    entityWeight = 100;
                }
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
