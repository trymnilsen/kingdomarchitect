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

export function isVisible(
    visibilityComponent: VisibilityMapComponent,
    x: number,
    y: number,
): boolean {
    return visibilityComponent.visibility.has(makeNumberId(x, y));
}

export const VisibilityMapComponentId = "visibilityMap";
