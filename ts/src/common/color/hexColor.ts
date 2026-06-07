import { log } from "../logging/logger.ts";

/**
 * An RGB colour with 0-255 channels. Kept as a plain object so it serializes
 * cleanly and carries no behaviour.
 */
export type RgbColor = {
    r: number;
    g: number;
    b: number;
};

/**
 * Converts a hex colour string (e.g. "#FF0000" or "#F00") to an {@link RgbColor},
 * or null when the string is not a valid hex colour.
 */
export function hexToRgb(hex: string): RgbColor | null {
    // Expand shorthand form (e.g. "03F") to "0033FF"
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (_, r, g, b) => {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : null;
}

/** Converts a single 0-255 channel to a clamped two-digit hex string. */
function componentToHex(c: number): string {
    const clamped = Math.max(0, Math.min(255, Math.round(c)));
    const hex = clamped.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

/** Converts an {@link RgbColor} to a "#rrggbb" hex string. */
export function rgbToHex(rgb: RgbColor): string {
    return (
        "#" +
        componentToHex(rgb.r) +
        componentToHex(rgb.g) +
        componentToHex(rgb.b)
    );
}

/**
 * Returns the colour halfway between two hex colours, channel by channel. Used to
 * derive the "dim" tile tint as the midpoint between a biome's dark tint and its
 * full daylight colour, so dim is always visually between the two without being
 * hand-authored. If either input is not a valid hex colour the first argument is
 * returned unchanged so a bad value degrades to the darker end rather than
 * throwing.
 *
 * @param a one end of the blend (the result leans here when an input is invalid)
 * @param b the other end of the blend
 */
export function midpointColor(a: string, b: string): string {
    const rgbA = hexToRgb(a);
    const rgbB = hexToRgb(b);
    if (!rgbA || !rgbB) {
        log.warn("Invalid hex colour passed to midpointColor", { a, b });
        return a;
    }

    return rgbToHex({
        r: (rgbA.r + rgbB.r) / 2,
        g: (rgbA.g + rgbB.g) / 2,
        b: (rgbA.b + rgbB.b) / 2,
    });
}
