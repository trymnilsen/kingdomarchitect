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

/**
 * The fuel an emitter consumes once the fuel-consuming system exists (a later
 * stage). This is data only here: nothing in this slice burns or depletes. A
 * `"none"` source never runs down (it is fed by its structure, not a consumable);
 * a `"charcoal"` source draws on stored fuel. Charcoal may not yet exist as an
 * inventory item — this field encodes intent, not a live dependency.
 */
export type LightSourceFuel = "none" | "charcoal";

/**
 * How hard a source is to put out, for the future extinguish verb. `"easy"` and
 * `"hard"` gate that verb's effort; `"destroy"` means the source cannot be
 * extinguished at all and only goes away when its host is dismantled. It is named
 * "destroy" rather than "dismantle" because a light source need not be a building
 * — we may have non-building emitters later. Data only; no extinguish behaviour
 * is implemented here.
 */
export type LightSourceExtinguishDifficulty = "easy" | "hard" | "destroy";

export type LightSourceDefinition = {
    id: string;
    brightRadius: number;
    dimRadius: number;
    fuel: LightSourceFuel;
    extinguishDifficulty: LightSourceExtinguishDifficulty;
};

/**
 * The brazier is the single placed source exercised in Stage 1: a bright pool
 * out to 2 tiles, fading to dim out to 4.
 */
export const brazierLightSource: LightSourceDefinition = {
    id: "brazier",
    brightRadius: 2,
    dimRadius: 4,
    fuel: "charcoal",
    // A standing fixture, not lit by hand: putting it out takes real effort.
    extinguishDifficulty: "hard",
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
    // The glow is an emergent property of an occupied building, not a fire: it
    // has nothing to burn and cannot be "put out" — it only ends with the
    // building itself.
    fuel: "none",
    extinguishDifficulty: "destroy",
};

/**
 * A handheld torch: lights only its own tile and the cardinal neighbours, then
 * nothing. The cheapest, most disposable source — quick to light and quick to
 * snuff, so it carries no fuel and is trivially extinguished.
 */
export const torchLightSource: LightSourceDefinition = {
    id: "torch",
    brightRadius: 1,
    dimRadius: 1,
    fuel: "none",
    extinguishDifficulty: "easy",
};

/**
 * A campfire: a modest gathering light, bright in close and fading a little
 * further than the torch. It is fed (charcoal) but, being an open fire, is easy
 * to kick out.
 */
export const campfireLightSource: LightSourceDefinition = {
    id: "campfire",
    brightRadius: 2,
    dimRadius: 3,
    fuel: "charcoal",
    extinguishDifficulty: "easy",
};

/**
 * A lamp post: durable infrastructure with the widest dim reach of this slice.
 * Built to stay lit, so it draws on fuel and is hard to extinguish by hand.
 */
export const lampPostLightSource: LightSourceDefinition = {
    id: "lampPost",
    brightRadius: 2,
    dimRadius: 4,
    fuel: "charcoal",
    extinguishDifficulty: "hard",
};

const lightSourceDefinitions: readonly LightSourceDefinition[] = [
    brazierLightSource,
    buildingGlowLightSource,
    torchLightSource,
    campfireLightSource,
    lampPostLightSource,
];

export function getLightSourceDefinition(
    id: string,
): LightSourceDefinition | undefined {
    return lightSourceDefinitions.find((definition) => definition.id === id);
}
