import { makeNumberId } from "../../common/point.ts";
import { ChunkSize } from "../map/chunk.ts";
import type { WorldDiscoveryData } from "./worldDiscoveryComponent.ts";

/**
 * Client-only mirror of the player's permanent map memory. It holds exactly one
 * thing: the discovered store, written by discovery messages from the server.
 * What the player currently sees is derived per frame as discovered-and-lit.
 * Nothing per-frame lives on this component.
 */
export type VisibilityMapComponent = {
    id: typeof VisibilityMapComponentId;
    discovered: WorldDiscoveryData;
};

export function createVisibilityMapComponent(): VisibilityMapComponent {
    return {
        id: VisibilityMapComponentId,
        discovered: {
            fullyDiscoveredChunks: new Set(),
            partiallyDiscoveredChunks: new Map(),
        },
    };
}

export function hasDiscovered(
    visibilityComponent: VisibilityMapComponent,
    chunkId: number,
    tileX: number,
    tileY: number,
): boolean {
    if (visibilityComponent.discovered.fullyDiscoveredChunks.has(chunkId)) {
        return true;
    }

    const partiallyDiscovered =
        visibilityComponent.discovered.partiallyDiscoveredChunks.get(chunkId);

    if (!partiallyDiscovered) {
        return false;
    }

    return partiallyDiscovered.has(makeNumberId(tileX, tileY));
}

/**
 * Whether the tile at a world position has been discovered. Wraps
 * {@link hasDiscovered} for callers that hold world coordinates rather than
 * chunk-local ones, such as the sprite pass of the renderer.
 */
export function hasDiscoveredWorldTile(
    visibilityComponent: VisibilityMapComponent,
    worldX: number,
    worldY: number,
): boolean {
    const chunkX = Math.floor(worldX / ChunkSize);
    const chunkY = Math.floor(worldY / ChunkSize);
    return hasDiscovered(
        visibilityComponent,
        makeNumberId(chunkX, chunkY),
        worldX - chunkX * ChunkSize,
        worldY - chunkY * ChunkSize,
    );
}

/**
 * Whether any tile of the chunk has been discovered by the player. Chunks can
 * exist client side without being discovered (the server replicates all
 * generated chunks), so player-facing checks should use this rather than
 * chunk existence.
 */
export function hasDiscoveredChunk(
    visibilityComponent: VisibilityMapComponent,
    chunkId: number,
): boolean {
    if (visibilityComponent.discovered.fullyDiscoveredChunks.has(chunkId)) {
        return true;
    }

    const partiallyDiscovered =
        visibilityComponent.discovered.partiallyDiscoveredChunks.get(chunkId);
    return !!partiallyDiscovered && partiallyDiscovered.size > 0;
}

export const VisibilityMapComponentId = "visibilityMap";
