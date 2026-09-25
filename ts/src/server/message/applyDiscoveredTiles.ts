import { log } from "../../common/logging/logger.ts";
import { encodePosition, type Point } from "../../common/point.ts";
import {
    hasChunk,
    type TileComponent,
} from "../../game/component/tileComponent.ts";
import type { VisibilityMapComponent } from "../../game/component/visibilityMapComponent.ts";
import { ChunkSize, getChunkPosition } from "../../game/map/chunk.ts";

export function applyDiscoveredTiles(
    tileComponent: TileComponent,
    visibilityMapComponent: VisibilityMapComponent,
    tiles: readonly Point[],
): void {
    for (const tile of tiles) {
        const chunkPosition = getChunkPosition(tile.x, tile.y);
        if (!hasChunk(tileComponent, chunkPosition)) {
            log.warn("Discovered tile in a chunk with no replicated ground", {
                x: tile.x,
                y: tile.y,
            });
            continue;
        }

        // Track visibility
        // js modulus goes negative so wrap it back into the chunk
        const localX = ((tile.x % ChunkSize) + ChunkSize) % ChunkSize;
        const localY = ((tile.y % ChunkSize) + ChunkSize) % ChunkSize;

        const size = ChunkSize * ChunkSize;
        const chunkId = encodePosition(chunkPosition.x, chunkPosition.y);
        // A fully discovered chunk has nothing left to track. Recreating an
        // empty partial set next to the full flag would leave inconsistent
        // discovery state behind
        if (
            visibilityMapComponent.discovered.fullyDiscoveredChunks.has(chunkId)
        ) {
            continue;
        }
        let partiallyDiscoveredChunkData =
            visibilityMapComponent.discovered.partiallyDiscoveredChunks.get(
                chunkId,
            );
        if (!partiallyDiscoveredChunkData) {
            partiallyDiscoveredChunkData = new Set();
            visibilityMapComponent.discovered.partiallyDiscoveredChunks.set(
                chunkId,
                partiallyDiscoveredChunkData,
            );
        }

        if (partiallyDiscoveredChunkData.size < size - 1) {
            partiallyDiscoveredChunkData.add(encodePosition(localX, localY));
        } else {
            visibilityMapComponent.discovered.partiallyDiscoveredChunks.delete(
                chunkId,
            );
            visibilityMapComponent.discovered.fullyDiscoveredChunks.add(
                chunkId,
            );
        }
    }
}
