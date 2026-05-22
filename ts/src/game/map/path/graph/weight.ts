import type { Point } from "../../../../common/point.ts";
import { BuildingComponentId } from "../../../component/buildingComponent.ts";
import { GoblinUnitComponentId } from "../../../component/goblinUnitComponent.ts";
import { PlayerUnitComponentId } from "../../../component/playerUnitComponent.ts";
import { ResourceComponentId } from "../../../component/resourceComponent.ts";
import { getTile, TileComponentId } from "../../../component/tileComponent.ts";
import type { Entity } from "../../../entity/entity.ts";
import { isPermanentObstacle } from "../../../../data/inventory/items/naturalResource.ts";
import { queryEntity } from "../../query/queryEntity.ts";

/**
 * Returns true if a tile can be entered during movement — i.e. the tile exists
 * and is not occupied by a solid structure. Mirrors the rules applied by the
 * movement weight modifier so that behaviour planning and pathfinding agree.
 *
 * Clearable obstacles (trees) remain "available": pathfinding may route through
 * them and the mover chops them down on arrival. Permanent obstacles (stone and
 * other infinite nodes) are treated as walls — they are never destroyed to make
 * way, so a path must route around them.
 */
export function isTileAvailable(point: Point, root: Entity): boolean {
    if (getWeightAtPoint(point, root) === 0) return false;

    const entities = queryEntity(root, point);
    for (const entity of entities) {
        const building = entity.getEcsComponent(BuildingComponentId);
        if (building && building.building.id !== "road") return false;

        const resource = entity.getEcsComponent(ResourceComponentId);
        if (resource && isPermanentObstacle(resource.resourceId)) return false;
    }

    return true;
}

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
            const resourceComponent =
                entity.getEcsComponent(ResourceComponentId);
            if (resourceComponent) {
                entityWeight = Math.max(entityWeight, 30);
            }

            const buildingComponent =
                entity.getEcsComponent(BuildingComponentId);
            if (buildingComponent) {
                // Roads have weight 1 to prioritize pathfinding through them
                const w = buildingComponent.building.id === "road" ? 1 : 100;
                entityWeight = Math.max(entityWeight, w);
            }

            if (entity.hasComponent(PlayerUnitComponentId)) {
                entityWeight = Math.max(entityWeight, 100);
            }

            if (entity.hasComponent(GoblinUnitComponentId)) {
                entityWeight = Math.max(entityWeight, 50);
            }
        }

        if (entityWeight > 0) {
            weight = entityWeight;
        }
    }

    return weight;
}
