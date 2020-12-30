import { Point } from "../../data/point";
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

export function getChunkId(point: Point): string {
    return `x${point.x}y${point.y}`;
}

export function getTileOffset(point: Point): number {
    return point.y * TILES_PER_CHUNK + point.x;
}
