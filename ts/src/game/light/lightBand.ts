/**
 * How brightly a single tile is lit. This is the illumination field's only
 * output: a global, per-tile band that every actor agrees on.
 *
 * `dark` is deliberately distinct from the fog-of-war "faded" state (a
 * discovered-but-not-currently-visible tile). They may render alike in a later
 * stage, but they mean different things — `dark` is "lit by nothing right now",
 * faded is "you remember this place but can't see it" — and are produced by
 * different systems. Keep them separate.
 */
export type LightBand = "bright" | "dim" | "dark";

const bandRank: Record<LightBand, number> = {
    dark: 0,
    dim: 1,
    bright: 2,
};

/**
 * Returns the stronger of two bands. Overlapping light sources take the
 * brightest band any one of them grants, never a sum — two dim rings do not add
 * up to bright, because illumination models how lit a place looks, not an
 * accumulating quantity.
 */
export function brightestBand(a: LightBand, b: LightBand): LightBand {
    return bandRank[a] >= bandRank[b] ? a : b;
}
