import { Point } from "../../common/point.js";

export const ChunkSize = 8;

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
