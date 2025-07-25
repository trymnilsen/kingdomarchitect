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
    visibilityComponent: VisibilityMapComponent,
    x: number,
    y: number,
): boolean {}

export function isVisible(
    visibilityComponent: VisibilityMapComponent,
    x: number,
    y: number,
): boolean {}

export const VisibilityMapComponentId = "visibilityMap";
