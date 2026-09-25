import { log } from "../../common/logging/logger.ts";
import {
    hexToRgb,
    rgbToHex,
    type RgbColor,
} from "../../common/color/hexColor.ts";
import type { Point } from "../../common/point.ts";
import { ChunkSize } from "./chunk.ts";

function prng(x: number, y: number, seed: number): number {
    const dot = x * 12.9898 + y * 78.233 + seed * 45.678;
    const sin = Math.sin(dot) * 43758.5453;
    return sin - Math.floor(sin);
}

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

    const globalX = chunkPos.x * ChunkSize + tilePos.x;
    const globalY = chunkPos.y * ChunkSize + tilePos.y;

    const offset = Math.floor((prng(globalX, globalY, 1) - 0.5) * maxVariation);
    return rgbToHex(shiftRgb(rgb, offset));
}

export function tileShadeIndex(
    worldX: number,
    worldY: number,
    maxVariation: number,
): number {
    const offset = Math.floor((prng(worldX, worldY, 1) - 0.5) * maxVariation);
    return offset + maxVariation / 2;
}

export function tileShades(baseHex: string, maxVariation: number): string[] {
    const rgb = hexToRgb(baseHex);
    const shades: string[] = [];
    for (let index = 0; index < maxVariation; index++) {
        shades.push(
            rgb ? rgbToHex(shiftRgb(rgb, index - maxVariation / 2)) : baseHex,
        );
    }
    return shades;
}

function shiftRgb(rgb: RgbColor, offset: number): RgbColor {
    return {
        r: Math.max(0, Math.min(255, rgb.r + offset)),
        g: Math.max(0, Math.min(255, rgb.g + offset)),
        b: Math.max(0, Math.min(255, rgb.b + offset)),
    };
}
