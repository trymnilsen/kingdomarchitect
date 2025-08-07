import { makeNumberId, type Point } from "../../common/point.js";
import { ChunkSize, getChunkPosition } from "../map/chunk.js";

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
 * Marks a specific tile as discovered by a player. If discovering this tile
 * results in a whole chunk being discovered, the chunk is moved from the
 * 'partially discovered' collection to the 'fully discovered' collection for efficiency.
 *
 * This function assumes a `worldDiscoveryComponent: WorldDiscoveryComponent` instance
 * is accessible within its scope.
 *
 * @param player The ID of the player discovering the tile.
 * @param tile The world coordinates of the tile being discovered.
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
    const chunkId = makeNumberId(chunkPosition.x, chunkPosition.y);

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

    const tileId = makeNumberId(tile.x, tile.y);
    if (discoveredTilesInChunk.has(tileId)) {
        return;
    }

    const tilesPerChunk = ChunkSize * ChunkSize;
    if (discoveredTilesInChunk.size >= tilesPerChunk) {
        playerData.partiallyDiscoveredChunks.delete(chunkId);
        playerData.fullyDiscoveredChunks.add(chunkId);
    } else {
        discoveredTilesInChunk.add(tileId);
    }
}
