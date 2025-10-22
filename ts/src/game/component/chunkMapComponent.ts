import type { Bounds } from "../../common/bounds.js";
import { encodePosition, type Point } from "../../common/point.js";
import { SparseSet } from "../../common/structure/sparseSet.js";
import { ChunkSize } from "../map/chunk.js";
import type { Entity } from "../entity/entity.js";

export type ChunkMapEntry = {
    chunks: Map<number, SparseSet<Entity>>;
    entityChunkMap: Map<string, number>;
};

export type ChunkMapComponent = {
    id: typeof ChunkMapComponentId;
    chunkMaps: Map<string, ChunkMapEntry>; // Keyed by entity id (scene id)
};

export const ChunkMapComponentId = "ChunkMap";

export function createChunkMapComponent(): ChunkMapComponent {
    return {
        id: ChunkMapComponentId,
        chunkMaps: new Map(),
    };
}

export function createChunkMapEntry(): ChunkMapEntry {
    return {
        chunks: new Map(),
        entityChunkMap: new Map(),
    };
}

/**
 * Gets all entities in the chunk at the given world position for a specific chunk map (scene/entity id)
 * @param chunkMap The ChunkMapComponent
 * @param mapId The id of the chunk map (scene/entity id)
 * @param x the x coordinate
 * @param y the y coordinate
 * @returns an array of entities within the chunk at the given position
 */
export function getEntitiesAt(
    chunkMap: ChunkMapComponent,
    mapId: string,
    x: number,
    y: number,
): Entity[] {
    const entry = chunkMap.chunkMaps.get(mapId);
    if (!entry) return [];
    // Convert to chunk coordinates
    const chunkX = Math.floor(x / ChunkSize);
    const chunkY = Math.floor(y / ChunkSize);
    const chunkKey = encodePosition(chunkX, chunkY);

    const chunk = entry.chunks.get(chunkKey);
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
    chunkMap: ChunkMapComponent,
    mapId: string,
    bounds: Bounds,
): Entity[] {
    const entry = chunkMap.chunkMaps.get(mapId);
    if (!entry) return [];
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

        const chunk = entry.chunks.get(chunkKey);
        if (!chunk || chunk.size === 0) continue;

        // Collect entities
        entities.push(...chunk.dense);
    }

    return entities;
}

export function getEntitiesInChunk(
    chunkMap: ChunkMapComponent,
    mapId: string,
    chunkPosition: Point,
): Entity[] {
    const entry = chunkMap.chunkMaps.get(mapId);
    if (!entry) return [];
    const chunkKey = encodePosition(chunkPosition.x, chunkPosition.y);
    const chunk = entry.chunks.get(chunkKey);
    if (!!chunk) {
        return chunk.dense;
    } else {
        return [];
    }
}
