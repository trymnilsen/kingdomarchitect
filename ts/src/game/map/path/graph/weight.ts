import type { Point } from "../../../../common/point.ts";
import { GoblinUnitComponentId } from "../../../component/goblinUnitComponent.ts";
import { PlayerUnitComponentId } from "../../../component/playerUnitComponent.ts";
import { ResourceComponentId } from "../../../component/resourceComponent.ts";
import {
    getTerrainAt,
    TileComponentId,
} from "../../../component/tileComponent.ts";
import { terrainDefinitions } from "../../terrain.ts";
import type { Entity } from "../../../entity/entity.ts";
import {
    getResourcePathWeight,
    isPermanentObstacle,
} from "../../../../data/inventory/items/naturalResource.ts";
import { queryEntity } from "../../query/queryEntity.ts";
import {
    getBuildingTraversalWeight,
    isImpassableStructure,
} from "../../../component/traversalComponent.ts";

export function isTileAvailable(point: Point, root: Entity): boolean {
    if (getWeightAtPoint(point, root) === 0) return false;

    const entities = queryEntity(root, point);
    for (const entity of entities) {
        if (isImpassableStructure(entity)) return false;

        const resource = entity.getEcsComponent(ResourceComponentId);
        if (resource && isPermanentObstacle(resource.resourceId)) return false;
    }

    return true;
}

export function getWeightAtPoint(point: Point, scope: Entity): number {
    const terrainWeight = getTerrainWeight(point, scope);
    if (terrainWeight === 0) {
        return 0;
    }

    const occupantWeight = getOccupantWeight(point, scope);
    if (occupantWeight > 0) {
        return occupantWeight;
    }
    return terrainWeight;
}

export function getTerrainWeight(point: Point, scope: Entity): number {
    const tileComponent = scope.requireEcsComponent(TileComponentId);
    const terrain = getTerrainAt(tileComponent, point);
    if (terrain === null) {
        return 0;
    }
    return terrainDefinitions[terrain].pathWeight;
}

export function getOccupantWeight(point: Point, scope: Entity): number {
    let weight = 0;
    for (const entity of queryEntity(scope, point)) {
        const resourceComponent = entity.getEcsComponent(ResourceComponentId);
        if (resourceComponent) {
            weight = Math.max(
                weight,
                getResourcePathWeight(resourceComponent.resourceId),
            );
        }

        const buildingWeight = getBuildingTraversalWeight(entity);
        if (buildingWeight !== undefined) {
            weight = Math.max(weight, buildingWeight);
        }

        if (entity.hasComponent(PlayerUnitComponentId)) {
            weight = Math.max(weight, 100);
        }

        if (entity.hasComponent(GoblinUnitComponentId)) {
            weight = Math.max(weight, 50);
        }
    }
    return weight;
}
