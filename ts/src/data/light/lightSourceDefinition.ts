/**
 * A light source definition describes how far a single emitter lights the world
 * around it, as one radius in tiles. Lit-ness is binary. A tile is either inside
 * some source's light or it is dark.
 *
 * A `lightRadius` of 0 lights exactly the emitter's own tile. There is no
 * "emits nothing" radius value. An entity that should emit nothing simply has no
 * {@link LightSourceComponent}.
 *
 * Definitions are data, not behaviour. Later stages grow each entry with live
 * fuel and extinguish behaviour. Keeping that here means the
 * {@link LightSourceComponent} stays a thin reference and never changes shape as
 * the system grows.
 */

/**
 * The fuel an emitter consumes once the fuel-consuming system exists (a later
 * stage). This is data only here: nothing in this slice burns or depletes. A
 * `"none"` source never runs down (it is fed by its structure rather than a
 * consumable). A `"charcoal"` source draws on stored fuel. This field encodes
 * intent rather than a live dependency.
 */
export type LightSourceFuel = "none" | "charcoal";

/**
 * How hard a source is to put out, for the future extinguish verb. `"easy"` and
 * `"hard"` gate that verb's effort. `"destroy"` means the source cannot be
 * extinguished at all and only goes away when its host is dismantled. It is named
 * "destroy" rather than "dismantle" because a light source need not be a
 * building. Data only here, no extinguish behaviour is implemented.
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
 * The brazier is the widest placed source: a standing fixture with a pool out to
 * 4 tiles.
 */
export const brazierLightSource: LightSourceDefinition = {
    id: "brazier",
    lightRadius: 4,
    fuel: "charcoal",
    // A standing fixture, not lit by hand: putting it out takes real effort.
    extinguishDifficulty: "hard",
    claimsHearthlight: true,
};

/**
 * The default emission for an ordinary building: its own tile and the cardinal
 * neighbours are lit. Buildings glow faintly so the places people live and work
 * are never pitch dark. The glow claims no hearthlight. A wall segment or a lone
 * farm in the wilderness is not home territory. Only deliberate light sources
 * (torch, brazier, campfire, lamp post) claim.
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
 * A placed torch: lights its own tile and the cardinal neighbours. This is the
 * cheapest and most disposable source, quick to light and quick to snuff, so it
 * carries no fuel and is trivially extinguished.
 */
export const torchLightSource: LightSourceDefinition = {
    id: "torch",
    lightRadius: 1,
    fuel: "none",
    extinguishDifficulty: "easy",
    claimsHearthlight: true,
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
 * A lamp post: durable infrastructure with the same reach as the brazier. Built
 * to stay lit, so it draws on fuel and is hard to extinguish by hand.
 */
export const lampPostLightSource: LightSourceDefinition = {
    id: "lampPost",
    lightRadius: 4,
    fuel: "charcoal",
    extinguishDifficulty: "hard",
    claimsHearthlight: true,
};

/**
 * A worker's presence glow. This is not an in-world lantern. A worker at night
 * is visible as a single lit tile with nothing around it, so the player never
 * loses a worker in the dark, while the lone pinprick in a black field heightens
 * the darkness instead of relieving it. It claims no hearthlight: if it did,
 * every worker would be walking home territory and the defenders-inside-
 * hearthlight gate would be meaningless, because every aggressive worker always
 * stands inside their own one-tile bubble.
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
    brazierLightSource,
    buildingGlowLightSource,
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
