import { makeNumberId, pointEquals } from "../../common/point.ts";
import {
    setChunk,
    type TileComponent,
} from "../../game/component/tileComponent.ts";
import type { VisibilityMapComponent } from "../../game/component/visibilityMapComponent.ts";
import { ChunkSize, getChunkId, getChunkPosition } from "../../game/map/chunk.ts";
import type { Volume } from "../../game/map/volume.ts";
import type { DiscoveredTileData } from "./playerDiscoveryData.ts";

/**
 * Applies discovered tiles to the client-side tile and visibility components.
 * This is the shared logic used by both WorldStateGameMessage handling and
 * DiscoverTileEffect handling.
 *
 * @param tileComponent The tile component to populate with chunks
 * @param visibilityMapComponent The visibility component to track discovered tiles
 * @param tiles The discovered tile data to apply
 * @param volumes The volumes referenced by the tiles
 */
export function applyDiscoveredTiles(
    tileComponent: TileComponent,
    visibilityMapComponent: VisibilityMapComponent,
    tiles: DiscoveredTileData[],
    volumes: Volume[],
): void {
    // Register volumes first
    for (const volume of volumes) {
        tileComponent.volume.set(volume.id, volume);
    }

    // Process each discovered tile
    for (const tile of tiles) {
        const volume = tileComponent.volume.get(tile.volume);
        if (!volume) {
            console.warn(`No volume found for tile ${tile.x},${tile.y}`);
            continue;
        }

        const chunkPosition = getChunkPosition(tile.x, tile.y);
        let chunk = tileComponent.chunks.get(getChunkId(chunkPosition));
        if (!chunk) {
            chunk = {
                chunkX: chunkPosition.x,
                chunkY: chunkPosition.y,
                volume: volume,
            };
            const volumeAlreadyHasChunk = volume.chunks.find((item) =>
                pointEquals(item, chunkPosition),
            );
            if (!volumeAlreadyHasChunk) {
                volume.chunks.push(chunkPosition);
            }
            setChunk(tileComponent, chunk);
        }

        // Track visibility
        // Javascript modulus can return negative values, so we normalize to 0-7
        const localX = ((tile.x % ChunkSize) + ChunkSize) % ChunkSize;
        const localY = ((tile.y % ChunkSize) + ChunkSize) % ChunkSize;

        const size = ChunkSize * ChunkSize;
        const chunkId = makeNumberId(chunkPosition.x, chunkPosition.y);
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
            partiallyDiscoveredChunkData.add(makeNumberId(localX, localY));
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
