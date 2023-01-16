import { Point } from "../../common/point";

export const ChunkSize = 3;

/**
 * Get the chunk the given world position is in
 * @param worldPosition
 * @returns the point of the chunk, in chunk space
 */
export function getChunkPosition(worldPosition: Point): Point {
    const chunkX = Math.floor(worldPosition.x / ChunkSize);
    const chunkY = Math.floor(worldPosition.y / ChunkSize);
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
