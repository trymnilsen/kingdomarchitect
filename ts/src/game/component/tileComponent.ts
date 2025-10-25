import type { Bounds } from "../../common/bounds.js";
import type { Point } from "../../common/point.js";
import { ChunkSize, type TileChunk } from "../map/chunk.js";
import { getTileId, type GroundTile } from "../map/tile.js";
import type { Volume } from "../map/volume.js";

export type TileComponent = {
    id: typeof TileComponentId;
    chunks: Map<string, TileChunk>;
    volume: Map<string, Volume>;
};

export function createTileComponent(): TileComponent {
    return {
        id: TileComponentId,
        chunks: new Map(),
        volume: new Map(),
    };
}

export const TileComponentId = "Tile";

/**
 * Set the given chunk on a tilecomponent and register its volume
 * @param component the source component
 * @param chunk the chunk to set
 */
export function setChunk(component: TileComponent, chunk: TileChunk) {
    const chunkId = getTileId(chunk.chunkX, chunk.chunkY);
    component.chunks.set(chunkId, chunk);

    // Register the volume in the volume registry if the chunk has one
    if (chunk.volume && !component.volume.has(chunk.volume.id)) {
        component.volume.set(chunk.volume.id, chunk.volume);
    }
}

/**
 * Check if the tile component has an chunk at the given position
 * @param component the source component
 * @param position the position to check, on chunk coordinates
 * @returns true or false
 */
export function hasChunk(component: TileComponent, position: Point): boolean {
    return component.chunks.has(getTileId(position.x, position.y));
}

/**
 * Retrieve the TileChunk at the given position
 * @param component the source component
 * @param chunkPosition the position in chunk coordinates
 * @returns the chunk or null if there is none
 */
export function getChunk(
    component: TileComponent,
    chunkPosition: Point,
): TileChunk | null {
    const chunkId = getTileId(chunkPosition.x, chunkPosition.y);
    return component.chunks.get(chunkId) ?? null;
}

/**
 * Retrieve the ground tile at the given position
 * @param component
 * @param tilePosition
 * @returns
 */
export function getTile(
    component: TileComponent,
    tilePosition: Point,
): GroundTile | null {
    const chunkId = makeChunkId(tilePosition.x, tilePosition.y);
    const chunk = component.chunks.get(chunkId);
    if (!chunk) {
        return null;
    }

    const tileId = getTileId(tilePosition.x, tilePosition.y);
    return {
        tileX: tilePosition.x,
        tileY: tilePosition.y,
        type: chunk.volume?.type,
    };
}

export function getBoundsForTiles(component: TileComponent): Bounds {
    //Loop over chunk map and get min and max
    //multiply this to get tile bounds
    let minX = Number.MAX_SAFE_INTEGER;
    let minY = Number.MAX_SAFE_INTEGER;
    let maxX = Number.MIN_SAFE_INTEGER;
    let maxY = Number.MIN_SAFE_INTEGER;
    for (const [id, chunk] of component.chunks) {
        if (chunk.chunkX > maxX) {
            maxX = chunk.chunkX;
        }
        if (chunk.chunkX < minX) {
            minX = chunk.chunkX;
        }
        if (chunk.chunkY > maxY) {
            maxY = chunk.chunkY;
        }
        if (chunk.chunkY < minY) {
            minY = chunk.chunkY;
        }
    }
    return {
        x1: minX * ChunkSize,
        y1: minY * ChunkSize,
        x2: maxX * ChunkSize + ChunkSize - 1,
        y2: maxY * ChunkSize + ChunkSize - 1,
    };
}

function makeChunkId(x: number, y: number) {
    const cx = Math.floor(x / ChunkSize);
    const cy = Math.floor(y / ChunkSize);
    return getTileId(cx, cy);
}
