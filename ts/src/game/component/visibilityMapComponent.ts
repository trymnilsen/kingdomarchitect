import type { WorldDiscoveryData } from "./worldDiscoveryComponent.js";

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
    _visibilityComponent: VisibilityMapComponent,
    _x: number,
    _y: number,
): boolean {
    throw new Error("Not implemented");
}

export function isVisible(
    _visibilityComponent: VisibilityMapComponent,
    _x: number,
    _y: number,
): boolean {
    throw new Error("Not implemented");
}

export const VisibilityMapComponentId = "visibilityMap";
