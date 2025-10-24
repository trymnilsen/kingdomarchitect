import type { Bounds } from "../../common/bounds.js";
import { encodePosition, type Point } from "../../common/point.js";
import { SparseSet } from "../../common/structure/sparseSet.js";
import { ChunkSize } from "../map/chunk.js";
import type { Entity } from "../entity/entity.js";

export type ChunkMap = {
    chunks: Map<number, SparseSet<Entity>>;
    entityChunkMap: Map<string, number>;
};

export type ChunkMapRegistryComponent = {
    id: typeof ChunkMapRegistryComponentId;
    chunkMaps: Map<string, ChunkMap>; // Keyed by entity id (scene id)
};

export const ChunkMapRegistryComponentId = "ChunkMapRegistry";

export function createChunkMapRegistryComponent(): ChunkMapRegistryComponent {
    return {
        id: ChunkMapRegistryComponentId,
        chunkMaps: new Map(),
    };
}

export function createChunkMap(): ChunkMap {
    return {
        chunks: new Map(),
        entityChunkMap: new Map(),
    };
}

/**
 * Gets a chunk map by id
 * @param registry The ChunkMapRegistryComponent
 * @param mapId The id of the chunk map. Id of entity with SpaceComponent on it
 * @returns The ChunkMap or undefined if not found
 */
export function getChunkMap(
    registry: ChunkMapRegistryComponent,
    mapId: string,
): ChunkMap | undefined {
    return registry.chunkMaps.get(mapId);
}

/**
 * Gets all entities in the chunk at the given world position
 * @param chunkMap The ChunkMap to search in
 * @param x the x coordinate in tilespace
 * @param y the y coordinate in tilespace
 * @returns an array of entities within the chunk at the given position
 */
export function getEntitiesAt(
    chunkMap: ChunkMap,
    x: number,
    y: number,
): Entity[] {
    // Convert to chunk coordinates
    const chunkX = Math.floor(x / ChunkSize);
    const chunkY = Math.floor(y / ChunkSize);
    const chunkKey = encodePosition(chunkX, chunkY);

    const chunk = chunkMap.chunks.get(chunkKey);
    if (!chunk) {
        return [];
    }

    const entities: Entity[] = [];
    for (let i = 0; i < chunk.size; i++) {
        const entity = chunk.elementAt(i);
        const atPosition =
            entity.worldPosition.x === x && entity.worldPosition.y === y;
        if (atPosition) {
            entities.push(entity);
        }
    }

    return entities;
}

export function getEntitiesInChunkMapWithin(
    chunkMap: ChunkMap,
    bounds: Bounds,
): Entity[] {
    const startChunkX = Math.floor(bounds.x1 / ChunkSize);
    const startChunkY = Math.floor(bounds.y1 / ChunkSize);
    const endChunkX = Math.ceil(bounds.x2 / ChunkSize) + 1;
    const endChunkY = Math.ceil(bounds.y2 / ChunkSize) + 1;
    const xChunks = endChunkX - startChunkX;
    const yChunks = endChunkY - startChunkY;

    const entities: Entity[] = [];
    const totalChunks = xChunks * yChunks;

    for (let i = 0; i < totalChunks; i++) {
        // Convert the linear index `i` to chunk coordinates
        const chunkX = startChunkX + (i % xChunks);
        const chunkY = startChunkY + Math.floor(i / xChunks);
        const chunkKey = encodePosition(chunkX, chunkY);

        const chunk = chunkMap.chunks.get(chunkKey);
        if (!chunk || chunk.size === 0) continue;

        // Collect entities
        entities.push(...chunk.dense);
    }

    return entities;
}

export function getEntitiesInChunk(
    chunkMap: ChunkMap,
    chunkPosition: Point,
): Entity[] {
    const chunkKey = encodePosition(chunkPosition.x, chunkPosition.y);
    const chunk = chunkMap.chunks.get(chunkKey);
    if (!!chunk) {
        return chunk.dense;
    } else {
        return [];
    }
}
