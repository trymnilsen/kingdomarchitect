import { Point } from "../../data/point";
import { TILES_PER_CHUNK } from "../constants";
import { GameState, getChunkId, getTileOffset } from "./gameState";

export function toggleWall(state: GameState, point: Point): GameState {
    const chunkX = Math.floor(point.x / TILES_PER_CHUNK);
    const chunkY = Math.floor(point.y / TILES_PER_CHUNK);
    const chunkId = getChunkId({ x: chunkX, y: chunkY });
    const chunk = state.chunks[chunkId];
    if (chunk) {
        const tileX = point.x % TILES_PER_CHUNK;
        const tileY = point.y % TILES_PER_CHUNK;
        const tileOffset = getTileOffset({ x: tileX, y: tileY });
        const currentTileType = chunk.tileMap[tileOffset];
        if (currentTileType === 1) {
            chunk.tileMap[tileOffset] = 0;
        } else {
            chunk.tileMap[tileOffset] = 1;
        }
    } else {
        console.log(`Chunk not found: ${chunkId}`);
    }
    return state;
}
