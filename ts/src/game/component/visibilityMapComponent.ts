import { makeNumberId, type Point } from "../../common/point.ts";
import type { LightBand } from "../light/lightBand.ts";
import type { WorldDiscoveryData } from "./worldDiscoveryComponent.ts";

export type VisibilityMapComponent = {
    id: typeof VisibilityMapComponentId;
    visibility: Set<number>;
    /**
     * The minimum band each tile is perceived at this frame regardless of
     * illumination, from viewers' minimal perception (see
     * {@link MinimalPerception}). Holds entries only for tiles some viewer
     * grants a floor on; every other tile floors at `dark`. Rebuilt fresh each
     * render alongside `visibility`, and like it never replicated.
     */
    perceptionFloor: Map<number, LightBand>;
    discovered: WorldDiscoveryData;
};

export function createVisibilityMapComponent(): VisibilityMapComponent {
    return {
        id: VisibilityMapComponentId,
        visibility: new Set(),
        perceptionFloor: new Map(),
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

/**
 * The minimum band a tile is perceived at this frame, before illumination is
 * considered: the floor some viewer's minimal perception grants it, or `dark`
 * where no viewer does. The perceived-band rule takes the brighter of this and
 * the tile's actual illumination.
 */
export function perceptionFloorAt(
    visibilityComponent: VisibilityMapComponent,
    x: number,
    y: number,
): LightBand {
    return visibilityComponent.perceptionFloor.get(makeNumberId(x, y)) ?? "dark";
}

export const VisibilityMapComponentId = "visibilityMap";
