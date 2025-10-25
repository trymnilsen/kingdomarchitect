/**
 * Defines the structure for an RGB color.
 */
interface RgbColor {
    r: number;
    g: number;
    b: number;
}

/**
 * Defines a 2D position.
 */
interface Position {
    x: number;
    y: number;
}

// The fixed size of a chunk.
const CHUNK_SIZE = 8;

/**
 * A simple deterministic PRNG (Pseudo-Random Number Generator) based on tile coordinates and a seed.
 * This uses a common shader technique (fract(sin(dot(...)))) to get a pseudo-random,
 * deterministic value between 0.0 and 1.0 for any given coordinate.
 *
 * @param x - The global X coordinate.
 * @param y - The global Y coordinate.
 * @param seed - A seed value to get different results for the same coordinate.
 * @returns A deterministic float value between 0.0 and 1.0.
 */
function prng(x: number, y: number, seed: number): number {
    // Use large prime-like numbers for dot product
    const dot = x * 12.9898 + y * 78.233 + seed * 45.678;
    // Use sin and a large multiplier to create chaos
    const sin = Math.sin(dot) * 43758.5453;
    // Return the fractional part (fract())
    return sin - Math.floor(sin);
}

/**
 * Converts a hex color string (e.g., "#FF0000" or "#F00") to an RGB object.
 *
 * @param hex - The hex color string.
 * @returns An RgbColor object, or null if the hex is invalid.
 */
function hexToRgb(hex: string): RgbColor | null {
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

/**
 * Helper function to convert a single color component (0-255) to a two-digit hex string.
 * @param c - The color component value.
 * @returns A two-digit hex string.
 */
function componentToHex(c: number): string {
    // Clamp the value just in case
    const clamped = Math.max(0, Math.min(255, Math.round(c)));
    const hex = clamped.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

/**
 * Converts an RgbColor object to a hex color string.
 *
 * @param rgb - The RgbColor object.
 * @returns A hex color string (e.g., "#FF0000").
 */
function rgbToHex(rgb: RgbColor): string {
    return (
        "#" +
        componentToHex(rgb.r) +
        componentToHex(rgb.g) +
        componentToHex(rgb.b)
    );
}

/**
 * Generates a subtle, deterministic color variation for a specific tile within a chunk.
 *
 * @param baseHex - The base color in hex format (e.g., "#AA45B0").
 * @param chunkPos - The position of the chunk.
 * @param tilePos - The position of the tile *within* the chunk (0-7 for x and y).
 * @param maxVariation - The total range of variation (e.g., 20 means +/- 10).
 * @returns A new, varied hex color string.
 */
export function getTileColorVariation(
    baseHex: string,
    chunkPos: Position,
    tilePos: Position,
    maxVariation: number = 20,
): string {
    const rgb = hexToRgb(baseHex);
    if (!rgb) {
        console.warn(`Invalid baseHex color provided: ${baseHex}`);
        return baseHex; // Return the original invalid string
    }

    // 1. Calculate global tile coordinates
    const globalX = chunkPos.x * CHUNK_SIZE + tilePos.x;
    const globalY = chunkPos.y * CHUNK_SIZE + tilePos.y;

    const offset = Math.floor((prng(globalX, globalY, 1) - 0.5) * maxVariation);

    // 3. Apply offsets and clamp to the valid 0-255 range
    const newRgb: RgbColor = {
        r: Math.max(0, Math.min(255, rgb.r + offset)),
        g: Math.max(0, Math.min(255, rgb.g + offset)),
        b: Math.max(0, Math.min(255, rgb.b + offset)),
    };

    // 4. Convert back to hex
    return rgbToHex(newRgb);
}
