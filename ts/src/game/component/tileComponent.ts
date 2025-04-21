import type { Bounds } from "../../common/bounds.js";
import type { JSONValue } from "../../common/object.js";
import type { Point } from "../../common/point.js";
import { ChunkSize, type TileChunk } from "../../module/map/chunk.js";
import { getTileId, type GroundTile } from "../../module/map/tile.js";

export class TileComponent {
    chunks = new Map<string, TileChunk>();

    setChunk(chunk: TileChunk) {
        const chunkId = getTileId(chunk.chunkX, chunk.chunkY);
        this.chunks.set(chunkId, chunk);
    }

    hasChunk(position: Point): boolean {
        return this.chunks.has(getTileId(position.x, position.y));
    }

    getChunk(chunkPosition: Point) {
        const chunkId = getTileId(chunkPosition.x, chunkPosition.y);
        return this.chunks.get(chunkId) ?? null;
    }

    getTile(tilePosition: Point): GroundTile | null {
        const chunkId = this.makeChunkId(tilePosition.x, tilePosition.y);
        const chunk = this.chunks.get(chunkId);
        if (!chunk) {
            return null;
        }

        const tileId = getTileId(tilePosition.x, tilePosition.y);
        return {
            tileX: tilePosition.x,
            tileY: tilePosition.y,
            type: chunk.volume.type,
        };
    }

    getBounds(): Bounds {
        //Loop over chunk map and get min and max
        //multiply this to get tile bounds
        let minX = Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;
        for (const [id, chunk] of this.chunks) {
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

    private makeChunkId(x: number, y: number) {
        const cx = Math.floor(x / ChunkSize);
        const cy = Math.floor(y / ChunkSize);
        return getTileId(cx, cy);
    }
}
