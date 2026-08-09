import type { Point } from "../../common/point.ts";
import type { LightSourceDefinition } from "../../data/light/lightSourceDefinition.ts";

/**
 * Marks an entity as emitting light. The component names which
 * {@link LightSourceDefinition} describes its emission and optionally carries a
 * pattern that overrides the definition's disc.
 *
 * `pattern` is explicitly null in the common case, meaning "a disc of the
 * definition's lightRadius". A present array means "exactly these offsets from
 * my position, verbatim". This is how a light gets a non-circular shape without
 * the coverage code knowing why: the watchtower's rotating searchlight writes
 * its wedge offsets here, and the collector just reads a pattern of light.
 *
 * Every emitter (a placed brazier, a building's faint self-glow, a worker's
 * presence glow, a tower's beam) carries this one component, so the coverage
 * field gathers light by querying a single component type with no
 * per-source-kind branching.
 */
export type LightSourceComponent = {
    id: typeof LightSourceComponentId;
    sourceId: string;
    pattern: Point[] | null;
};

export function createLightSourceComponent(
    sourceId: string,
    pattern: Point[] | null = null,
): LightSourceComponent {
    return {
        id: LightSourceComponentId,
        sourceId,
        pattern,
    };
}

export const LightSourceComponentId = "LightSource";
