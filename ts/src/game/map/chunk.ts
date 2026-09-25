import type { Bounds } from "../../common/bounds.ts";
import type { Point } from "../../common/point.ts";
import type { Volume } from "./volume.ts";
import { TileSize } from "./tile.ts";
import { Terrain } from "./terrain.ts";
import { isMaskSet, type TileMask } from "./tileMask.ts";

export const ChunkSize = 16;
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
    volume?: Volume;
    terrain: readonly Terrain[];
};

export type GeneratedTileChunk = TileChunk & {
    volume: Volume;
};

export function terrainIndex(localX: number, localY: number): number {
    if (
        localX < 0 ||
        localY < 0 ||
        localX >= ChunkSize ||
        localY >= ChunkSize
    ) {
        throw new Error(
            `Tile ${localX}/${localY} is outside a chunk of size ${ChunkSize}`,
        );
    }
    return localY * ChunkSize + localX;
}

export function createLandTerrain(): Terrain[] {
    return new Array<Terrain>(ChunkSize * ChunkSize).fill(Terrain.Land);
}

export function getTerrainInChunk(
    chunk: TileChunk,
    localX: number,
    localY: number,
): Terrain {
    return chunk.terrain[terrainIndex(localX, localY)];
}

export function getTerrainAtWorldPosition(
    chunk: TileChunk,
    worldX: number,
    worldY: number,
): Terrain {
    return getTerrainInChunk(
        chunk,
        worldX - chunk.chunkX * ChunkSize,
        worldY - chunk.chunkY * ChunkSize,
    );
}

export function paintTerrain(
    terrain: readonly Terrain[],
    mask: TileMask,
    paint: Terrain,
): Terrain[] {
    const painted = [...terrain];
    for (let y = 0; y < ChunkSize; y++) {
        for (let x = 0; x < ChunkSize; x++) {
            if (isMaskSet(mask, x, y)) {
                painted[terrainIndex(x, y)] = paint;
            }
        }
    }
    return painted;
}

export function maskTerrain(
    chunk: TileChunk,
    matches: (terrain: Terrain) => boolean,
): TileMask {
    const rows: number[] = [];
    for (let y = 0; y < ChunkSize; y++) {
        let row = 0;
        for (let x = 0; x < ChunkSize; x++) {
            row = row << 1;
            if (matches(getTerrainInChunk(chunk, x, y))) {
                row = row | 1;
            }
        }
        rows.push(row);
    }
    return { width: ChunkSize, height: ChunkSize, rows };
}
