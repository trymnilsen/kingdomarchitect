import type { Point } from "../../../common/point.ts";
import {
    ChunkMapRegistryComponentId,
    getChunkMap,
    getEntitiesAt,
    getEntitiesInChunk,
} from "../../component/chunkMapRegistryComponent.ts";
import { getChunk } from "../../component/tileComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { overWorldId } from "../scenes.ts";
import type { Volume } from "../volume.ts";

export function queryEntity(scene: Entity, point: Point): Entity[] {
    const chunkMap = getChunkMap(
        scene.requireAncestorEcsComponent(ChunkMapRegistryComponentId),
        scene.id,
    );

    if (!chunkMap) {
        throw new Error("No chunk map found");
    }

    return getEntitiesAt(chunkMap, point.x, point.y);
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
    const chunkMap = getChunkMap(
        root.requireEcsComponent(ChunkMapRegistryComponentId),
        overWorldId, //Todo: should probably be dynamic
    );

    if (!chunkMap) {
        throw new Error("No chunk map found");
    }

    return {
        left: getEntitiesAt(chunkMap, point.x - 1, point.y),
        right: getEntitiesAt(chunkMap, point.x + 1, point.y),
        up: getEntitiesAt(chunkMap, point.x, point.y - 1),
        down: getEntitiesAt(chunkMap, point.x, point.y + 1),
    };
}

export function queryEntitiesWithinVolume(
    root: Entity,
    volume: Volume,
    filter: (entity: Entity) => boolean,
): Entity[] {
    const chunkMap = getChunkMap(
        root.requireEcsComponent(ChunkMapRegistryComponentId),
        overWorldId, //Todo: should probably be dynamic
    );

    if (!chunkMap) {
        throw new Error("No chunk map found");
    }

    const entities = volume.chunks
        .flatMap((chunkPoint) => getEntitiesInChunk(chunkMap, chunkPoint))
        .filter(filter);

    return entities;
}
