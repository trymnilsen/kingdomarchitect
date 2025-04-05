import { Bounds } from "../../common/bounds.js";
import { Point } from "../../common/point.js";
import { TileSize } from "./tile.js";
import type { Volume } from "./volume.js";

export const ChunkSize = 8;
export const ChunkDimension = ChunkSize * TileSize;

export type GroundChunk = {
    chunkX: number;
    chunkY: number;
};
/**
 * Get the chunk the given world position is in
 * @param worldPosition
 * @returns the point of the chunk, in chunk space
 */
export function getChunkPosition(x: number, y: number): Point {
    const chunkX = Math.floor(x / ChunkSize);
    const chunkY = Math.floor(y / ChunkSize);
    return {
        x: chunkX,
        y: chunkY,
    };
}

/**
 * Return the string representation of a chunk position
 * @param chunkPosition the position of the chunk
 * @returns the id of the chunk
 */
export function getChunkId(chunkPosition: Point): string {
    return `x${chunkPosition.x}y${chunkPosition.y}`;
}

export function getChunkBounds(chunk: Point): Bounds {
    return {
        x1: chunk.x * ChunkSize,
        y1: chunk.y * ChunkSize,
        x2: (chunk.x + 1) * ChunkSize - 1,
        y2: (chunk.y + 1) * ChunkSize - 1,
    };
}

export type TileChunk = {
    chunkX: number;
    chunkY: number;
    volume: Volume;
    discovered: Set<string>;
};
