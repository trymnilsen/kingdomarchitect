import { midpointColor } from "../../common/color/hexColor.ts";
import { biomes, type BiomeType } from "./biome.ts";

/**
 * The tile fill used for a "dim" tile: visually halfway between a biome's dark
 * tint (its faded, not-currently-lit colour) and its full daylight colour. Dim is
 * therefore always less tinted than dark and more tinted than bright, derived from
 * the existing tint rather than authored by hand.
 *
 * Computed once from the static biome table — it never changes at runtime — so the
 * per-tile render path only looks it up. This is a pure derivation of constant
 * data, not a registration or other import-time side effect.
 */
export const biomeDimColors: Record<BiomeType, string> = Object.fromEntries(
    Object.entries(biomes).map(([type, biome]) => [
        type,
        midpointColor(biome.tint, biome.color),
    ]),
) as Record<BiomeType, string>;
