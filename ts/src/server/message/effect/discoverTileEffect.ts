import type { Volume } from "../../../game/map/volume.ts";
import { decodePosition } from "../../../common/point.ts";
import { TileComponentId } from "../../../game/component/tileComponent.ts";
import { WorldDiscoveryComponentId } from "../../../game/component/worldDiscoveryComponent.ts";
import type { Entity } from "../../../game/entity/entity.ts";
import { ChunkSize, getChunkId } from "../../../game/map/chunk.ts";

export type DiscoverTileEffect = {
    id: typeof DiscoverTileEffectId;
    tiles: { x: number; y: number; volume: string }[];
    volumes?: Volume[];
};

export const DiscoverTileEffectId = "discoverTile";

/**
 * Builds a discovery effect containing all tiles discovered by a player.
 * Reads from WorldDiscoveryComponent to determine which tiles to include.
 *
 * @param scene The scene entity (e.g., overworld) containing tile and discovery components
 * @param player The player ID to get discovered tiles for
 * @returns Complete discovery effect, or null if nothing discovered
 */
export function buildDiscoveryEffectForPlayer(
    scene: Entity,
    player: string,
): DiscoverTileEffect | null {
    const tileComponent = scene.getEcsComponent(TileComponentId);
    const discoveryComponent = scene.getEcsComponent(WorldDiscoveryComponentId);

    if (!tileComponent || !discoveryComponent) {
        return null;
    }

    const playerDiscovery = discoveryComponent.discoveriesByUser.get(player);
    if (!playerDiscovery) {
        return null;
    }

    const volumeIds = new Set<string>();
    const tiles: { x: number; y: number; volume: string }[] = [];

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

    return {
        id: DiscoverTileEffectId,
        tiles,
        volumes,
    };
}
