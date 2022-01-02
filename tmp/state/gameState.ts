import { Direction } from "../../common/data/direction";
import { Point } from "../../common/data/point";
import { NumberRange } from "../../common/data/range";
import { TILES_PER_CHUNK } from "../constants";

export type ChunkMap = { [id: string]: Chunk };

export interface GameState {
    chunks: ChunkMap;
}

export interface Chunk {
    position: Point;
    roomMap: number[];
    tileMap: number[];
}

export interface TilePosition {
    chunkX: number;
    chunkY: number;
    tileX: number;
    tileY: number;
}

export function getAllAdjacentTilePositions(
    position: TilePosition
): [TilePosition, TilePosition, TilePosition, TilePosition] {
    return [
        getAdjacentTilePosition(position, Direction.Up),
        getAdjacentTilePosition(position, Direction.Down),
        getAdjacentTilePosition(position, Direction.Left),
        getAdjacentTilePosition(position, Direction.Right),
    ];
}

export function getAdjacentTilePosition(
    position: TilePosition,
    direction: Direction
): TilePosition {
    let chunkX = position.chunkX;
    let chunkY = position.chunkY;
    let tileX = position.tileX;
    let tileY = position.tileY;

    if (direction == Direction.Left) {
        if (tileX == 0) {
            // If the tile is the left most
            // we jump to the last in the chunk to the left
            tileX = TILES_PER_CHUNK - 1;
            chunkX = chunkX - 1;
        } else {
            tileX = tileX - 1;
        }
    } else if (direction == Direction.Right) {
        if (tileX >= TILES_PER_CHUNK - 1) {
            tileX = 0;
            chunkX = chunkX + 1;
        } else {
            tileX = tileX + 1;
        }
    } else if (direction == Direction.Up) {
        if (tileY == 0) {
            // If the tile is the top most
            // we jump to the last in the chunk to the left
            tileY = TILES_PER_CHUNK - 1;
            chunkY = chunkY - 1;
        } else {
            tileY = tileY - 1;
        }
    } else if (direction == Direction.Down) {
        if (tileY >= TILES_PER_CHUNK - 1) {
            tileY = 0;
            chunkY = chunkY + 1;
        } else {
            tileY = tileY + 1;
        }
    } else {
        throw new Error("Invalid direction");
    }

    return {
        chunkX,
        chunkY,
        tileX,
        tileY,
    };
}

export function getTileType(
    gameState: GameState,
    position: TilePosition
): number {
    const chunkId = getChunkId({ x: position.chunkX, y: position.chunkY });
    const chunk = gameState.chunks[chunkId];
    if (chunk) {
        const tileOffset = getTileOffset({
            x: position.tileX,
            y: position.tileY,
        });
        const tileType = chunk.tileMap[tileOffset];
        return tileType;
    } else {
        return null;
    }
}

export function getChunkId(point: Point): string {
    return `x${point.x}y${point.y}`;
}

export function getTileOffset(point: Point): number {
    return point.y * TILES_PER_CHUNK + point.x;
}
