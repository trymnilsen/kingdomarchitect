/**
 * A light source definition describes how strongly a single emitter lights the
 * world around it, expressed as two concentric radii (in tiles):
 *
 *   - within `brightRadius`            -> bright
 *   - beyond that, within `dimRadius`  -> dim
 *   - beyond `dimRadius`               -> contributes nothing
 *
 * A radius of 0 means that band is not emitted at all (not "just the centre
 * tile"). This is what lets the building self-glow profile emit dim-only by
 * setting `brightRadius: 0`.
 *
 * Definitions are data, not behaviour. Stage 2 grows this roster with the full
 * set of buildable light sources (torch, campfire, lamp post, great hearth,
 * shrine, everlight) and grows each entry with fuel and extinguish-difficulty
 * fields. Keeping that here means the {@link LightSourceComponent} stays a thin
 * reference and never changes shape as the system grows.
 */
export type LightSourceDefinition = {
    id: string;
    brightRadius: number;
    dimRadius: number;
};

/**
 * The brazier is the single placed source exercised in Stage 1: a bright pool
 * out to 2 tiles, fading to dim out to 4.
 */
export const brazierLightSource: LightSourceDefinition = {
    id: "brazier",
    brightRadius: 2,
    dimRadius: 4,
};

/**
 * The default emission for an ordinary building: its own tile and the cardinal
 * neighbours read dim, and nothing reads bright. Buildings glow faintly so the
 * places people live and work are never pitch dark, but only placed sources can
 * actually brighten an area — keeping placed light meaningful.
 */
export const buildingGlowLightSource: LightSourceDefinition = {
    id: "buildingGlow",
    brightRadius: 0,
    dimRadius: 1,
};

const lightSourceDefinitions: readonly LightSourceDefinition[] = [
    brazierLightSource,
    buildingGlowLightSource,
];

export function getLightSourceDefinition(
    id: string,
): LightSourceDefinition | undefined {
    return lightSourceDefinitions.find((definition) => definition.id === id);
}
