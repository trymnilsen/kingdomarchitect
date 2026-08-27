import { decodePosition } from "../../common/point.ts";
import type { TileComponent } from "../../game/component/tileComponent.ts";
import type { WorldDiscoveryData } from "../../game/component/worldDiscoveryComponent.ts";
import { ChunkSize, getChunkId } from "../../game/map/chunk.ts";
import type { Volume } from "../../game/map/volume.ts";

export type DiscoveredTileData = { x: number; y: number; volume: string };

export type PlayerDiscoveryData = {
    tiles: DiscoveredTileData[];
    volumes: Volume[];
};

/**
 * The tiles a player has discovered, with the volumes they reference. Both the
 * initial world state and later discover-tile effects are built from this, so
 * the two cannot disagree about what the player has seen.
 *
 * Returns null when the player has discovered nothing.
 */
export function getPlayerDiscoveryData(
    tileComponent: TileComponent,
    playerDiscovery: WorldDiscoveryData,
): PlayerDiscoveryData | null {
    const volumeIds = new Set<string>();
    const tiles: DiscoveredTileData[] = [];

    // Process fully discovered chunks
    for (const chunkId of playerDiscovery.fullyDiscoveredChunks) {
        const chunkPosition = decodePosition(chunkId);
        const chunk = tileComponent.chunks.get(getChunkId(chunkPosition));
        if (!chunk?.volume) continue;

        volumeIds.add(chunk.volume.id);

        const chunkTileX = chunk.chunkX * ChunkSize;
        const chunkTileY = chunk.chunkY * ChunkSize;

        for (let x = 0; x < ChunkSize; x++) {
            for (let y = 0; y < ChunkSize; y++) {
                tiles.push({
                    x: chunkTileX + x,
                    y: chunkTileY + y,
                    volume: chunk.volume.id,
                });
            }
        }
    }

    // Process partially discovered chunks
    for (const [
        chunkId,
        discoveredTiles,
    ] of playerDiscovery.partiallyDiscoveredChunks) {
        const chunkPosition = decodePosition(chunkId);
        const chunk = tileComponent.chunks.get(getChunkId(chunkPosition));
        if (!chunk?.volume) continue;

        volumeIds.add(chunk.volume.id);

        const chunkTileX = chunk.chunkX * ChunkSize;
        const chunkTileY = chunk.chunkY * ChunkSize;

        for (const tileId of discoveredTiles) {
            const localPos = decodePosition(tileId);
            tiles.push({
                x: chunkTileX + localPos.x,
                y: chunkTileY + localPos.y,
                volume: chunk.volume.id,
            });
        }
    }

    if (tiles.length === 0) {
        return null;
    }

    // Collect volumes
    const volumes = Array.from(volumeIds)
        .map((id) => tileComponent.volume.get(id))
        .filter((v) => v !== undefined);

    return { tiles, volumes };
}
