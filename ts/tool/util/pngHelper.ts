import { PNGWithMetadata, PNG } from "pngjs";
import { PixelColor } from "./pixels.ts";
import { readFileSync } from "fs";

export function getPixelColor(
    png: PNGWithMetadata,
    x: number,
    y: number,
): PixelColor {
    const idx = (png.width * y + x) << 2;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    const a = png.data[idx + 3];

    return {
        red: r,
        green: g,
        blue: b,
        alpha: a,
    };
}

export function readPng(path: string): PNGWithMetadata {
    try {
        const data = readFileSync(path);
        const png = PNG.sync.read(data);
        return png;
    } catch (e: unknown) {
        console.error(`Failed to read png at ${path}`);
        throw e;
    }
}

export function createPng(width: number, height: number): PNG {
    const png = new PNG({
        width: width,
        height: height,
        filterType: -1,
    });

    for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
            const idx = (png.width * y + x) << 2;
            png.data[idx] = 255; // red
            png.data[idx + 1] = 255; // green
            png.data[idx + 2] = 255; // blue
            png.data[idx + 3] = 255; // alpha (0 is transparent)
        }
    }

    return png;
}
