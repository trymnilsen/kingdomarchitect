/**
 * Marks an entity as revealing the map around it and stores its discovery
 * radius in tiles. The movement-based discovery writer (`discoverAfterMovement`
 * via `discoverFootprint`) consumes this as the entity moves, stamping the
 * permanent discovered store. That write path is this component's whole
 * purpose. There is no render-time reach anymore: what the player currently
 * sees is decided by discovered-and-lit, never by a per-viewer range.
 *
 * The radius is derived on read (see {@link visionReachRadius}) so a future
 * modifier such as equipment or traits can change it without rebuilding stored
 * geometry.
 */
export type VisibilityComponent = {
    id: typeof VisibilityComponentId;
    baseReach: number;
};

export function createVisibilityComponent(
    baseReach: number,
): VisibilityComponent {
    return {
        id: VisibilityComponentId,
        baseReach,
    };
}

export const VisibilityComponentId = "visibility";
