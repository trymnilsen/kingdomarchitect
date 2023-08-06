import { PerlinNoise } from "../../src/common/noise/perlin.js";
import { mkSimplexNoise } from "../../src/common/noise/simplex.js";
import { BitmapImage } from "../bitmapImage.js";
import * as path from "path";
import perlin from "perlin-simplex";

interface NoiseChunk {
    x: number;
    y: number;
    value: number;
}

function getBucketedValue(value: number): number {
    return value;

    if (value < 120) {
        return 0;
    } else {
        return 255;
    }
}

export async function makeMap() {
    const width = 256;
    const height = 256;
    const values: number[][] = [];
    const noiseGenerator = new PerlinNoise();
    const perlinGenerator = new perlin();

    const noise = mkSimplexNoise(() => Math.random());
    for (let x = 0; x < width; x++) {
        values[x] = [];
        for (let y = 0; y < height; y++) {
            const xCoord = Math.floor(x);
            const yCoord = Math.floor(y);
            const value = noiseGenerator.noise(x, y, 0.1, 1);
            values[x][y] = value;
        }
    }

    const bitmap = new BitmapImage(width, height);
    await bitmap.create();
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const value = values[x][y];
            const colorValue = Math.min(
                Math.max(0, Math.floor(((value + 1) / 2) * 255)),
                255
            );
            const bucketedValue = getBucketedValue(colorValue);
            try {
                bitmap.setPixel(x, y, {
                    alpha: 255,
                    red: bucketedValue,
                    green: bucketedValue,
                    blue: bucketedValue,
                });
            } catch (err) {
                console.error(
                    `Cannot set color for ${x} ${y}`,
                    colorValue,
                    value
                );
            }
        }
    }

    const filename = Math.floor(Date.now() / 1000) + ".png";
    await bitmap.write(path.join(process.cwd(), "build", "proc", filename));
}

makeMap();
