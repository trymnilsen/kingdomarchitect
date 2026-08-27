import { encodePosition, type Point } from "../../common/point.ts";
import { ChunkSize, getChunkPosition } from "../map/chunk.ts";

export type WorldDiscoveryData = {
    readonly fullyDiscoveredChunks: Set<number>;
    readonly partiallyDiscoveredChunks: Map<number, Set<number>>;
};

export type WorldDiscoveryComponent = {
    id: typeof WorldDiscoveryComponentId;
    discoveriesByUser: Map<string, WorldDiscoveryData>;
};

export function createWorldDiscoveryComponent(): WorldDiscoveryComponent {
    return {
        id: WorldDiscoveryComponentId,
        discoveriesByUser: new Map(),
    };
}

export const WorldDiscoveryComponentId = "worldDiscovery";

/**
 * Marks a tile as discovered by a player. The tile that completes a chunk moves
 * that chunk from the partially-discovered map to the fully-discovered set, so
 * a finished chunk costs one entry instead of one per tile.
 */
export function discoverTile(
    component: WorldDiscoveryComponent,
    player: string,
    tile: Point,
) {
    let playerData = component.discoveriesByUser.get(player);
    if (!playerData) {
        playerData = {
            fullyDiscoveredChunks: new Set<number>(),
            partiallyDiscoveredChunks: new Map<number, Set<number>>(),
        };
        component.discoveriesByUser.set(player, playerData);
    }

    const chunkPosition = getChunkPosition(tile.x, tile.y);
    const chunkId = encodePosition(chunkPosition.x, chunkPosition.y);

    if (playerData.fullyDiscoveredChunks.has(chunkId)) {
        return;
    }

    let discoveredTilesInChunk =
        playerData.partiallyDiscoveredChunks.get(chunkId);
    if (!discoveredTilesInChunk) {
        discoveredTilesInChunk = new Set<number>();
        playerData.partiallyDiscoveredChunks.set(
            chunkId,
            discoveredTilesInChunk,
        );
    }

    // Convert to local coordinates within the chunk (0-7)
    const localX = ((tile.x % ChunkSize) + ChunkSize) % ChunkSize;
    const localY = ((tile.y % ChunkSize) + ChunkSize) % ChunkSize;
    const tileId = encodePosition(localX, localY);

    if (discoveredTilesInChunk.has(tileId)) {
        return;
    }

    //If the user now has discovered all the tiles in the chunk move it
    //from partially discovered to discovered
    const tilesPerChunk = ChunkSize * ChunkSize;
    if (discoveredTilesInChunk.size >= tilesPerChunk - 1) {
        playerData.partiallyDiscoveredChunks.delete(chunkId);
        playerData.fullyDiscoveredChunks.add(chunkId);
    } else {
        discoveredTilesInChunk.add(tileId);
    }
}

export function hasDiscoveredTile(
    component: WorldDiscoveryComponent,
    playerId: string,
    position: Point,
): boolean {
    const playerData = component.discoveriesByUser.get(playerId);
    if (!playerData) return false;

    const chunkPos = getChunkPosition(position.x, position.y);
    const chunkId = encodePosition(chunkPos.x, chunkPos.y);

    if (playerData.fullyDiscoveredChunks.has(chunkId)) return true;
    const discoveredTiles = playerData.partiallyDiscoveredChunks.get(chunkId);
    if (!discoveredTiles) return false;

    // Convert to local coordinates within the chunk (0-7)
    const localX = ((position.x % ChunkSize) + ChunkSize) % ChunkSize;
    const localY = ((position.y % ChunkSize) + ChunkSize) % ChunkSize;
    const tileId = encodePosition(localX, localY);
    return discoveredTiles.has(tileId);
}

export function hasDiscoveredChunkByTilePosition(
    component: WorldDiscoveryComponent,
    playerId: string,
    position: Point,
): boolean {
    return hasDiscoveredChunkByChunkPosition(
        component,
        playerId,
        getChunkPosition(position.x, position.y),
    );
}

export function hasDiscoveredChunkByChunkPosition(
    component: WorldDiscoveryComponent,
    playerId: string,
    position: Point,
): boolean {
    const playerData = component.discoveriesByUser.get(playerId);
    if (!playerData) return false;
    const chunkId = encodePosition(position.x, position.y);

    if (playerData.fullyDiscoveredChunks.has(chunkId)) return true;
    const discoveredTiles = playerData.partiallyDiscoveredChunks.has(chunkId);
    return discoveredTiles;
}
