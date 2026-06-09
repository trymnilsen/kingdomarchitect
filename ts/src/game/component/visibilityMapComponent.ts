import { makeNumberId, type Point } from "../../common/point.ts";
import type { WorldDiscoveryData } from "./worldDiscoveryComponent.ts";

export type VisibilityMapComponent = {
    id: typeof VisibilityMapComponentId;
    visibility: Set<number>;
    discovered: WorldDiscoveryData;
};

export function createVisibilityMapComponent(): VisibilityMapComponent {
    return {
        id: VisibilityMapComponentId,
        visibility: new Set(),
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

/**
 * Whether a tile falls within some viewer's vision reach this frame — the maximum
 * distance an emitter can see, before illumination is taken into account. This is
 * only one of the two limits on what the player actually sees: a tile in reach can
 * still be unseen if it is dark. The combined rule (the smaller of reach and the
 * tile's light band) lives in the perceived-band derivation, not here.
 */
export function isInVisionReach(
    visibilityComponent: VisibilityMapComponent,
    x: number,
    y: number,
): boolean {
    return visibilityComponent.visibility.has(makeNumberId(x, y));
}

export const VisibilityMapComponentId = "visibilityMap";
