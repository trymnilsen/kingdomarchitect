import type { LightSourceDefinition } from "../../data/light/lightSourceDefinition.ts";

/**
 * Marks an entity as emitting light. The component is intentionally thin: it
 * only names which {@link LightSourceDefinition} describes its emission, so all
 * the data that grows over later stages (radii now, fuel and extinguish
 * difficulty later) lives in the definition and the component never changes
 * shape.
 *
 * Every emitter — a placed brazier or a building's faint self-glow — carries
 * this one component, so the illumination field gathers light by querying a
 * single component type with no per-source-kind branching.
 */
export type LightSourceComponent = {
    id: typeof LightSourceComponentId;
    sourceId: string;
};

export function createLightSourceComponent(
    sourceId: string,
): LightSourceComponent {
    return {
        id: LightSourceComponentId,
        sourceId,
    };
}

export const LightSourceComponentId = "LightSource";
