import { log } from "../../common/logging/logger.ts";
import {
    hexToRgb,
    rgbToHex,
    type RgbColor,
} from "../../common/color/hexColor.ts";
import type { Point } from "../../common/point.ts";
import { ChunkSize } from "./chunk.ts";

/**
 * A value in [0, 1) that depends only on the coordinate and the seed. This is
 * the fract(sin(dot(...))) trick from shader code: no state, same answer every
 * time, which is what a tile needs to keep its colour across frames.
 */
function prng(x: number, y: number, seed: number): number {
    const dot = x * 12.9898 + y * 78.233 + seed * 45.678;
    const sin = Math.sin(dot) * 43758.5453;
    return sin - Math.floor(sin);
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
    chunkPos: Point,
    tilePos: Point,
    maxVariation: number = 20,
): string {
    const rgb = hexToRgb(baseHex);
    if (!rgb) {
        log.warn("Invalid baseHex color provided", { baseHex });
        return baseHex; // Return the original invalid string
    }

    // 1. Calculate global tile coordinates
    const globalX = chunkPos.x * ChunkSize + tilePos.x;
    const globalY = chunkPos.y * ChunkSize + tilePos.y;

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
