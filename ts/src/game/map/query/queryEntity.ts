import type { Point } from "../../../common/point.js";
import {
    ChunkMapComponentId,
    getEntitiesAt,
} from "../../component/chunkMapComponent.js";
import type { Entity } from "../../entity/entity.js";

export function queryEntity(root: Entity, point: Point): Entity[] {
    const chunkmap = root.requireEcsComponent(ChunkMapComponentId);
    return getEntitiesAt(chunkmap, point.x, point.y);
}

/**
 * Query entities at adjacent positions (non-diagonal) to the given point
 * @param root The root entity containing the chunk map
 * @param point The center point to query around
 * @returns An object with arrays of entities for each direction
 */
export function queryAdjacentEntities(
    root: Entity,
    point: Point,
): {
    left: Entity[];
    right: Entity[];
    up: Entity[];
    down: Entity[];
} {
    const chunkmap = root.requireEcsComponent(ChunkMapComponentId);

    return {
        left: getEntitiesAt(chunkmap, point.x - 1, point.y),
        right: getEntitiesAt(chunkmap, point.x + 1, point.y),
        up: getEntitiesAt(chunkmap, point.x, point.y - 1),
        down: getEntitiesAt(chunkmap, point.x, point.y + 1),
    };
}
