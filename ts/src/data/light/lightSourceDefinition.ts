/**
 * A light source definition describes how far a single emitter lights the world
 * around it, as one radius in tiles. Lit-ness is binary. A tile is either inside
 * some source's light or it is dark.
 *
 * A `lightRadius` of 0 lights exactly the emitter's own tile. There is no
 * "emits nothing" radius value. An entity that should emit nothing simply has no
 * {@link LightSourceComponent}.
 *
 * Definitions are data. The {@link LightSourceComponent} holds only a reference
 * to one, so an entity's emission changes by pointing at a different profile.
 *
 * Nothing burns fuel or gets extinguished yet. The two fields below record what
 * each source is meant to do when those verbs exist.
 */

/**
 * What an emitter burns. `"none"` never runs down because its structure feeds
 * it; `"charcoal"` draws on stored fuel.
 */
export type LightSourceFuel = "none" | "charcoal";

/**
 * How hard a source is to put out. `"destroy"` means it cannot be snuffed at
 * all and goes away only with its host, and is named for destruction rather
 * than dismantling because a light source need not be a building.
 */
export type LightSourceExtinguishDifficulty = "easy" | "hard" | "destroy";

export type LightSourceDefinition = {
    id: string;
    lightRadius: number;
    fuel: LightSourceFuel;
    extinguishDifficulty: LightSourceExtinguishDifficulty;
    /**
     * Whether this source's lit tiles count as hearthlight, the kingdom's home
     * region, when the source belongs to the player. Only deliberate placed
     * lights claim territory. Presence glows and ambient conveniences light
     * tiles without claiming them, so the home region cannot be dragged around
     * the map by whoever happens to be walking at night.
     */
    claimsHearthlight: boolean;
};

/**
 * The default emission for an ordinary building: its own tile and the cardinal
 * neighbours are lit. Buildings glow faintly so the places people live and work
 * are never pitch dark. The glow claims no hearthlight. A wall segment or a lone
 * farm in the wilderness is not home territory. Only deliberate placed light
 * sources (cresset, campfire, lamp post) claim.
 */
export const buildingGlowLightSource: LightSourceDefinition = {
    id: "buildingGlow",
    lightRadius: 1,
    // The glow is an emergent property of an occupied building rather than a
    // fire: it has nothing to burn and cannot be "put out". It only ends with
    // the building itself.
    fuel: "none",
    extinguishDifficulty: "destroy",
    claimsHearthlight: false,
};

/**
 * A placed cresset, a staked iron fire-basket: lights its own tile and the
 * cardinal neighbours. This is the cheapest and most disposable placed source,
 * quick to light and quick to snuff, so it carries no fuel and is trivially
 * extinguished.
 */
export const cressetLightSource: LightSourceDefinition = {
    id: "cresset",
    lightRadius: 1,
    fuel: "none",
    extinguishDifficulty: "easy",
    claimsHearthlight: true,
};

/**
 * A torch carried in the hand. It reaches as far as a cresset but claims no
 * hearthlight, which is the only reason it is a separate profile: a carried
 * claim would let a torchbearer walk home territory across the map, and would
 * nullify the defenders-inside-hearthlight gate, since a torchbearer always
 * stands inside their own claim.
 */
export const torchLightSource: LightSourceDefinition = {
    id: "torch",
    lightRadius: 1,
    fuel: "none",
    extinguishDifficulty: "easy",
    claimsHearthlight: false,
};

/**
 * A campfire: a modest gathering light. It is fed (charcoal) but, being an open
 * fire, is easy to kick out.
 */
export const campfireLightSource: LightSourceDefinition = {
    id: "campfire",
    lightRadius: 3,
    fuel: "charcoal",
    extinguishDifficulty: "easy",
    claimsHearthlight: true,
};

/**
 * A lamp post: durable infrastructure, built to stay lit, so it draws on fuel
 * and is hard to put out by hand.
 */
export const lampPostLightSource: LightSourceDefinition = {
    id: "lampPost",
    lightRadius: 4,
    fuel: "charcoal",
    extinguishDifficulty: "hard",
    claimsHearthlight: true,
};

/**
 * A worker's presence glow, not an in-world lantern. A worker at night shows as
 * a single lit tile with nothing around it, so the player never loses one in
 * the dark. It claims no hearthlight, for the same reason the carried torch
 * does not.
 */
export const workerGlowLightSource: LightSourceDefinition = {
    id: "workerGlow",
    lightRadius: 0,
    fuel: "none",
    extinguishDifficulty: "destroy",
    claimsHearthlight: false,
};

/**
 * The manned watchtower's beam. The radius here is an inert fallback. The real
 * shape arrives as a pattern written onto the component by the watch system, so
 * everything that reads lights (coverage, hearthlight, future fuel or lens work)
 * gets the searchlight for free without knowing towers exist.
 */
export const searchlightLightSource: LightSourceDefinition = {
    id: "searchlight",
    lightRadius: 0,
    fuel: "none",
    extinguishDifficulty: "destroy",
    claimsHearthlight: true,
};

const lightSourceDefinitions: readonly LightSourceDefinition[] = [
    buildingGlowLightSource,
    cressetLightSource,
    torchLightSource,
    campfireLightSource,
    lampPostLightSource,
    workerGlowLightSource,
    searchlightLightSource,
];

export function getLightSourceDefinition(
    id: string,
): LightSourceDefinition | undefined {
    return lightSourceDefinitions.find((definition) => definition.id === id);
}
