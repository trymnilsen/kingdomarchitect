import type { Point } from "../../common/point.ts";
import { isDecorativeResource } from "../../data/inventory/items/naturalResource.ts";
import { ResourceComponentId } from "../component/resourceComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { queryEntity } from "../map/query/queryEntity.ts";

/**
 * Removes decorative resources (grass and similar) occupying the tile a
 * building is being placed on. chunkMapSystem and pathfindingSystem react to
 * the resulting child_removed events.
 */
export function clearDecorativeResourcesAt(root: Entity, point: Point): void {
    for (const entity of queryEntity(root, point)) {
        const resource = entity.getEcsComponent(ResourceComponentId);
        if (resource && isDecorativeResource(resource.resourceId)) {
            entity.remove();
        }
    }
}
