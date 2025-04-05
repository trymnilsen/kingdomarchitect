import type { Point } from "../../common/point.js";
import type { TileChunk } from "../../module/map/chunk.js";
import { getTileId } from "../../module/map/tile.js";

export class TileComponent {
    chunks = new Map<string, TileChunk>();

    setChunk(chunk: TileChunk) {
        const chunkId = getTileId(chunk.chunkX, chunk.chunkY);
        this.chunks.set(chunkId, chunk);
    }

    getChunk(chunkPosition: Point) {
        const chunkId = getTileId(chunkPosition.x, chunkPosition.y);
        return this.chunks.get(chunkId) ?? null;
    }
}
