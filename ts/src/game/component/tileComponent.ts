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

    private makeChunkId(x: number, y: number) {
        const cx = Math.floor(x / ChunkSize);
        const cy = Math.floor(y / ChunkSize);
        return getTileId(cx, cy);
    }
}
