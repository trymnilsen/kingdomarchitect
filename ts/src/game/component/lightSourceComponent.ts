import type { Point } from "../../common/point.ts";
import type { LightSourceDefinition } from "../../data/light/lightSourceDefinition.ts";

/**
 * Marks an entity as emitting light. Ppattern is null in the common case.
 * A non null array overrides the radius. This is how a light gets a
 * non-circular shape without. E.g the watchtower's rotating searchlight.
 */
export type LightSourceComponent = {
    id: typeof LightSourceComponentId;
    sourceId: string;
    pattern: Point[] | null;
    claimsHearthlight: boolean;
};

export function createLightSourceComponent(
    sourceId: string,
    claimsHearthlight: boolean = true,
    pattern: Point[] | null = null,
): LightSourceComponent {
    return {
        id: LightSourceComponentId,
        sourceId,
        pattern,
        claimsHearthlight,
    };
}

export const LightSourceComponentId = "LightSource";
